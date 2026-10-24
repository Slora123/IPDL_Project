// src/server/index.js
// Unified Trackify backend — Express server integrating:
//   - Transactions (CRUD + shared SQLite DB via Turso / local file)
//   - Analytics (dashboard stats, weekly, category, growth)
//   - Voice/NLP (SarvamAI speech-to-text + financial intent)
//   - Bills/OCR (Gemini vision extraction)

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

import transactionRoutes from './routes/transactions.js';
import analyticsRoutes from './routes/analytics.js';
import voiceRoutes from './routes/voice.js';
import billRoutes from './routes/bills.js';
import stubRoutes from './routes/stubs.js';
import authRoutes, { requireAuth } from './routes/auth.js';
import { getSummary, ready as dbReady } from './services/db.js';

const _here = path.dirname(fileURLToPath(import.meta.url));

// Render sets PORT automatically. Fallback to 3001 for local dev.
const PORT = process.env.PORT || 3001;

// ALLOWED_ORIGIN: set to your Vercel frontend URL in production
//   e.g.  ALLOWED_ORIGIN=https://ipdltrackify.vercel.app
// Leave unset (defaults to *) for local development.
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const app = express();

// Correlate diagnostics without recording request bodies, tokens, or personal data.
app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);
  console.log(`[${new Date().toISOString()}] ${req.id} ${req.method} ${req.path}`);
  next();
});

// -- middleware ----------------------------------------------------------------
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// -- routes -------------------------------------------------------------------

// Auth (register / login / me) — public, no auth middleware needed on these routes
app.use('/api/auth', authRoutes);

// ── Sarvam translation proxy ──────────────────────────────────────────────────
// Keeps the SARVAM_API_KEY server-side; frontend calls this instead of Sarvam directly.
app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLang = 'en-IN', targetLang } = req.body;
    if (!text || !targetLang) {
      return res.status(400).json({ error: 'text and targetLang are required' });
    }
    const SARVAM_KEY = process.env.SARVAM_API_KEY;
    if (!SARVAM_KEY) {
      return res.status(500).json({ error: 'SARVAM_API_KEY not configured' });
    }
    const sarvamRes = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        source_language_code: sourceLang,
        target_language_code: targetLang,
        speaker_gender: 'Female',
        mode: 'formal',
        model: 'mayura:v1',
        enable_preprocessing: false,
      }),
    });
    if (!sarvamRes.ok) {
      const err = await sarvamRes.text();
      console.error('[Translate] Sarvam error:', err);
      return res.status(sarvamRes.status).json({ error: 'Translation failed', translatedText: text });
    }
    const data = await sarvamRes.json();
    res.json({ translatedText: data.translated_text || text });
  } catch (err) {
    console.error('[Translate] Error:', err.message);
    res.status(500).json({ error: 'Translation failed', translatedText: req.body?.text || '' });
  }
});

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

// Dashboard stats — requires auth, filtered by the authenticated user's ID
app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    res.json(await getSummary(req.user.id));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Analytics routes (auth applied inside the router)
app.use('/api/analytics', analyticsRoutes);

// Transaction CRUD (auth applied inside the router)
app.use('/api/transactions', transactionRoutes);

// Voice/NLP processing — requires auth
app.use('/api/voice', requireAuth, voiceRoutes);

// Bill scanning + confirmation — requires auth
app.use('/api/bills', requireAuth, billRoutes);

// Stub routes (loans, reports, user settings) — must come after specific routes
app.use('/api', stubRoutes);

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  console.error('[Server Error]', {
    requestId: _req.id || 'unavailable',
    status,
    code: err.code || err.name || 'UNKNOWN',
  });
  const message = status === 413
    ? 'The request is too large. Bill images must be 10 MB or smaller.'
    : status === 415
      ? 'Unsupported image type. Upload a JPEG, PNG, or WebP image.'
      : status < 500
        ? err.message || 'Invalid request.'
        : 'The server could not complete this request. Please try again.';
  res.status(status).json({ error: message, requestId: _req.id });
});

// Wait for the DB to be ready before accepting connections.
// This ensures the schema exists before the first request hits the server.
dbReady.then(() => {
  // Bind to 0.0.0.0 — required on Render so the reverse proxy can reach the container.
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Trackify Server running on port ${PORT}`);
    console.log(`   ✅ Database:      ${process.env.TURSO_DATABASE_URL ? 'Turso (cloud, persistent)' : 'Local SQLite file'}`);
    console.log(`   ✅ Transactions: POST/GET /api/transactions`);
    console.log(`   ✅ Analytics:    GET /api/stats, /api/analytics/*`);
    console.log(`   ✅ Voice/NLP:    POST /api/voice/process (SarvamAI)`);
    console.log(`   ✅ Bill OCR:     POST /api/bills/scan (Gemini), POST /api/bills/confirm`);
    console.log(`   ✅ CORS origin:  ${allowedOrigin}`);
    console.log(`   ✅ Health:       GET /api/health\n`);
  });
});
