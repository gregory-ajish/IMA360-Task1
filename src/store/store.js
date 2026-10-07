// store.js
// Central store — brings together every feature's slice into one store.
// Each key becomes state.weather, state.dashboard, state.views.

import { configureStore } from '@reduxjs/toolkit';
import weatherReducer from './weatherReducer';
import dashboardReducer from './dashboardReducer';
import viewsReducer from './viewsReducer';

export const store = configureStore({
  reducer: {
    weather: weatherReducer,
    dashboard: dashboardReducer,
    views: viewsReducer,
  },
});

export default store;
