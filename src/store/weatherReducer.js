// weatherReducer.js
// One file owns the weather state and how it changes.
// Uses createSlice (the simple, all-in-one Redux Toolkit function).
// Async thunk lives separately in weatherActions.js.

import { createSlice } from '@reduxjs/toolkit';
import { fetchWeatherThunk } from './weatherActions';

/**
 * Helper to process OpenWeather 5-day / 3-hour forecast list into a clean 7-day daily forecast list
 * Aggregates high/low temperatures per day and extracts midday weather conditions.
 */
export const processDailyForecast = (list = []) => {
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
 * Formats timestamps, rounds temperatures, and calculates rain probability.
 */
export const processHourlyForecast = (list = []) => {
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

/**
 * Weather slice — createSlice auto-generates action creators from the reducers object.
 */
const weatherSlice = createSlice({
  name: 'weather',
  initialState: {
    currentWeather: null,
    forecast: null,
    dailyForecast: [],
    hourlyForecast: [],
    city: 'Berlin',
    unit: 'metric',        // 'metric' (°C) or 'imperial' (°F)
    selectedDay: '',        // Selected day for hourly filter
    loading: false,
    error: null,
    isActivatingKey: false,
  },
  reducers: {
    // Switch temperature unit between 'metric' (°C) and 'imperial' (°F)
    setUnit: (state, action) => {
      state.unit = action.payload;
    },
    // Update the currently selected city name
    setCity: (state, action) => {
      state.city = action.payload;
    },
    // Select a specific day for filtering the hourly forecast
    setSelectedDay: (state, action) => {
      state.selectedDay = action.payload;
    },
    // Populate realistic demo fallback data (e.g. when API key is activating with 401)
    setDemoFallback: (state, action) => {
      state.currentWeather = action.payload.currentWeather;
      state.forecast = action.payload.forecast;
      state.dailyForecast = processDailyForecast(action.payload.forecast.list);
      state.hourlyForecast = processHourlyForecast(action.payload.forecast.list);
      state.loading = false;
      state.isActivatingKey = true;
    },
  },
  // extraReducers handles the async thunk lifecycle (pending/fulfilled/rejected)
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

        const processedDaily = processDailyForecast(action.payload.forecastData?.list || []);
        state.dailyForecast = processedDaily;

        const processedHourly = processHourlyForecast(action.payload.forecastData?.list || []);
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

// Auto-generated action creators from createSlice
export const { setUnit, setCity, setSelectedDay, setDemoFallback } = weatherSlice.actions;

// Default export is the reducer, plugs straight into store.js
export default weatherSlice.reducer;
