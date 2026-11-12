// chunkErrorHandler.js
// ============================================================================
// PURPOSE:
//   Handles Vite bundle/chunk loading failures caused by:
//     1. Stale tab after a new deployment (old hashed chunk returns 404)
//     2. Network drop during lazy route navigation
//     3. Corporate proxy / firewall blocking dynamic chunk scripts
//
// STRATEGY:
//   - Auto-refresh once per browser session using a sessionStorage guard so a
//     stale index.html fetches the latest manifest/chunks without looping.
//   - If a chunk still fails after the single reload, let the error propagate
//     to <ChunkErrorBoundary> so the user sees a manual recovery card.
// ============================================================================

import React from 'react';

export const CHUNK_RELOAD_STORAGE_KEY = 'vite_chunk_reload_attempted';

const CHUNK_ERROR_PATTERNS = [
  'ChunkLoadError',
  'Loading chunk',
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
  'Unable to preload CSS',
];

/**
 * Checks whether an error object represents a dynamic bundle/chunk load failure.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
export const isChunkLoadError = (error) => {
  if (!error) return false;
  const name = typeof error.name === 'string' ? error.name : '';
  const message = typeof error.message === 'string' ? error.message : String(error);

  return CHUNK_ERROR_PATTERNS.some(
    (pattern) => name.includes(pattern) || message.includes(pattern)
  );
};

/**
 * Reloads the page at most once per browser tab session when a chunk fails.
 * Returns true if a reload was initiated, or false if already attempted.
 *
 * @returns {boolean}
 */
export const attemptChunkReloadOnce = () => {
  try {
    const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY) === 'true';
    if (!alreadyReloaded) {
      sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, 'true');
      window.location.reload();
      return true;
    }
  } catch {
    // sessionStorage may be blocked in strict privacy modes; avoid infinite reload loops
  }
  return false;
};

/**
 * Registers Vite's built-in `vite:preloadError` listener at app startup.
 * Automatically refreshes once per session on failed chunk preloads, and lets
 * subsequent failures propagate to the surrounding ErrorBoundary.
 */
export const registerVitePreloadErrorHandler = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('vite:preloadError', (event) => {
    const reloaded = attemptChunkReloadOnce();
    if (reloaded) {
      // Prevent Vite from throwing immediately while the browser reloads
      event.preventDefault();
    }
  });
};

/**
 * Wraps React.lazy() so dynamic import rejections (including dev mode or
 * non-preload chunk errors) share the same one-time reload guard before
 * surfacing to ChunkErrorBoundary.
 *
 * @param {() => Promise<{ default: React.ComponentType<any> }>} importFn
 * @returns {React.LazyExoticComponent<React.ComponentType<any>>}
 */
export const lazyWithRetry = (importFn) =>
  React.lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      if (isChunkLoadError(error) && attemptChunkReloadOnce()) {
        // Keep Suspense pending while browser reloads instead of flashing fallback error UI
        return new Promise(() => { });
      }
      throw error;
    }
  });

