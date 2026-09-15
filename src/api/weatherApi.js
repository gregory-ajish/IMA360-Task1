// weatherApi.js
// ============================================================================
// PURPOSE:
//   Dedicated Axios instance for all OpenWeatherMap API calls.
//   - Centralizes base URL and default configuration in one place.
//   - Uses a REQUEST interceptor to automatically attach the API key.
//   - Uses a RESPONSE interceptor to globally handle network-level errors
//     (timeout, rate limit, offline) with toast notifications so that
//     individual components never need to worry about these cases.
//   - Exports a client-side in-memory CACHE (Idea #4) so repeated searches
//     for the same city return instantly with 0 network requests.
// ============================================================================

import axios from 'axios';
import { toast } from 'react-toastify';

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [Change #4] ❌ OLD APPROACH — No Cache
// Every single search (even re-searching the same city) made 2 fresh network
// requests. This wastes bandwidth, burns through the 60 req/min API rate
// limit, and forces the user to stare at the loading spinner unnecessarily.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// [Change #4] ✅ NEW — Client-Side In-Memory Cache
//
// What it does:
//   A JavaScript Map where each key is a unique "city-unit" combination
//   (e.g., "london-metric" or "paris-imperial") and each value stores:
//     - data: the { weatherData, forecastData } object from the last fetch
//     - timestamp: when it was stored (used to check if it has expired)
//
// How TTL (Time To Live) works:
//   CACHE_TTL_MS = 5 minutes. When getCached() is called, it checks whether
//   the entry is older than 5 minutes. If yes, it deletes it and returns null
//   (forcing a fresh network request). If no, it returns the cached data.
//
// Why 5 minutes?
//   Weather data doesn't change every second. 5 minutes is a good balance
//   between freshness and performance. This is configurable.
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
const weatherCache = new Map(); // Stores all cached weather entries

/**
 * Retrieves cached weather data for a city+unit pair if it exists and hasn't expired.
 * Returns the cached { weatherData, forecastData } object, or null if not found/expired.
 */
export const getCached = (city, unit) => {
  const key = `${city.toLowerCase().trim()}-${unit}`;
  const cached = weatherCache.get(key);

  if (!cached) return null; // Nothing stored for this city

  const ageMs = Date.now() - cached.timestamp;
  if (ageMs > CACHE_TTL_MS) {
    // Entry is stale (older than 5 minutes) — remove it and force a fresh fetch
    weatherCache.delete(key);
    console.log(`Cache EXPIRED for "${key}" (age: ${Math.round(ageMs / 1000)}s)`);
    return null;
  }

  console.log(`Cache HIT for "${key}" (age: ${Math.round(ageMs / 1000)}s — fresh for ${Math.round((CACHE_TTL_MS - ageMs) / 1000)}s more)`);
  return cached.data;
};

/**
 * Stores fresh weather data into the cache for a city+unit pair.
 * Automatically records the current timestamp for TTL expiry checks.
 */
export const setCache = (city, unit, data) => {
  const key = `${city.toLowerCase().trim()}-${unit}`;
  weatherCache.set(key, { data, timestamp: Date.now() });
  console.log(`Cache SET for "${key}"`);
};


// Create a reusable Axios instance with the OpenWeather base URL
const weatherApi = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
  timeout: 8000, // Abort request if it takes longer than 8 seconds
});

// ── Request Interceptor ──────────────────────────────────────────────────────
// Automatically attach the API key to every request's query parameters.
// This means individual API calls never need to manually include `appid`.
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [Change #3] ❌ OLD APPROACH — No Response Interceptor
// Without this, every page/component had to manually handle network-level
// failures like timeouts, rate limits, or offline scenarios in its own
// catch block. If 3 pages used the API, all 3 needed the same repetitive
// error-handling logic. Adding a new error type meant editing every file.
//
// Example of what WeatherPage.jsx had to do manually:
// } catch (err) {
//   if (err.code === 'ECONNABORTED') setError('Request timed out...');
//   else if (err.response?.status === 429) setError('Rate limit hit...');
//   else if (!err.response) setError('No internet connection...');
// }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// [Change #3] ✅ NEW APPROACH — Centralised Global Error Handling with Toast Notifications
//
// How it works:
//   - The FIRST function (onFulfilled) handles successful responses (HTTP 2xx).
//     We simply pass them through untouched.
//   - The SECOND function (onRejected) handles ALL failed responses globally.
//     It fires for every error from every API call made via this instance.
//     We inspect the error type and show the appropriate toast — then we still
//     re-throw the error so the component's own catch block can also run if
//     it needs to handle 401/404 logic (like showing the fallback data).
//
// Benefits:
//   - Zero duplicate error code across components.
//   - Add a new error case here once → every page benefits automatically.
weatherApi.interceptors.response.use(
  // ✅ Success path — response is 2xx, just pass it through unchanged
  (response) => response,

  // ❌ Error path — fires for every non-2xx response or network failure
  (error) => {
    // --- Case 1: Request Timeout ---
    // `ECONNABORTED` is Axios's error code when the `timeout` (8000ms above)
    // is exceeded. The server took too long and we aborted the connection.
    if (error.code === 'ECONNABORTED') {
      toast.error('⏱️ Request timed out. Please check your connection and try again.', {
        toastId: 'timeout-error', // Prevents duplicate toasts if clicked rapidly
      });
    }

    // --- Case 2: API Rate Limit Hit (HTTP 429 Too Many Requests) ---
    // OpenWeather free tier allows 60 calls/minute. If exceeded, the server
    // responds with status 429. We inform the user to wait before retrying.
    else if (error.response?.status === 429) {
      toast.warn('⚠️ API rate limit reached. Please wait a moment before searching again.', {
        toastId: 'rate-limit-error',
      });
    }

    // --- Case 3: No Internet / Server Completely Unreachable ---
    // If `error.response` is undefined, the request never reached the server.
    // This typically means the user's device is offline or DNS failed.
    // Note: We skip this for cancelled requests (AbortController from Idea #2).
    else if (!error.response && !axios.isCancel(error)) {
      toast.error('📡 Network offline / Server unreachable. Please check your connection.', {
        toastId: 'network-error',
      });
    }

    // --- Case 4: Internal Server Error (HTTP 5xx) ---
    // Server responded with 500/502/503. The server experienced an error.
    else if (error.response?.status >= 500) {
      toast.error('🔥 Server error. Weather service is temporarily unavailable.', {
        toastId: 'server-error',
      });
    }

    // Always re-throw the error so the component's own catch block still runs.
    // This is critical — WeatherPage.jsx still needs to handle 401 (fallback
    // data) and 404 (city not found), which are business-logic errors, not
    // generic network errors.
    return Promise.reject(error);
  }
);

export default weatherApi;
