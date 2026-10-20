// src/lib/api.ts
// Central axios instance for all Trackify API calls.
//
// How the base URL works:
//   - LOCAL DEV:   VITE_API_URL is not set → baseURL = '' → Vite proxy forwards
//                  /api/* to http://localhost:3001 (configured in vite.config.ts)
//   - PRODUCTION:  VITE_API_URL=https://your-render-backend.onrender.com
//                  → every /api/... call goes directly to Render
//
// Global 401 interceptor:
//   Any 401 response from the API means the session is invalid (token expired,
//   user deleted, or DB reset on Render free tier). We dispatch a custom DOM
//   event so AuthContext can call logout() and redirect to /login.
//   We do NOT import AuthContext here to avoid circular dependency.

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Response interceptor — global 401 handler ──────────────────────────────
api.interceptors.response.use(
  // Pass through successful responses unchanged
  (response) => response,

  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Replace the raw server message with a user-friendly one so the user
      // sees "Session expired — please log in again" rather than
      // "User not found" or "Invalid or expired token".
      const serverMsg: string = error.response?.data?.error ?? '';
      const isSessionGone =
        serverMsg === 'User not found' ||
        serverMsg === 'Invalid or expired token' ||
        serverMsg === 'Not authenticated';

      if (isSessionGone) {
        // Swap the error message the caller will read so every page shows a
        // consistent, friendly message instead of an internal server string.
        if (error.response?.data) {
          error.response.data.error =
            'Your session has expired. Please log in again.';
        }

        // Notify AuthContext (via a window event) to clear the token and
        // navigate to /login. We use an event to avoid a circular import.
        window.dispatchEvent(new CustomEvent('trackify:session-expired'));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
