// dashboardReducer.js
// Dedicated reducer for Dashboard state management
// Handles the async thunk lifecycle (pending/fulfilled/rejected)

import { createReducer } from '@reduxjs/toolkit';
import { fetchDashboardThunk } from '../actions/dashboardActions';

/**
 * Initial state for Dashboard store slice
 */
export const initialState = {
  categories: [],   // App categories from apps.json (populated after mock API call)
  loading: false,   // true while the mock API "fetch" is in progress
  error: null,      // Error message if the fetch fails
};

/**
 * Dashboard Reducer responding to async thunk lifecycle cases
 */
const dashboardReducer = createReducer(initialState, (builder) => {
  builder
    // 🟡 PENDING — mock API call started → show loading state
    .addCase(fetchDashboardThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    // 🟢 FULFILLED — mock API returned data → store the categories
    .addCase(fetchDashboardThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.categories = action.payload.categories;
    })
    // 🔴 REJECTED — mock API failed → store the error
    .addCase(fetchDashboardThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || 'Failed to load dashboard apps';
    });
});

export default dashboardReducer;
