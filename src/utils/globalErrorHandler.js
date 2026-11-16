// globalErrorHandler.js
// ============================================================================
// PURPOSE:
//   Global safety listeners for unhandled JavaScript runtime errors and
//   unhandled promise rejections that occur outside React's render phase
//   (e.g., inside button click handlers, setTimeout, async API calls, workers).
//
// CAPABILITIES:
//   1. Listens to window.onerror & window.onunhandledrejection.
//   2. Ignores chunk load errors (handled by chunkErrorHandler.js).
//   3. Dispatches telemetry to monitoring service (e.g. Sentry) with source maps.
//   4. Alerts the user with non-intrusive, throttled toast notifications.
//   5. Provides defensive rendering helper `safeGet`.
// ============================================================================

import { toast } from 'react-toastify';
import { isChunkLoadError } from './chunkErrorHandler';

// Throttle toasts so a rapid error loop does not flood the UI with notifications
let lastToastTime = 0;
const TOAST_THROTTLE_MS = 3000;

/**
 * Normalizes an error from an event or rejection into a structured telemetry object.
 *
 * @param {unknown} error
 * @param {string} source
 * @returns {object}
 */
export const formatErrorPayload = (error, source = 'window.onerror') => {
  const message =
    error?.message || (typeof error === 'string' ? error : 'Unknown runtime error');
  const stack = error?.stack || null;
  const name = error?.name || 'Error';

  return {
    source,
    name,
    message,
    stack,
    url: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
};

/**
 * Sends caught error to configured monitoring tool (e.g., Sentry, Datadog)
 * and logs to the console with standardized diagnostics.
 *
 * @param {unknown} error
 * @param {object} context
 */
export const reportErrorToMonitoring = (error, context = {}) => {
  const payload = formatErrorPayload(error, context.source || 'manual');

  console.error('[GlobalErrorHandler]', payload.message, {
    ...payload,
    ...context,
  });

  // Forward to Sentry if initialized on window
  if (typeof window !== 'undefined' && window.Sentry?.captureException) {
    try {
      window.Sentry.captureException(error, { extra: { ...payload, ...context } });
    } catch {
      // Ignore monitoring dispatch failures in production
    }
  }
};

/**
 * Registers global safety listeners on window for unhandled exceptions
 * and rejected promises outside the React component lifecycle.
 */
export const registerGlobalErrorListeners = () => {
  if (typeof window === 'undefined') return;

  // 1. window.onerror - Catches unhandled runtime exceptions (button clicks, timers, etc.)
  window.addEventListener('error', (event) => {
    // If it's a chunk/bundle error, let chunkErrorHandler handle it
    if (isChunkLoadError(event.error)) {
      return;
    }

    const errorObj = event.error || new Error(event.message || 'Unknown runtime error');
    reportErrorToMonitoring(errorObj, {
      source: 'window.onerror',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });

    // Notify user with a friendly, throttled toast
    const now = Date.now();
    if (now - lastToastTime > TOAST_THROTTLE_MS) {
      lastToastTime = now;
      toast.error('An unexpected action error occurred. Please try again or refresh.', {
        toastId: 'global-unhandled-error',
      });
    }
  });

  // 2. window.onunhandledrejection - Catches unhandled Promise rejections (failed async APIs, fetches)
  window.addEventListener('unhandledrejection', (event) => {
    // If it's a chunk/bundle preload error, let chunkErrorHandler handle it
    if (isChunkLoadError(event.reason)) {
      return;
    }

    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason || 'Unhandled Promise Rejection'));

    reportErrorToMonitoring(error, { source: 'window.unhandledrejection' });

    // Notify user with a friendly, throttled toast
    const now = Date.now();
    if (now - lastToastTime > TOAST_THROTTLE_MS) {
      lastToastTime = now;
      toast.error('An asynchronous background task failed. Check your connection or try again.', {
        toastId: 'global-unhandled-rejection',
      });
    }
  });
};

/**
 * Defensive rendering helper: safely extracts a nested property with a fallback.
 * Prevents `TypeError: Cannot read properties of undefined/null` (e.g. user?.profile?.name).
 *
 * @example
 * safeGet(() => user.profile.name, 'Anonymous')
 *
 * @param {() => any} accessorFn
 * @param {any} fallback
 * @returns {any}
 */
export const safeGet = (accessorFn, fallback = null) => {
  try {
    const val = accessorFn();
    return val !== undefined && val !== null ? val : fallback;
  } catch {
    return fallback;
  }
};

