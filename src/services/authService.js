/**
 * BENTORAH Authentication Service
 * ============================================================
 * Central authentication abstraction layer.
 * Communicates with backend endpoints:
 *   - POST /api/auth/google
 *   - POST /api/auth/signup
 *   - POST /api/auth/login
 *   - GET  /api/auth/me
 *   - POST /api/auth/logout
 *
 * When VITE_USE_MOCK is true, simulates user authentication
 * and persists sessions in localStorage for demo and offline development.
 * ============================================================
 */

import { apiGet, apiPost, simulateDelay, USE_MOCK } from './api';

const USER_STORAGE_KEY = 'bentorah_user';
const TOKEN_STORAGE_KEY = 'bentorah_token';

/**
 * Get current authenticated user from local storage (synchronous for initial state)
 * @returns {object|null}
 */
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Failed to parse stored user:', err);
    return null;
  }
};

/**
 * Get current auth token from local storage
 * @returns {string|null}
 */
export const getAuthToken = () => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
  } catch (err) {
    return null;
  }
};

/**
 * Fetch fresh user profile from backend (GET /api/auth/me)
 * @returns {Promise<object|null>}
 */
export const fetchCurrentUser = async () => {
  if (!USE_MOCK) {
    const token = getAuthToken();
    if (!token) return null;
    const user = await apiGet('/auth/me');
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  }

  return getCurrentUser();
};

/**
 * Sign in with Google
 * Backend: POST /api/auth/google
 *
 * @param {string} [idToken] - Real Google ID token from OAuth provider
 * @returns {Promise<object>} User profile
 */
export const signInWithGoogle = async (idToken) => {
  if (!USE_MOCK) {
    const response = await apiPost('/auth/google', { token: idToken });
    const user = response.user || response;
    const token = response.token;

    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    return user;
  }

  await simulateDelay(600, 1000);

  // Mock authentic Google user for demonstration
  const user = {
    id: `usr_g_${Date.now()}`,
    name: 'Alex Johnson',
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.johnson@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
    provider: 'google',
    createdAt: new Date().toISOString(),
  };

  const token = `bt_tok_g_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, token);

  return user;
};

/**
 * Sign up with Email and Password
 * Backend: POST /api/auth/signup
 *
 * @param {string} email
 * @param {string} password
 * @param {object} [extraData] - Optional first/last name
 * @returns {Promise<object>} User profile
 */
export const signUpWithEmail = async (email, password, extraData = {}) => {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  if (!USE_MOCK) {
    const response = await apiPost('/auth/signup', {
      email: cleanEmail,
      password,
      ...extraData,
    });
    const user = response.user || response;
    const token = response.token;

    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    return user;
  }

  await simulateDelay(500, 900);

  const namePart = cleanEmail.split('@')[0];
  const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);

  const fullName = extraData.firstName && extraData.lastName
    ? `${extraData.firstName.trim()} ${extraData.lastName.trim()}`
    : extraData.name || (extraData.firstName ? extraData.firstName.trim() : capitalized);

  const user = {
    id: `usr_e_${Date.now()}`,
    name: fullName,
    firstName: extraData.firstName ? extraData.firstName.trim() : capitalized,
    lastName: extraData.lastName ? extraData.lastName.trim() : '',
    email: cleanEmail,
    provider: 'email',
    createdAt: new Date().toISOString(),
  };

  const token = `bt_tok_e_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, token);

  return user;
};

/**
 * Sign in with Email and Password
 * Backend: POST /api/auth/login
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} User profile
 */
export const signInWithEmail = async (email, password) => {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  if (!password) {
    throw new Error('Please enter your password.');
  }

  if (!USE_MOCK) {
    const response = await apiPost('/auth/login', {
      email: cleanEmail,
      password,
    });
    const user = response.user || response;
    const token = response.token;

    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    return user;
  }

  await simulateDelay(500, 850);

  // Demo simulation check: Reject invalid passwords
  if (password.length < 4) {
    throw new Error('Invalid email or password. Please try again.');
  }

  const namePart = cleanEmail.split('@')[0];
  const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);

  const user = {
    id: `usr_e_${Date.now()}`,
    name: capitalized,
    firstName: capitalized,
    lastName: '',
    email: cleanEmail,
    provider: 'email',
    createdAt: new Date().toISOString(),
  };

  const token = `bt_tok_e_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, token);

  return user;
};

/**
 * Sign out current user
 * Backend: POST /api/auth/logout
 *
 * @returns {Promise<void>}
 */
export const signOut = async () => {
  if (!USE_MOCK) {
    try {
      await apiPost('/auth/logout');
    } catch (err) {
      console.warn('Logout API notification failed, clearing local session anyway:', err);
    }
  } else {
    await simulateDelay(150, 300);
  }

  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};
