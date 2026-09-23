// viewsActions.js
// ============================================================================
// PURPOSE:
//   Action creators for managing Revenue Tracker table views in Redux.
// ============================================================================

import { createAction } from '@reduxjs/toolkit';

/**
 * Save a new table view configuration into Redux.
 * Payload: { id, name, visibleColumns, hiddenColumns, createdAt }
 */
export const saveView = createAction('views/saveView');

/**
 * Delete an existing view by its unique ID.
 * Payload: viewId (string)
 */
export const deleteView = createAction('views/deleteView');

/**
 * Set the currently active / applied view.
 * Payload: viewId (string or null)
 */
export const setActiveView = createAction('views/setActiveView');

/**
 * Hydrate saved views from localStorage into Redux state on initial load.
 * Payload: views (array)
 */
export const loadSavedViews = createAction('views/loadSavedViews');
