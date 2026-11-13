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

export const ERROR_CATEGORIES = {
  // Category 1: Bundle / Chunk Errors (from Production Error Guide 1.a)
  STALE_DEPLOYMENT: 'STALE_DEPLOYMENT', // 1.a Scenario 1: Stale Tab after deployment (404 on old hash)
  NETWORK_DROP: 'NETWORK_DROP',         // 1.a Scenario 2: Network Drop in mid navigation (fetch chunk fails)
  BLOCKED_SCRIPT: 'BLOCKED_SCRIPT',     // 1.a Scenario 3: Blocked Script (corporate proxy blocks chunk)

  // Category 2: React UI / Code Errors (from Production Error Guide 2.a)
  PAGE_BROKEN: 'PAGE_BROKEN',

  // Backward-compatibility aliases
  NEW_RELEASE: 'STALE_DEPLOYMENT',
  OFFLINE: 'NETWORK_DROP',
  BLOCKED: 'BLOCKED_SCRIPT',
};

/**
 * Classifies an error into specific, actionable categories for the recovery UI.
 * Directly maps to Category 1 (Bundle/Chunks) and Category 2 (React UI/Code) scenarios.
 *
 * @param {unknown} error
 * @returns {{
 *   category: 'STALE_DEPLOYMENT' | 'NETWORK_DROP' | 'BLOCKED_SCRIPT' | 'PAGE_BROKEN',
 *   title: string,
 *   description: string,
 *   actionText: string,
 *   badgeColor: string,
 *   isChunk: boolean,
 *   allowRetry: boolean,
 *   badgeType: 'warning' | 'info' | 'error' | 'security'
 * }}
 */
export const classifyError = (error) => {
  const errorMsg = typeof error?.message === 'string' ? error.message : String(error || '');
  const errorName = typeof error?.name === 'string' ? error.name : '';
  const fullErrorText = `${errorName} ${errorMsg}`.toLowerCase();

  const isChunk = isChunkLoadError(error);

  if (isChunk) {
    // Category 1.a Scenario 2: Network Drop in mid navigation
    // User loses connection right as React.lazy() tries to fetch the code chunk
    const isNetworkDrop =
      (typeof navigator !== 'undefined' && navigator.onLine === false) ||
      /offline|net::err_internet_disconnected|networkerror/i.test(fullErrorText);

    if (isNetworkDrop) {
      return {
        category: ERROR_CATEGORIES.NETWORK_DROP,
        title: 'Navigation Interrupted',
        description:
          'A network drop interrupted downloading this page chunk during navigation. Please check your connection and reload the page.',
        actionText: 'Reload Page',
        badgeColor: '#f59e0b',
        badgeType: 'warning',
        isChunk: true,
        allowRetry: true,
      };
    }

    // Category 1.a Scenario 3: Blocked Script
    // Corporate proxy or security policy blocked dynamic chunk request
    const isBlocked =
      fullErrorText.includes('blocked') ||
      fullErrorText.includes('err_blocked_by_client') ||
      fullErrorText.includes('cors') ||
      fullErrorText.includes('security') ||
      fullErrorText.includes('content security policy') ||
      fullErrorText.includes('extension');

    if (isBlocked) {
      return {
        category: ERROR_CATEGORIES.BLOCKED_SCRIPT,
        title: 'Script Blocked by Proxy',
        description:
          'A corporate proxy, firewall, or security policy blocked loading this dynamic chunk script. Please check your network security settings or whitelist this domain.',
        actionText: 'Reload Page',
        badgeColor: '#d97706',
        badgeType: 'security',
        isChunk: true,
        allowRetry: false,
      };
    }

    // Category 1.a Scenario 1: Stale Tab after deployment
    // Browser cache references old hashed chunk which returns 404
    return {
      category: ERROR_CATEGORIES.STALE_DEPLOYMENT,
      title: 'New Version Available',
      description:
        'A new application release was deployed and an older bundle version was requested. Please reload the page so the latest files are fetched.',
      actionText: 'Reload Page',
      badgeColor: '#0284c7',
      badgeType: 'info',
      isChunk: true,
      allowRetry: false,
    };
  }

  // Category 2: React UI / Code Errors (runtime component error)
  return {
    category: ERROR_CATEGORIES.PAGE_BROKEN,
    title: 'Page Encountered an Error',
    description:
      'An unexpected application error occurred while rendering this page component. You can try again or reload the page to restore your session.',
    actionText: 'Reload Page',
    badgeColor: '#ef4444',
    badgeType: 'error',
    isChunk: false,
    allowRetry: true,
  };
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

