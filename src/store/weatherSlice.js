// weatherSlice.js
// Module entry-point re-exporting weather actions and weather reducer.
// Maintains backward compatibility with existing component imports while
// cleanly separating action creators and reducer logic.

export * from './actions/weatherActions';
export * from './reducers/weatherReducer';
export { default } from './reducers/weatherReducer';
