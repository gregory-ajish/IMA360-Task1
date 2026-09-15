// weatherSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import weatherApi, { getCached, setCache } from '../api/weatherApi';

/**
 * Helper to process OpenWeather 5-day / 3-hour forecast list into a clean 7-day daily forecast list
 */
const processDailyForecast = (list = []) => {
  const dailyMap = {};
  list.forEach((item) => {
    const dateObj = new Date(item.dt * 1000);
    const dateKey = item.dt_txt ? item.dt_txt.split(' ')[0] : dateObj.toISOString().split('T')[0];
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const fullDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {
        dateKey,
        dayName,
        fullDate,
        dt: item.dt,
        tempMin: item.main.temp_min,
        tempMax: item.main.temp_max,
        weather: item.weather[0],
      };
    } else {
      dailyMap[dateKey].tempMin = Math.min(dailyMap[dateKey].tempMin, item.main.temp_min);
      dailyMap[dateKey].tempMax = Math.max(dailyMap[dateKey].tempMax, item.main.temp_max);
      if (item.dt_txt && item.dt_txt.includes('12:00')) {
        dailyMap[dateKey].weather = item.weather[0];
      }
    }
  });

  return Object.values(dailyMap).slice(0, 7);
};

/**
 * Helper to format raw hourly forecast list into time slots with day labels
 */
const processHourlyForecast = (list = []) => {
  return list.map((item) => {
    const dateObj = new Date(item.dt * 1000);
    const dateKey = item.dt_txt ? item.dt_txt.split(' ')[0] : dateObj.toISOString().split('T')[0];
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const shortDay = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

    return {
      dt: item.dt,
      dateKey,
      dayName,
      shortDay,
      timeStr,
      temp: Math.round(item.main.temp),
      weather: item.weather[0],
      pop: Math.round((item.pop || 0) * 100), // Precipitation probability %
      rainMm: item.rain ? item.rain['3h'] || 0 : 0,
    };
  });
};

// Async Thunk for fetching weather data
export const fetchWeatherThunk = createAsyncThunk(
  'weather/fetchWeather',
  async ({ city, unit = 'metric' }, { rejectWithValue }) => {
    try {
      // 1. Check cache first
      const cached = getCached(city, unit);
      if (cached) {
        return {
          weatherData: cached.weatherData,
          forecastData: cached.forecastData,
          city: cached.weatherData.name,
          unit,
          fromCache: true,
        };
      }

      // 2. Parallel network calls via weatherApi
      const [weatherRes, forecastRes] = await Promise.all([
        weatherApi.get('/weather', { params: { q: city.trim(), units: unit } }),
        weatherApi.get('/forecast', { params: { q: city.trim(), units: unit } }),
      ]);

      const data = {
        weatherData: weatherRes.data,
        forecastData: forecastRes.data,
      };

      // 3. Store in cache
      setCache(city, unit, data);

      return {
        weatherData: weatherRes.data,
        forecastData: forecastRes.data,
        city: weatherRes.data.name,
        unit,
        fromCache: false,
      };
    } catch (err) {
      return rejectWithValue({
        status: err.response?.status,
        message: err.message || 'Failed to fetch weather data',
      });
    }
  }
);

const initialState = {
  currentWeather: null,
  forecast: null,
  dailyForecast: [],
  hourlyForecast: [],
  city: 'Berlin',
  unit: 'metric', // 'metric' (°C) or 'imperial' (°F)
  selectedDay: '', // Selected day for hourly filter
  loading: false,
  error: null,
  isActivatingKey: false,
};

const weatherSlice = createSlice({
  name: 'weather',
  initialState,
  reducers: {
    setUnit: (state, action) => {
      state.unit = action.payload;
    },
    setCity: (state, action) => {
      state.city = action.payload;
    },
    setSelectedDay: (state, action) => {
      state.selectedDay = action.payload;
    },
    setDemoFallback: (state, action) => {
      state.currentWeather = action.payload.currentWeather;
      state.forecast = action.payload.forecast;
      state.dailyForecast = processDailyForecast(action.payload.forecast.list);
      state.hourlyForecast = processHourlyForecast(action.payload.forecast.list);
      state.loading = false;
      state.isActivatingKey = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWeatherThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeatherThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWeather = action.payload.weatherData;
        state.forecast = action.payload.forecastData;
        state.city = action.payload.city;
        state.unit = action.payload.unit;
        state.isActivatingKey = false;

        const processedDaily = processDailyForecast(action.payload.forecastData.list || []);
        state.dailyForecast = processedDaily;

        const processedHourly = processHourlyForecast(action.payload.forecastData.list || []);
        state.hourlyForecast = processedHourly;

        if (processedDaily.length > 0 && !state.selectedDay) {
          state.selectedDay = processedDaily[0].dayName;
        }
      })
      .addCase(fetchWeatherThunk.rejected, (state, action) => {
        state.loading = false;
        if (action.payload?.status === 401) {
          state.isActivatingKey = true;
        } else {
          state.error = action.payload?.message || 'Error loading weather data';
        }
      });
  },
});

export const { setUnit, setCity, setSelectedDay, setDemoFallback } = weatherSlice.actions;
export default weatherSlice.reducer;
