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
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
      let msg = data?.message || data?.error || `Request failed with status ${error.response.status}`;
      if (Array.isArray(data?.errors) && data.errors.length > 0) {
        const details = data.errors.map((e) => e.message || `${e.field}: ${e.message}`).join(', ');
        msg = `${msg}: ${details}`;
      }
      errorMessage = msg;

      // Handle 401 Unauthorized globally (session expired)
      if (error.response.status === 401) {
        console.warn('Unauthorized request — user session may have expired.');
      }
    } else if (error.request) {
      // Network failure or no response from server
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else {
      errorMessage = error.message;
    }

    const customError = new Error(errorMessage);
    customError.status = error.response?.status;
    customError.data = error.response?.data;
    return Promise.reject(customError);
  }
);

/**
 * Helper GET method
 * @param {string} endpoint
 * @param {object} params
 * @param {object} headers
 */
export const apiGet = (endpoint, params = {}, headers = {}) => {
  return apiClient.get(endpoint, { params, headers });
};

/**
 * Helper POST method
 * @param {string} endpoint
 * @param {object} data
 * @param {object} headers
 */
export const apiPost = (endpoint, data = {}, headers = {}) => {
  return apiClient.post(endpoint, data, { headers });
};

/**
 * Helper PUT method
 * @param {string} endpoint
 * @param {object} data
 * @param {object} headers
 */
export const apiPut = (endpoint, data = {}, headers = {}) => {
  return apiClient.put(endpoint, data, { headers });
};

/**
 * Helper PATCH method
 * @param {string} endpoint
 * @param {object} data
 * @param {object} headers
 */
export const apiPatch = (endpoint, data = {}, headers = {}) => {
  return apiClient.patch(endpoint, data, { headers });
};

/**
 * Helper DELETE method
 * @param {string} endpoint
 * @param {object} headers
 */
export const apiDelete = (endpoint, headers = {}) => {
  return apiClient.delete(endpoint, { headers });
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
