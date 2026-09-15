// weatherApi.js
// Dedicated Axios API client & in-memory cache service for OpenWeatherMap API

import axios from 'axios';
import { toast } from 'react-toastify';

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

// ── In-Memory Cache Configuration (5-minute TTL) ─────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes Time-To-Live
const weatherCache = new Map(); // Stores cached responses keyed by "city-unit"

// Retrieves non-expired cached weather data for a city+unit pair (returns null if stale/missing)
export const getCached = (city, unit) => {
  const key = `${city.toLowerCase().trim()}-${unit}`;
  const cached = weatherCache.get(key);

  if (!cached) return null;

  const ageMs = Date.now() - cached.timestamp;
  if (ageMs > CACHE_TTL_MS) {
    weatherCache.delete(key);
    console.log(`Cache EXPIRED for "${key}" (age: ${Math.round(ageMs / 1000)}s)`);
    return null;
  }

  console.log(`Cache HIT for "${key}" (age: ${Math.round(ageMs / 1000)}s)`);
  return cached.data;
};

// Stores fresh weather data into the in-memory cache with current timestamp
export const setCache = (city, unit, data) => {
  const key = `${city.toLowerCase().trim()}-${unit}`;
  weatherCache.set(key, { data, timestamp: Date.now() });
  console.log(`Cache SET for "${key}"`);
};

// ── Axios Instance Configuration ─────────────────────────────────────────────
const weatherApi = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
  timeout: 8000, // 8-second request timeout
});

// ── Request Interceptor: Automatically attach API key ────────────────────────
weatherApi.interceptors.request.use(
  (config) => {
    config.params = {
      ...config.params,
      appid: OPENWEATHER_API_KEY,
    };
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Global Network Error Handling with Toastify ────────
weatherApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Request Timeout (ECONNABORTED)
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timed out. Please check your connection and try again.', {
        toastId: 'timeout-error',
      });
    }
    // 2. API Rate Limit Hit (HTTP 429)
    else if (error.response?.status === 429) {
      toast.warn('⚠️ API rate limit reached. Please wait a moment before searching again.', {
        toastId: 'rate-limit-error',
      });
    }
    // 3. Network Offline / Server Unreachable
    else if (!error.response && !axios.isCancel(error)) {
      toast.error('Network offline / Server unreachable. Please check your connection.', {
        toastId: 'network-error',
      });
    }
    // 4. Server Error (HTTP 5xx)
    else if (error.response?.status >= 500) {
      toast.error('Server error. Weather service is temporarily unavailable.', {
        toastId: 'server-error',
      });
    }

    // Re-throw so component catch blocks can handle business errors (e.g. 401, 404)
    return Promise.reject(error);
  }
);

export default weatherApi;

