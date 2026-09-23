// viewsReducer.js
// ============================================================================
// PURPOSE:
//   Dedicated Reducer for managing Revenue Tracker saved views in Redux.
// ============================================================================

import { createReducer } from '@reduxjs/toolkit';
import {
  saveView,
  deleteView,
  setActiveView,
  loadSavedViews,
} from '../actions/viewsActions';

const STORAGE_KEY = 'revenue_saved_views';

/**
 * Safely load initial views from localStorage
 */
const getInitialSavedViews = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to load views from localStorage:', err);
  }
  return [];
};

/**
 * Initial state for the Views Redux slice
 */
export const initialState = {
  views: getInitialSavedViews(),
  activeViewId: null,
};

/**
 * Helper to persist views to localStorage
 */
const persistViews = (views) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
  } catch (err) {
    console.error('Failed to persist views to localStorage:', err);
  }
};

/**
 * Views Reducer responding to view actions
 */
const viewsReducer = createReducer(initialState, (builder) => {
  builder
    // 💾 Save a new view (or update existing if same name/id)
    .addCase(saveView, (state, action) => {
      const newView = action.payload;
      const existingIndex = state.views.findIndex(
        (v) => v.id === newView.id || v.name.toLowerCase() === newView.name.toLowerCase()
      );

      if (existingIndex >= 0) {
        state.views[existingIndex] = newView;
      } else {
        state.views.push(newView);
      }

      state.activeViewId = newView.id;
      persistViews(state.views);
    })

    // 🗑️ Delete an existing view by ID
    .addCase(deleteView, (state, action) => {
      const viewId = action.payload;
      state.views = state.views.filter((v) => v.id !== viewId);
      if (state.activeViewId === viewId) {
        state.activeViewId = null;
      }
      persistViews(state.views);
    })

    // 🎯 Set the active view
    .addCase(setActiveView, (state, action) => {
      state.activeViewId = action.payload;
    })

    // 🔄 Load saved views from external source / localStorage
    .addCase(loadSavedViews, (state, action) => {
      state.views = action.payload || [];
      persistViews(state.views);
    });
});

export default viewsReducer;
