// store.js
import { configureStore } from '@reduxjs/toolkit';
import weatherReducer from './reducers/weatherReducer';

export const store = configureStore({
  reducer: {
    weather: weatherReducer,
  },
});

export default store;
