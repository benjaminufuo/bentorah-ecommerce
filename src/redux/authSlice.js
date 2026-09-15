import { createSlice } from '@reduxjs/toolkit';
import { getCurrentUser } from '../services/authService';

const initialUser = getCurrentUser();

const initialState = {
  user: initialUser,
  isAuthenticated: Boolean(initialUser),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    authSuccess: (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    authFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    authClearError: (state) => {
      state.error = null;
    },
    authSignOut: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  authStart,
  authSuccess,
  authFailure,
  authClearError,
  authSignOut,
} = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
