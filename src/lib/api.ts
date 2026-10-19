// src/lib/api.ts
// Central axios instance for all Trackify API calls.
//
// How the base URL works:
//   - LOCAL DEV:   VITE_API_URL is not set → baseURL = '' → Vite proxy forwards
//                  /api/* to http://localhost:3001 (configured in vite.config.ts)
//   - PRODUCTION:  VITE_API_URL=https://your-railway-backend.up.railway.app
//                  → every /api/... call goes directly to Railway
//
// All components already use relative paths like axios.get('/api/stats').
// Setting baseURL here means no changes are needed in any component.

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
