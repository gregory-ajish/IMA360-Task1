// weatherActions.js
// This file ONLY holds the async thunk for weather.
// It calls the API, then the reducer (weatherReducer.js) handles the state changes
// via extraReducers responding to the thunk's pending/fulfilled/rejected lifecycle.

import { createAsyncThunk } from '@reduxjs/toolkit';
import weatherApi, { getCached, setCache } from '../api/weatherApi';

/**
 * Async Thunk for fetching weather and forecast data from OpenWeatherMap API.
 * Handles:
 *  1. In-memory cache verification (5-minute TTL)
 *  2. Concurrent API requests for current weather & 5-day / 3-hour forecast
 *  3. In-memory cache caching on successful network response
 *  4. Graceful error handling with rejectWithValue
 */
export const fetchWeatherThunk = createAsyncThunk(
  'weather/fetchWeather',
  async ({ city, unit = 'metric' }, { rejectWithValue }) => {
    try {
      const cleanCity = city?.trim() || 'Berlin';

      // 1. Check in-memory cache first to prevent duplicate network hits
      const cached = getCached(cleanCity, unit);
      if (cached) {
        return {
          weatherData: cached.weatherData,
          forecastData: cached.forecastData,
          city: cached.weatherData.name,
          unit,
          fromCache: true,
        };
      }

      // 2. Parallel network calls via weatherApi instance
      const [weatherRes, forecastRes] = await Promise.all([
        weatherApi.get('/weather', { params: { q: cleanCity, units: unit } }),
        weatherApi.get('/forecast', { params: { q: cleanCity, units: unit } }),
      ]);

      const data = {
        weatherData: weatherRes.data,
        forecastData: forecastRes.data,
      };

      // 3. Store fresh data in cache
      setCache(cleanCity, unit, data);

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
        message: err.response?.data?.message || err.message || 'Failed to fetch weather data',
      });
    }
  }
);
