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

// ── Request interceptor — attach token and sanitize bad Authorization headers ─
api.interceptors.request.use((config) => {
  const existingAuth = String(config.headers?.Authorization || config.headers?.authorization || '').trim();
  const isInvalidHeader =
    !existingAuth ||
    existingAuth === 'Bearer' ||
    existingAuth === 'Bearer null' ||
    existingAuth === 'Bearer undefined';

  if (isInvalidHeader) {
    const token =
      localStorage.getItem('trackify_token') ||
      localStorage.getItem('token');

    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token.trim()}`;
    } else {
      delete config.headers.Authorization;
      delete config.headers.authorization;
    }
  }
  return config;
});

// ── Response interceptor — global 401 handler ──────────────────────────────
api.interceptors.response.use(
  // Pass through successful responses unchanged
  (response) => response,

  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      const serverMsg: string = error.response?.data?.error ?? '';
      const hasStoredToken =
        Boolean(localStorage.getItem('trackify_token') || localStorage.getItem('token'));

      const isSessionGone =
        hasStoredToken &&
        (serverMsg === 'User not found' ||
         serverMsg === 'Invalid or expired token' ||
         serverMsg.includes('session no longer matches'));

      if (isSessionGone) {
        if (error.response?.data) {
          error.response.data.error =
            'Your session has expired. Please log in again.';
        }

        window.dispatchEvent(new CustomEvent('trackify:session-expired'));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
