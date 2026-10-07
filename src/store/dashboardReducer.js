// dashboardReducer.js
// One file owns the dashboard state and how it changes.
// Uses createSlice. Async thunk lives in dashboardActions.js.

import { createSlice } from '@reduxjs/toolkit';
import { fetchDashboardThunk } from './dashboardActions';

/**
 * Dashboard slice — handles app categories loaded from mock API.
 */
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    categories: [],   // App categories from apps.json (populated after mock API call)
    loading: false,   // true while the mock API "fetch" is in progress
    error: null,      // Error message if the fetch fails
  },
  reducers: {
    // No sync actions needed for dashboard right now.
    // If you add any later, just put them here and they auto-generate action creators.
  },
  // extraReducers handles the async thunk lifecycle (pending/fulfilled/rejected)
  extraReducers: (builder) => {
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
  },
});

// Default export is the reducer, plugs straight into store.js
export default dashboardSlice.reducer;
