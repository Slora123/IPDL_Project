// src/server/index.js
// Unified Trackify backend — Express server integrating:
//   - Transactions (CRUD + shared SQLite DB)
//   - Analytics (dashboard stats, weekly, category, growth)
//   - Voice/NLP (SarvamAI speech-to-text + financial intent)
//   - Bills/OCR (Gemini vision extraction)

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import transactionRoutes from './routes/transactions.js';
import analyticsRoutes from './routes/analytics.js';
import voiceRoutes from './routes/voice.js';
import billRoutes from './routes/bills.js';
import stubRoutes from './routes/stubs.js';
import { getSummary } from './services/db.js';

const _here = path.dirname(fileURLToPath(import.meta.url));

// Render sets PORT automatically. Fallback to 3001 for local dev.
const PORT = process.env.PORT || 3001;

// ALLOWED_ORIGIN: set to your Vercel frontend URL in production
//   e.g.  ALLOWED_ORIGIN=https://trackify-xyz.vercel.app
// Leave unset (defaults to *) for local development.
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const app = express();

// -- middleware ----------------------------------------------------------------
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// -- routes -------------------------------------------------------------------

// Root route — confirms the server is up (Render / browser check)
app.get('/', (_req, res) => res.json({
  service: 'Trackify API',
  status: 'ok',
  docs: 'Use /api/* endpoints. See /api/health for uptime check.',
}));

// Health check — registered early, before any catch-all stub routes
// Render pings /api/health (configured in render.yaml healthCheckPath)
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.get('/health',     (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Dashboard stats (matched by Dashboard.tsx: /api/stats)
app.get('/api/stats', (_req, res) => res.json(getSummary()));

// Analytics routes
app.use('/api/analytics', analyticsRoutes);

// Transaction CRUD
app.use('/api/transactions', transactionRoutes);

// Voice/NLP processing
app.use('/api/voice', voiceRoutes);

// Bill scanning + confirmation
app.use('/api/bills', billRoutes);

// Stub routes (loans, reports, user settings) — must come after specific routes
app.use('/api', stubRoutes);

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Bind to 0.0.0.0 — required on Render so the reverse proxy can reach the container.
// Binding to 127.0.0.1 (the default when host is omitted) would make Render health
// checks time out and the deploy would be marked as failed.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Trackify Server running on port ${PORT}`);
  console.log(`   ✅ Transactions: POST/GET /api/transactions`);
  console.log(`   ✅ Analytics:    GET /api/stats, /api/analytics/*`);
  console.log(`   ✅ Voice/NLP:    POST /api/voice/process (SarvamAI)`);
  console.log(`   ✅ Bill OCR:     POST /api/bills/scan (Gemini), POST /api/bills/confirm`);
  console.log(`   ✅ CORS origin:  ${allowedOrigin}`);
  console.log(`   ✅ Health:       GET /api/health\n`);
});
