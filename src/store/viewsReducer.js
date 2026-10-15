// viewsReducer.js
// One file owns the views state and how it changes.
// Uses createSlice. No async work, so no separate actions file needed.

import { createSlice } from '@reduxjs/toolkit';

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
 * Views slice — manages Revenue Tracker saved views.
 * createSlice auto-generates action creators for each reducer entry.
 */
const viewsSlice = createSlice({
  name: 'views',
  initialState: {
    views: getInitialSavedViews(),
    activeViewId: null,
  },
  reducers: {
    // 💾 Save a new view (or update existing if same name/id)
    saveView: (state, action) => {
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
    },

    // 🗑️ Delete an existing view by ID
    deleteView: (state, action) => {
      const viewId = action.payload;
      state.views = state.views.filter((v) => v.id !== viewId);
      if (state.activeViewId === viewId) {
        state.activeViewId = null;
      }
      persistViews(state.views);
    },

    // 🎯 Set the active view
    setActiveView: (state, action) => {
      state.activeViewId = action.payload;
    },

    // 🔄 Load saved views from external source / localStorage
    loadSavedViews: (state, action) => {
      state.views = action.payload || [];
      persistViews(state.views);
    },
  },
});

// Auto-generated action creators from createSlice
export const { saveView, deleteView, setActiveView, loadSavedViews } = viewsSlice.actions;

// Default export is the reducer, plugs straight into store.js
export default viewsSlice.reducer;
