// src/server/services/db.js
// Central database — single source of truth for all transactions and users.
// Uses @libsql/client which supports:
//   LOCAL DEV  : file:./trackify.db  (SQLite file, same as before)
//   PRODUCTION : libsql://your-db.turso.io  (Turso cloud — persistent across restarts)
//
// Set these env vars on Render:
//   TURSO_DATABASE_URL=libsql://your-db-name.turso.io
//   TURSO_AUTH_TOKEN=your-turso-auth-token
//
// Without those vars the server falls back to a local file (works for dev).

import { createClient } from '@libsql/client';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));

// Determine DB URL:
// - If TURSO_DATABASE_URL is set → use Turso (persistent cloud SQLite)
// - Otherwise fall back to local SQLite file
const TURSO_URL   = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

let dbClient;

if (TURSO_URL) {
  console.log(`[DB] Connecting to Turso: ${TURSO_URL}`);
  dbClient = createClient({
    url:       TURSO_URL,
    authToken: TURSO_TOKEN,
  });
} else {
  // Local file path — DB_PATH env var or project root fallback
  const localPath = process.env.DB_PATH || path.join(here, '../../trackify.db');
  console.log(`[DB] Using local SQLite: ${localPath}`);
  dbClient = createClient({ url: `file:${localPath}` });
}

// ── Schema bootstrap ──────────────────────────────────────────────────────────
// We use executeSync-style wrappers via the async client.
// Bootstrap runs once at startup — await in an IIFE.

async function initSchema() {
  await dbClient.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      email        TEXT NOT NULL UNIQUE,
      password     TEXT NOT NULL,
      businessName TEXT NOT NULL DEFAULT '',
      phone        TEXT NOT NULL DEFAULT '',
      createdAt    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id            TEXT PRIMARY KEY,
      userId        TEXT,
      type          TEXT NOT NULL,
      amount        REAL NOT NULL,
      currency      TEXT NOT NULL DEFAULT 'INR',
      item          TEXT NOT NULL,
      category      TEXT NOT NULL DEFAULT 'General',
      date          TEXT NOT NULL,
      time          TEXT NOT NULL,
      language      TEXT NOT NULL DEFAULT 'english',
      paymentMethod TEXT,
      source        TEXT NOT NULL DEFAULT 'manual',
      merchant      TEXT,
      voiceInput    TEXT,
      billRef       TEXT,
      billImage     TEXT,
      createdAt     TEXT NOT NULL,
      updatedAt     TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
    CREATE INDEX IF NOT EXISTS idx_transactions_date    ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type    ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_userId  ON transactions(userId);
    CREATE INDEX IF NOT EXISTS idx_transactions_billRef ON transactions(billRef);
  `);

  console.log('[DB] Schema ready');
}

// Run schema init — module-level await (ESM top-level await)
// We export a promise that resolves when the DB is ready.
export const ready = initSchema().catch(err => {
  console.error('[DB] Schema init failed:', err);
  process.exit(1);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const toISO = () => new Date().toISOString();

export const localDateStr = (d = new Date()) => {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  return dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

export const timeStr = (d = new Date()) =>
  d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

function parseRow(r) {
  if (!r) return null;
  return { ...r, amount: Number(r.amount) };
}

// Helper to run a query and return all rows
async function queryAll(sql, args = []) {
  const result = await dbClient.execute({ sql, args });
  return result.rows;
}

// Helper to run a query and return the first row (or null)
async function queryFirst(sql, args = []) {
  const result = await dbClient.execute({ sql, args });
  return result.rows[0] || null;
}

// Helper to run an INSERT/UPDATE/DELETE
async function exec(sql, args = []) {
  return dbClient.execute({ sql, args });
}

// ── User queries (used by auth routes) ───────────────────────────────────────
export async function findUserByEmail(email) {
  return queryFirst('SELECT * FROM users WHERE email = ?', [email]);
}

export async function findUserById(id) {
  return queryFirst('SELECT * FROM users WHERE id = ?', [id]);
}

export async function insertUser(id, name, email, hashedPassword, businessName, phone, createdAt) {
  await exec(
    `INSERT INTO users (id, name, email, password, businessName, phone, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, name, email, hashedPassword, businessName, phone, createdAt]
  );
  return findUserById(id);
}

// ── Transaction queries ───────────────────────────────────────────────────────
export async function createTransaction(userId, data) {
  if (!userId) throw new Error('userId is required');
  const id  = randomUUID();
  const now = toISO();
  const rawDate = String(data.date || '').trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : localDateStr();
  const time = data.time || timeStr();

  await exec(
    `INSERT INTO transactions
       (id, userId, type, amount, currency, item, category, date, time, language,
        paymentMethod, source, merchant, voiceInput, billRef, billImage, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, userId,
      data.type,
      Number(data.amount),
      data.currency || 'INR',
      data.item,
      data.category || 'General',
      date, time,
      data.language || 'english',
      data.paymentMethod || null,
      data.source || 'manual',
      data.merchant   || null,
      data.voiceInput || null,
      data.billRef    || null,
      data.billImage  || null,
      now, now,
    ]
  );

  return parseRow(await queryFirst(
    'SELECT * FROM transactions WHERE id = ? AND userId = ?', [id, userId]
  ));
}

export async function getAllTransactions(userId) {
  if (!userId) return [];
  const rows = await queryAll(
    'SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC, createdAt DESC',
    [userId]
  );
  return rows.map(parseRow);
}

export async function billRefExistsForUser(userId, billRef, type) {
  if (!userId || !billRef) return false;
  const row = await queryFirst(
    'SELECT 1 FROM transactions WHERE userId = ? AND billRef = ? AND type = ? LIMIT 1',
    [userId, billRef, type]
  );
  return !!row;
}

export async function getTransactionById(id, userId) {
  if (!userId) return null;
  return parseRow(await queryFirst(
    'SELECT * FROM transactions WHERE id = ? AND userId = ?', [id, userId]
  ));
}

export async function updateTransaction(id, userId, data) {
  if (!userId) return null;
  const existing = await queryFirst(
    'SELECT * FROM transactions WHERE id = ? AND userId = ?', [id, userId]
  );
  if (!existing) return null;
  const now = toISO();
  await exec(
    `UPDATE transactions
     SET type=?, amount=?, item=?, category=?, date=?, time=?, language=?,
         paymentMethod=?, merchant=?, updatedAt=?
     WHERE id = ? AND userId = ?`,
    [
      data.type          ?? existing.type,
      Number(data.amount ?? existing.amount),
      data.item          ?? existing.item,
      data.category      ?? existing.category,
      data.date          ?? existing.date,
      data.time          ?? existing.time,
      data.language      ?? existing.language,
      data.paymentMethod ?? existing.paymentMethod,
      data.merchant      ?? existing.merchant,
      now,
      id, userId,
    ]
  );
  return parseRow(await queryFirst(
    'SELECT * FROM transactions WHERE id = ? AND userId = ?', [id, userId]
  ));
}

export async function deleteTransaction(id, userId) {
  if (!userId) return false;
  const r = await queryFirst(
    'SELECT * FROM transactions WHERE id = ? AND userId = ?', [id, userId]
  );
  if (!r) return false;
  await exec('DELETE FROM transactions WHERE id = ? AND userId = ?', [id, userId]);
  return true;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export async function getSummary(userId, clientDate) {
  const txs = await getAllTransactions(userId);

  const todayStr = clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)
    ? clientDate
    : localDateStr();
  const todayDate = new Date(todayStr + 'T12:00:00');
  const yestDate = new Date(todayDate);
  yestDate.setDate(yestDate.getDate() - 1);
  const yesterdayStr = localDateStr(yestDate);

  const todayTxs     = txs.filter(t => t.date === todayStr);
  const yesterdayTxs = txs.filter(t => t.date === yesterdayStr);

  const sum = (arr, type) => arr.filter(t => t.type === type).reduce((s, t) => s + t.amount, 0);

  const todayIncome   = sum(todayTxs, 'income');
  const todayExpenses = sum(todayTxs, 'expense');
  const yestIncome    = sum(yesterdayTxs, 'income');
  const yestExpenses  = sum(yesterdayTxs, 'expense');

  const pctChange = (today, yesterday) => {
    if (yesterday === 0 && today === 0) return '0%';
    if (yesterday === 0) return '+100%';
    const pct = ((today - yesterday) / yesterday * 100).toFixed(0);
    return (pct >= 0 ? `+${pct}` : `${pct}`) + '%';
  };

  return {
    income:       todayIncome,
    expenses:     todayExpenses,
    profit:       todayIncome - todayExpenses,
    transactions: todayTxs.length,
    yesterday: {
      income:       yestIncome,
      expenses:     yestExpenses,
      profit:       yestIncome - yestExpenses,
      transactions: yesterdayTxs.length,
    },
    trends: {
      income:       pctChange(todayIncome,   yestIncome),
      expenses:     pctChange(todayExpenses,  yestExpenses),
      profit:       pctChange(todayIncome - todayExpenses, yestIncome - yestExpenses),
      transactions: pctChange(todayTxs.length, yesterdayTxs.length),
    },
    allTime: {
      income:       sum(txs, 'income'),
      expenses:     sum(txs, 'expense'),
      transactions: txs.length,
    },
    recentTransactions: txs.slice(0, 6),
    todayStr,
    yesterdayStr,
  };
}

export async function getWeeklyStats(userId, clientDate) {
  const txs  = await getAllTransactions(userId);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const baseDateStr = clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)
    ? clientDate
    : localDateStr();
  const baseDate = new Date(baseDateStr + 'T12:00:00');

  const map  = {};
  for (let i = 6; i >= 0; i--) {
    const d   = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const key = localDateStr(d);
    map[key]  = { name: days[d.getDay()], income: 0, expense: 0, profit: 0, date: key };
  }
  for (const t of txs) {
    if (map[t.date]) {
      if (t.type === 'income') map[t.date].income  += t.amount;
      else                     map[t.date].expense += t.amount;
    }
  }
  return Object.values(map).map(d => ({ ...d, profit: d.income - d.expense }));
}

export async function getCategorySpending(userId) {
  const txs  = (await getAllTransactions(userId)).filter(t => t.type === 'expense');
  const map  = {};
  for (const t of txs) map[t.category] = (map[t.category] || 0) + t.amount;
  const total  = Object.values(map).reduce((s, v) => s + v, 0) || 1;
  const COLORS = ['#f87171', '#60a5fa', '#facc15', '#4ade80', '#c084fc', '#fb923c', '#a78bfa'];
  const sorted = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, amount], i) => ({
      name, amount, value: amount,
      percentage: Math.round((amount / total) * 100),
      color: COLORS[i % COLORS.length],
      growth: '+0%',
    }));
  return { topCategories: sorted };
}

export async function getGrowthMetrics(userId) {
  const txs       = await getAllTransactions(userId);
  const today     = localDateStr();
  const thisMonth = today.slice(0, 7);
  const lastMonthDate = new Date(); lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = localDateStr(lastMonthDate).slice(0, 7);

  const sum = (arr, type) => arr.filter(t => t.type === type).reduce((s, t) => s + t.amount, 0);

  const thisIncome   = sum(txs.filter(t => t.date.startsWith(thisMonth)), 'income');
  const lastIncome   = sum(txs.filter(t => t.date.startsWith(lastMonth)), 'income');
  const totalIncome  = sum(txs, 'income');
  const totalExpenses= sum(txs, 'expense');

  const revenueGrowth = lastIncome > 0
    ? `${((thisIncome - lastIncome) / lastIncome * 100).toFixed(1)}%`
    : totalIncome > 0 ? '+100%' : '0%';
  const expenseRatio  = totalIncome > 0 ? `${((totalExpenses / totalIncome) * 100).toFixed(0)}%` : '0%';
  const profitMargin  = totalIncome > 0 ? `${(((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(0)}%` : '0%';

  return {
    revenueGrowth: revenueGrowth.startsWith('-') ? revenueGrowth : `+${revenueGrowth}`.replace('++', '+'),
    expenseRatio,
    profitMargin,
    customerRetention: '—',
  };
}

// Export the client for direct use if needed (e.g. bill routes)
export default dbClient;
