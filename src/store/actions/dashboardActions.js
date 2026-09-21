// dashboardActions.js
// Dedicated action creators and asynchronous thunk for Dashboard state management

import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchDashboardApps } from '../../api/dashboardApi';

// ─── Asynchronous Thunk ──────────────────────────────────────────────────────
/**
 * Async Thunk for fetching dashboard app categories from the mock API.
 * Calls the mock API function (which returns apps.json data after a fake delay).
 * When a real backend is ready, only dashboardApi.js needs to change — this thunk stays the same.
 */
export const fetchDashboardThunk = createAsyncThunk(
  'dashboard/fetchApps',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchDashboardApps();
      return data; // { categories: [...] } — becomes action.payload in the reducer
    } catch (err) {
      return rejectWithValue({
        message: err.message || 'Failed to fetch dashboard apps',
      });
    }
  }
);
