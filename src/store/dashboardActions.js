// dashboardActions.js
// This file ONLY holds the async thunk for dashboard.
// It calls the mock API, then the reducer (dashboardReducer.js) handles the state changes
// via extraReducers responding to the thunk's pending/fulfilled/rejected lifecycle.

import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchDashboardApps } from '../api/dashboardApi';

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
