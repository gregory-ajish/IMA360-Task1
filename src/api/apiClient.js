// apiClient.js
// ============================================================================
// PURPOSE:
//   Centralized Axios HTTP client fulfilling Category 3 & Category 4:
//   - Category 3: Centralized API handling (400, 401, 403, 404, 422, 429, Offline, Timeout)
//   - Category 4: 5xx Server Errors & Selective Auto-Retry for safe HTTP methods (GET, HEAD, OPTIONS)
// ============================================================================

import axios from 'axios';
import { toast } from 'react-toastify';

// Safe idempotent HTTP methods eligible for selective auto-retry
const SAFE_IDEMPOTENT_METHODS = ['get', 'head', 'options'];
const MAX_AUTO_RETRIES = 2;

/**
 * Creates the centralized Axios instance
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000, // 10-second request timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── 1. REQUEST INTERCEPTOR: Token Injection & Offline Fast-Fail ─────────────
apiClient.interceptors.request.use(
  (config) => {
    // Built-in testing simulator: allows instant local testing of 401, 403, 404, 429, 500 without external network dependencies
    if (config.url?.startsWith('/mock-status/')) {
      const mockStatus = parseInt(config.url.replace('/mock-status/', ''), 10);
      const mockError = new Error(`Request failed with status code ${mockStatus}`);
      mockError.response = {
        status: mockStatus,
        data: { message: `Simulated HTTP ${mockStatus} response for testing` },
        headers: {},
        config,
      };
      return Promise.reject(mockError);
    }

    // 3.a Fast-fail if browser device is completely offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const offlineError = new Error('Network offline. Please check your internet connection.');
      offlineError.isOffline = true;
      return Promise.reject(offlineError);
    }

    // 3.b Automatic Authorization token injection
    try {
      const token =
        localStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        JSON.parse(localStorage.getItem('app_user') || '{}')?.token;

      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Fallback if parsing fails
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── 2. RESPONSE INTERCEPTOR: Selective Retry & Status-Code Handling ────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error.response?.status;
    const method = (config?.method || 'get').toLowerCase();

    // ─── CATEGORY 4: 5xx Server Errors & Selective Auto-Retry ───────────────
    // Automatically retry ONLY safe idempotent methods (GET, HEAD, OPTIONS).
    // Never auto-retry non-idempotent mutations (POST, PATCH, DELETE) to prevent duplicate operations!
    const isServerError = status >= 500 && status <= 599;
    const isNetworkOrTimeout = !error.response && (error.code === 'ECONNABORTED' || error.message?.includes('timeout'));
    const isSafeMethod = SAFE_IDEMPOTENT_METHODS.includes(method);

    if (config && isSafeMethod && (isServerError || isNetworkOrTimeout)) {
      config.__retryCount = config.__retryCount || 0;

      if (config.__retryCount < MAX_AUTO_RETRIES) {
        config.__retryCount += 1;
        const delayMs = config.__retryCount * 1000; // Exponential backoff: 1s, 2s

        console.warn(
          `[apiClient] Auto-retrying ${method.toUpperCase()} request (attempt ${config.__retryCount}/${MAX_AUTO_RETRIES}) after ${delayMs}ms:`,
          config.url
        );

        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return apiClient(config);
      }
    }

    // ─── CATEGORY 3: Centralized Status Code Handling & Notifications ─────────
    if (error.isOffline || (!error.response && typeof navigator !== 'undefined' && !navigator.onLine)) {
      // 3.a Offline / No Internet
      toast.error('Network offline. Please check your internet connection.', {
        toastId: 'api-offline-error',
      });
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      // 3.a Timeout
      toast.error('Request timed out. The server took too long to respond.', {
        toastId: 'api-timeout-error',
      });
    } else if (!error.response) {
      // Network drop / empty response / server unreachable
      toast.error('Network error / Server unreachable. Please check your connection.', {
        toastId: 'api-network-unreachable',
      });
    } else if (status) {
      switch (status) {
        case 400:
        case 422: {
          // 400/422: Bad form data
          const validationMsg =
            error.response?.data?.message ||
            error.response?.data?.error ||
            'Invalid request. Please check your input.';
          toast.error(validationMsg, { toastId: 'api-bad-request' });
          break;
        }

        case 401: {
          // 401: Unauthorized / expired token
          toast.error('Session expired or unauthorized. Please log in again.', {
            toastId: 'api-unauthorized',
          });
          // Dispatch session expired event so AuthContext can clean up
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:expired'));
          }
          break;
        }

        case 403: {
          // 403: Logged in but role not allowed (e.g. Normal user trying to access Admin action)
          toast.error('Access denied. You do not have permission to perform this action.', {
            toastId: 'api-forbidden',
          });
          break;
        }

        case 404: {
          // 404: Not Found
          toast.error('The requested resource was not found (404).', {
            toastId: 'api-not-found',
          });
          break;
        }

        case 429: {
          // 429: Too many requests from client side (rate limit)
          toast.warn('Rate limit reached. Please wait a moment before trying again.', {
            toastId: 'api-rate-limit',
          });
          break;
        }

        case 500:
        case 502:
        case 503:
        case 504: {
          // 5xx Server Errors (after selective retry exhausted)
          const errorLabels = {
            500: 'Internal Server Error (500)',
            502: 'Bad Gateway (502)',
            503: 'Service Unavailable (503)',
            504: 'Gateway Timeout (504)',
          };
          const label = errorLabels[status] || `Server Error (${status})`;
          toast.error(`${label}: The service is temporarily unavailable.`, {
            toastId: `api-server-${status}`,
          });
          break;
        }

        default:
          toast.error(`Request failed with status ${status}.`, {
            toastId: 'api-generic-error',
          });
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

