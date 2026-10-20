// src/server/routes/auth.js
// Authentication routes: register, login, me
// Passwords are hashed with bcryptjs (cost factor 12).
// Sessions use signed JWTs stored client-side; no server-side session store needed.

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../services/db.js';

const router = Router();

// ── Ensure users table exists ────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    businessName TEXT NOT NULL DEFAULT '',
    phone       TEXT NOT NULL DEFAULT '',
    createdAt   TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

// ── Helpers ──────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'production'
    ? null
    : 'trackify-dev-secret-change-in-production'
);
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production.');
}
const JWT_EXPIRES = '7d';

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function safeUser(row) {
  if (!row) return null;
  const { password: _pw, ...safe } = row;
  return safe;
}

const stmtFindByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const stmtFindById    = db.prepare('SELECT * FROM users WHERE id = ?');
const stmtInsertUser  = db.prepare(`
  INSERT INTO users (id, name, email, password, businessName, phone, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// ── Middleware: verify JWT ───────────────────────────────────────────────────
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = stmtFindById.get(payload.sub);
    if (!user) {
      // A valid token without a backing account usually means the production
      // database was reset or the client is pointed at a different backend.
      // Log a request correlation ID only; never log the token or user data.
      console.warn('[Auth] verified token has no matching account', {
        requestId: req.id || 'unavailable',
        path: req.path,
      });
      return res.status(401).json({
        code: 'ACCOUNT_NOT_FOUND',
        error: 'This session no longer matches an account on the server. Sign in again; if the issue continues, contact support to restore your account.',
        requestId: req.id,
      });
    }
    req.user = safeUser(user);
    next();
  } catch (err) {
    console.warn('[Auth] token validation failed', {
      requestId: req.id || 'unavailable',
      reason: err?.name === 'TokenExpiredError' ? 'expired' : 'invalid',
    });
    return res.status(401).json({ error: 'Invalid or expired token', requestId: req.id });
  }
}

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, businessName = '', phone = '' } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email, and password are required' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const emailLower = email.toLowerCase().trim();
    const existing = stmtFindByEmail.get(emailLower);
    if (existing)
      return res.status(409).json({ error: 'An account with this email already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const { randomUUID } = await import('node:crypto');
    const id = randomUUID();
    const now = new Date().toISOString();

    stmtInsertUser.run(id, name.trim(), emailLower, hashed, businessName.trim(), phone.trim(), now);

    const user = safeUser(stmtFindById.get(id));
    const token = signToken(id);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required' });

    const emailLower = email.toLowerCase().trim();
    const row = stmtFindByEmail.get(emailLower);
    if (!row) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const user  = safeUser(row);
    const token = signToken(row.id);

    res.json({ user, token });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
