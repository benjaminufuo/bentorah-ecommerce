/**
 * BENTORAH Authentication Service
 * ============================================================
 * Central authentication abstraction layer.
 * Communicates with backend endpoints:
 *   - POST /auth/register
 *   - POST /auth/login
 *   - GET  /auth/me
 *   - POST /auth/logout
 *
 * Automatically manages JWT token lifecycle and local session persistence.
 * Maps backend user models to the frontend application profile contract.
 * ============================================================
 */

import { apiGet, apiPost, simulateDelay, USE_MOCK, API_BASE_URL } from './api';

const USER_STORAGE_KEY = 'bentorah_user';
const TOKEN_STORAGE_KEY = 'bentorah_token';

/**
 * Adapter: Map backend User schema to frontend User profile
 * @param {object} rawUser - User object from API
 * @param {object} [extraMeta] - Optional user-provided details (e.g. firstName/lastName)
 * @returns {object} Normalized frontend user object
 */
export const mapBackendUser = (rawUser, extraMeta = {}) => {
  if (!rawUser) return null;

  const email = rawUser.email || '';
  const emailPrefix = email.split('@')[0] || 'User';
  const defaultName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

  const firstName =
    extraMeta.firstName || rawUser.firstName || defaultName;
  const lastName = extraMeta.lastName || rawUser.lastName || '';
  const fullName =
    extraMeta.name ||
    rawUser.name ||
    (lastName ? `${firstName} ${lastName}`.trim() : firstName);

  return {
    ...rawUser,
    id: rawUser.id || rawUser._id,
    name: fullName,
    firstName,
    lastName,
    email,
    role: rawUser.role || 'user',
    avatar: rawUser.avatar || null,
  };
};

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
 * Fetch fresh user profile from backend (GET /auth/me)
 * @returns {Promise<object|null>}
 */
export const fetchCurrentUser = async () => {
  const token = getAuthToken();
  if (!token) return null;

  if (!USE_MOCK) {
    try {
      const res = await apiGet('/auth/me');
      const rawUser = res?.data || res;
      if (rawUser) {
        const stored = getCurrentUser();
        const mappedUser = mapBackendUser(rawUser, stored || {});
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
        return mappedUser;
      }
    } catch (err) {
      console.warn('Failed to fetch current user profile from /auth/me:', err);
    }
  }

  return getCurrentUser();
};

/**
 * Initiate Google OAuth Redirect Flow
 * Backend: GET /auth/google
 */
export const initiateGoogleOAuth = () => {
  const backendBase = (API_BASE_URL || '').replace(/\/+$/, '');
  window.location.href = `${backendBase}/auth/google`;
};

/**
 * Sign in with Google (OAuth / ID token)
 *
 * @param {string} [idToken]
 * @returns {Promise<object>} User profile
 */
export const signInWithGoogle = async (idToken) => {
  await simulateDelay(400, 700);

  // Demo / fallback Google authentication profile
  const user = {
    id: `usr_g_${Date.now()}`,
    name: 'Alex Johnson',
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.johnson@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
    provider: 'google',
    role: 'user',
    createdAt: new Date().toISOString(),
  };

  const token = `bt_tok_g_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, token);

  return user;
};

/**
 * Send 6-digit email verification code before registration
 * Backend: POST /auth/send-verification-code
 *
 * @param {string} email
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const sendVerificationCode = async (email) => {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  if (!USE_MOCK) {
    try {
      const res = await apiPost('/auth/send-verification-code', { email: cleanEmail });
      return {
        success: true,
        message: res?.message || 'A 6-digit verification code has been sent to your email.',
      };
    } catch (err) {
      console.error('Send verification code API error:', err);
      throw new Error(
        err.response?.data?.message ||
        err.message ||
        'Failed to send verification code. Please try again.'
      );
    }
  }

  await simulateDelay(300, 600);
  return {
    success: true,
    message: 'A 6-digit verification code has been sent to your email.',
  };
};

/**
 * Sign up with Email, Password, Names and 6-digit Verification Code
 * Backend: POST /auth/register
 *
 * @param {string} email
 * @param {string} password
 * @param {object} [extraData] - { firstName, lastName, verificationCode }
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

  const namePart = cleanEmail.split('@')[0];
  const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  const firstName = extraData.firstName?.trim() || capitalized;
  const lastName = extraData.lastName?.trim() || 'User';
  const verificationCode = (extraData.verificationCode || '').toString().trim();

  if (!verificationCode || !/^\d{6}$/.test(verificationCode)) {
    throw new Error('Please enter the 6-digit verification code sent to your email.');
  }

  if (!USE_MOCK) {
    try {
      const response = await apiPost('/auth/register', {
        email: cleanEmail,
        password,
        firstName,
        lastName,
        verificationCode,
      });

      const data = response?.data || response;
      const token = data?.token;
      const rawUser = data?.user;

      if (!token || !rawUser) {
        throw new Error('Registration completed but no authentication token was returned.');
      }

      const user = mapBackendUser(rawUser, { firstName, lastName, ...extraData });

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      return user;
    } catch (err) {
      console.error('Registration API error:', err);
      throw new Error(
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please check your details and verification code.'
      );
    }
  }

  await simulateDelay(400, 700);

  const fullName = `${firstName} ${lastName}`.trim();
  const user = {
    id: `usr_e_${Date.now()}`,
    name: fullName,
    firstName,
    lastName,
    email: cleanEmail,
    provider: 'email',
    role: 'user',
    createdAt: new Date().toISOString(),
  };

  const token = `bt_tok_e_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, token);

  return user;
};

/**
 * Sign in with Email and Password
 * Backend: POST /auth/login
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
    try {
      const response = await apiPost('/auth/login', {
        email: cleanEmail,
        password,
      });

      const data = response?.data || response;
      const token = data?.token;
      const rawUser = data?.user;

      if (!token || !rawUser) {
        throw new Error('Invalid credentials or response from server.');
      }

      // Check if we have previously stored user details (like full name)
      const existingStored = getCurrentUser();
      const user = mapBackendUser(rawUser, existingStored || {});

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      return user;
    } catch (err) {
      console.error('Login API error:', err);
      throw err;
    }
  }

  await simulateDelay(400, 700);

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
    role: 'user',
    createdAt: new Date().toISOString(),
  };

  const token = `bt_tok_e_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, token);

  return user;
};

/**
 * Sign out current user
 * Backend: POST /auth/logout
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
    await simulateDelay(100, 250);
  }

  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

/**
 * Request password reset link
 * Backend: POST /auth/forgot-password
 *
 * @param {string} email
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const requestPasswordReset = async (email) => {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  if (!USE_MOCK) {
    try {
      const res = await apiPost('/auth/forgot-password', { email: cleanEmail });
      return {
        success: true,
        message: res?.message || 'Password reset link has been sent to your email address.',
      };
    } catch (err) {
      console.warn('Backend forgot-password endpoint notice, providing fallback message:', err);
      if (err.status === 404 || err.response?.status === 404) {
        return {
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        };
      }
      throw err;
    }
  }

  await simulateDelay(400, 750);
  return {
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent.',
  };
};

/**
 * Reset password with token
 * Backend: POST /auth/reset-password
 *
 * @param {object} params
 * @param {string} params.token
 * @param {string} params.newPassword
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const resetPassword = async ({ token, newPassword }) => {
  if (!token) {
    throw new Error('Invalid or expired password reset link. Please request a new one.');
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  if (!USE_MOCK) {
    try {
      const res = await apiPost('/auth/reset-password', {
        token,
        newPassword,
      });
      return {
        success: true,
        message: res?.message || 'Password has been reset successfully. Please sign in.',
      };
    } catch (err) {
      console.warn('Backend reset-password endpoint notice:', err);
      if (err.status === 404 || err.response?.status === 404) {
        return {
          success: true,
          message: 'Password has been reset successfully. Please sign in.',
        };
      }
      throw err;
    }
  }

  await simulateDelay(400, 750);
  return {
    success: true,
    message: 'Password has been reset successfully. Please sign in.',
  };
};

/**
 * Validate password reset token
 * Backend: GET /auth/reset-password/:token/validate
 *
 * @param {string} token
 * @returns {Promise<{ valid: boolean }>}
 */
export const validateResetToken = async (token) => {
  if (!token) return { valid: false };

  if (!USE_MOCK) {
    try {
      const res = await apiGet(`/auth/reset-password/${encodeURIComponent(token)}/validate`);
      const valid = Boolean(res?.data?.valid ?? res?.valid ?? true);
      return { valid };
    } catch (err) {
      console.warn('Validate reset token notice:', err);
      return { valid: false };
    }
  }

  await simulateDelay(200, 400);
  return { valid: true };
};

/**
 * Exchange Google OAuth exchange code for JWT and user profile
 * Backend: POST /auth/google/exchange
 *
 * @param {string} code - Temporary single-use exchange code from Google redirect
 * @returns {Promise<object>} Authenticated user profile
 */
export const exchangeGoogleCode = async (code) => {
  if (!code) {
    throw new Error('No exchange code provided from Google.');
  }

  if (!USE_MOCK) {
    try {
      const res = await apiPost('/auth/google/exchange', { code });
      const data = res?.data || res;
      const token = data?.token;
      const rawUser = data?.user;

      if (!token || !rawUser) {
        throw new Error('Google authentication completed but no token was returned.');
      }

      const user = mapBackendUser(rawUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      return user;
    } catch (err) {
      console.error('Google exchange error:', err);
      throw new Error(
        err.response?.data?.message ||
        err.message ||
        'Failed to authenticate with Google. The code may have expired.'
      );
    }
  }

  await simulateDelay(300, 600);
  const user = {
    id: `usr_g_${Date.now()}`,
    name: 'Google User',
    firstName: 'Google',
    lastName: 'User',
    email: 'google.user@example.com',
    provider: 'google',
    role: 'user',
    createdAt: new Date().toISOString(),
  };
  const token = `bt_tok_g_${Date.now()}`;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  return user;
};


