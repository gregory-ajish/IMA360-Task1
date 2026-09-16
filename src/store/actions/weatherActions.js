// weatherActions.js
// Dedicated action creators and asynchronous thunks for Weather state management

import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import weatherApi, { getCached, setCache } from '../../api/weatherApi';

// ─── Synchronous Action Creators ─────────────────────────────────────────────
/**
 * Action to switch temperature unit between 'metric' (°C) and 'imperial' (°F)
 */
export const setUnit = createAction('weather/setUnit');

/**
 * Action to update the currently selected city name
 */
export const setCity = createAction('weather/setCity');

/**
 * Action to select a specific day for filtering the hourly forecast
 */
export const setSelectedDay = createAction('weather/setSelectedDay');

/**
 * Action to populate realistic demo fallback data (e.g. when API key is activating with 401)
 */
export const setDemoFallback = createAction('weather/setDemoFallback');

// ─── Asynchronous Thunks ─────────────────────────────────────────────────────
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
