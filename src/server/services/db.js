// src/server/services/db.js
// Central SQLite database — single source of truth for all transactions.
// ALL data-access functions require a userId and only return that user's rows.

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));

// DB_PATH env var lets Render point at a persistent disk (e.g. /var/data/trackify.db).
// Falls back to project root for local dev — existing data is never overwritten.
const dbPath = process.env.DB_PATH || path.join(here, '../../trackify.db');
console.log(`[DB] SQLite path: ${dbPath}`);

const db = new DatabaseSync(dbPath);

// Enable WAL mode for better concurrency
db.exec('PRAGMA journal_mode=WAL;');

// ── Schema ───────────────────────────────────────────────────────────────────
// Step 1: Create tables without the userId column so IF NOT EXISTS works
// on databases that already exist but predate the column.
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id            TEXT PRIMARY KEY,
    type          TEXT NOT NULL CHECK(type IN ('income','expense')),
    amount        REAL NOT NULL CHECK(amount > 0),
    currency      TEXT NOT NULL DEFAULT 'INR',
    item          TEXT NOT NULL,
    category      TEXT NOT NULL DEFAULT 'General',
    date          TEXT NOT NULL,
    time          TEXT NOT NULL,
    language      TEXT NOT NULL DEFAULT 'english',
    paymentMethod TEXT,
    source        TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('voice','bill','manual')),
    merchant      TEXT,
    voiceInput    TEXT,
    billRef       TEXT,
    createdAt     TEXT NOT NULL,
    updatedAt     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    email        TEXT NOT NULL UNIQUE,
    password     TEXT NOT NULL,
    businessName TEXT NOT NULL DEFAULT '',
    phone        TEXT NOT NULL DEFAULT '',
    createdAt    TEXT NOT NULL
  );
`);

// Step 2: Safe migration — add userId column if it doesn’t exist yet.
// SQLite pre-3.37 does not support IF NOT EXISTS on ALTER TABLE ADD COLUMN.
// So we inspect the pragma and only ALTER if the column is missing.
const txCols = db.prepare('PRAGMA table_info(transactions)').all().map(c => c.name);
if (!txCols.includes('userId')) {
  db.exec('ALTER TABLE transactions ADD COLUMN userId TEXT;');
  console.log('[DB] Migration: added userId column to transactions');
}
// Existing rows keep userId=NULL — they are treated as orphaned and never
// exposed to any authenticated user (all queries filter WHERE userId=?).

// Step 3: Create indexes (now that userId column definitely exists).
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_transactions_date   ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_transactions_type   ON transactions(type);
  CREATE INDEX IF NOT EXISTS idx_transactions_userId ON transactions(userId);
  CREATE INDEX IF NOT EXISTS idx_users_email         ON users(email);
`);

// ── Prepared statements ──────────────────────────────────────────────────────
const stmtInsert = db.prepare(`
  INSERT INTO transactions
    (id,userId,type,amount,currency,item,category,date,time,language,
     paymentMethod,source,merchant,voiceInput,billRef,createdAt,updatedAt)
  VALUES
    (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`);

// All SELECT/UPDATE/DELETE statements filter by userId — never by id alone
const stmtAllForUser    = db.prepare(`SELECT * FROM transactions WHERE userId=? ORDER BY date DESC, createdAt DESC`);
const stmtByIdForUser   = db.prepare(`SELECT * FROM transactions WHERE id=? AND userId=?`);
const stmtDeleteForUser = db.prepare(`DELETE FROM transactions WHERE id=? AND userId=?`);
const stmtUpdateForUser = db.prepare(`
  UPDATE transactions
  SET type=?,amount=?,item=?,category=?,date=?,time=?,language=?,paymentMethod=?,merchant=?,updatedAt=?
  WHERE id=? AND userId=?
`);

// ── Helpers ──────────────────────────────────────────────────────────────────
const toISO = () => new Date().toISOString();

// Returns today's date as YYYY-MM-DD in local time (not UTC)
const localDateStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const timeStr = (d = new Date()) =>
  d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

function parseRow(r) {
  if (!r) return null;
  return { ...r, amount: Number(r.amount) };
}

// ── Public API — every function requires userId ───────────────────────────────

export function createTransaction(userId, data) {
  if (!userId) throw new Error('userId is required');
  const id  = randomUUID();
  const now = toISO();
  const date = data.date || localDateStr();
  const time = data.time || timeStr();

  stmtInsert.run(
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
    data.merchant || null,
    data.voiceInput || null,
    data.billRef || null,
    now, now
  );

  // Re-fetch using userId-scoped query so we never return another user's row
  return parseRow(stmtByIdForUser.get(id, userId));
}

export function getAllTransactions(userId) {
  if (!userId) return [];
  return stmtAllForUser.all(userId).map(parseRow);
}

export function getTransactionById(id, userId) {
  if (!userId) return null;
  return parseRow(stmtByIdForUser.get(id, userId));
}

export function updateTransaction(id, userId, data) {
  if (!userId) return null;
  const existing = stmtByIdForUser.get(id, userId);
  if (!existing) return null;   // not found OR belongs to someone else → same 404
  const now = toISO();
  stmtUpdateForUser.run(
    data.type         ?? existing.type,
    Number(data.amount ?? existing.amount),
    data.item         ?? existing.item,
    data.category     ?? existing.category,
    data.date         ?? existing.date,
    data.time         ?? existing.time,
    data.language     ?? existing.language,
    data.paymentMethod ?? existing.paymentMethod,
    data.merchant     ?? existing.merchant,
    now,
    id, userId
  );
  return parseRow(stmtByIdForUser.get(id, userId));
}

export function deleteTransaction(id, userId) {
  if (!userId) return false;
  const r = stmtByIdForUser.get(id, userId);
  if (!r) return false;         // not found OR belongs to someone else → same 404
  stmtDeleteForUser.run(id, userId);
  return true;
}

// ── Analytics — all filtered by userId ───────────────────────────────────────

export function getSummary(userId) {
  const txs = getAllTransactions(userId);

  const todayDate    = new Date();
  const todayStr     = localDateStr(todayDate);
  const yestDate     = new Date(todayDate);
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

export function getWeeklyStats(userId) {
  const txs  = getAllTransactions(userId);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const map  = {};
  for (let i = 6; i >= 0; i--) {
    const d   = new Date(); d.setDate(d.getDate() - i);
    const key = localDateStr(d);
    map[key]  = { name: days[d.getDay()], income: 0, expense: 0, profit: 0 };
  }
  for (const t of txs) {
    if (map[t.date]) {
      if (t.type === 'income') map[t.date].income  += t.amount;
      else                     map[t.date].expense += t.amount;
    }
  }
  return Object.values(map).map(d => ({ ...d, profit: d.income - d.expense }));
}

export function getCategorySpending(userId) {
  const txs  = getAllTransactions(userId).filter(t => t.type === 'expense');
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

export function getGrowthMetrics(userId) {
  const txs       = getAllTransactions(userId);
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

export default db;
