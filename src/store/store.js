// store.js
import { configureStore } from '@reduxjs/toolkit';
import weatherReducer from './reducers/weatherReducer';
import dashboardReducer from './reducers/dashboardReducer';

export const store = configureStore({
  reducer: {
    weather: weatherReducer,
    dashboard: dashboardReducer,
  },
});

export default store;
