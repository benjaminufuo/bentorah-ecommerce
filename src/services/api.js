/**
 * BENTORAH Central API Client
 * ============================================================
 * Centralized Axios client & HTTP transport layer.
 * All API communication throughout Bentorah passes through this service.
 *
 * Configurable via environment variables:
 *   - VITE_API_BASE_URL: Target backend API (e.g. 'http://localhost:5000/api')
 *   - VITE_USE_MOCK: Set to 'false' to route all calls to the real backend.
 * ============================================================
 */

import axios from 'axios';

// Environment configuration — avoids hardcoded localhost URLs
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Toggle between mock simulation and real backend HTTP requests
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// Token storage key
const TOKEN_KEY = 'bentorah_token';

/**
 * Central Axios instance with standard timeouts, headers, and base configuration
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request interceptor — attaches auth bearer token when present
 */
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Unable to access localStorage for auth token:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor — centralized error unwrapping and session handling
 */
apiClient.interceptors.response.use(
  (response) => {
    // Return the response body directly
    return response.data;
  },
  (error) => {
    let errorMessage = 'An unexpected server error occurred. Please try again.';

    if (error.response) {
      // Server responded with an error status (4xx, 5xx)
      const data = error.response.data;
      errorMessage = data?.message || data?.error || `Request failed with status ${error.response.status}`;

      // Handle 401 Unauthorized globally (session expired)
      if (error.response.status === 401) {
        console.warn('Unauthorized request — user session may have expired.');
        // Optionally notify auth listener / clear session
      }
    } else if (error.request) {
      // Network failure or no response from server
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else {
      errorMessage = error.message;
    }

    return Promise.reject(new Error(errorMessage));
  }
);

/**
 * Helper GET method
 * @param {string} endpoint
 * @param {object} params
 */
export const apiGet = (endpoint, params = {}) => {
  return apiClient.get(endpoint, { params });
};

/**
 * Helper POST method
 * @param {string} endpoint
 * @param {object} data
 */
export const apiPost = (endpoint, data = {}) => {
  return apiClient.post(endpoint, data);
};

/**
 * Helper PUT method
 * @param {string} endpoint
 * @param {object} data
 */
export const apiPut = (endpoint, data = {}) => {
  return apiClient.put(endpoint, data);
};

/**
 * Helper PATCH method
 * @param {string} endpoint
 * @param {object} data
 */
export const apiPatch = (endpoint, data = {}) => {
  return apiClient.patch(endpoint, data);
};

/**
 * Helper DELETE method
 * @param {string} endpoint
 */
export const apiDelete = (endpoint) => {
  return apiClient.delete(endpoint);
};

/**
 * Utility to simulate network delay for realistic mock states
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 */
export const simulateDelay = (min = 300, max = 800) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export default apiClient;
