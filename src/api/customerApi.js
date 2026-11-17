// src/api/customerApi.js
// ============================================================================
// PURPOSE:
//   API service for customer domain operations, including scale tier lookups.
// ============================================================================

import { apiClient } from './apiClient.js';

/**
 * Fetches the scale tiers and discount data for a specific customer.
 * Corresponds to: GET /scales?customerId=${customerId}
 *
 * @param {string|number} customerId - Customer row identifier
 * @returns {Promise<Array<Object>>} Resolves with array of scale tier objects
 */
export const fetchCustomerScales = async (customerId) => {
  try {
    const response = await apiClient.get(`/scales?customerId=${customerId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.error(`[customerApi] Failed to fetch scales for customer ${customerId}:`, err);
    throw err;
  }
};
