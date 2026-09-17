// dashboardApi.js
// Mock API function that simulates fetching dashboard app data from a server.
// Returns the same data from apps.json after a fake delay (500ms),
// so the UI shows a loading state just like a real API call would.
// When a real backend is ready, replace this function with an actual API call.

import appsData from '../data/apps.json';

/**
 * Simulates an API call to fetch dashboard app categories.
 * Returns the apps.json data after a 500ms delay.
 *
 * @returns {Promise<Object>} - Resolves with { categories: [...] }
 */
export const fetchDashboardApps = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(appsData);
    }, 500); // 500ms fake delay to simulate network latency
  });
};
