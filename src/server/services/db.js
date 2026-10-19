// server/src/services/db.js
// Central SQLite database — single source of truth for all transactions
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));

// DB_PATH env var lets Railway point at a persistent volume (e.g. /data/trackify.db).
// Falls back to project root for local dev — existing data is never overwritten.
const dbPath = process.env.DB_PATH || path.join(here, '../../trackify.db');
console.log(`[DB] SQLite path: ${dbPath}`);

const db = new DatabaseSync(dbPath);

// ── schema ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL CHECK(type IN ('income','expense')),
    amount      REAL NOT NULL CHECK(amount > 0),
    currency    TEXT NOT NULL DEFAULT 'INR',
    item        TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'General',
    date        TEXT NOT NULL,
    time        TEXT NOT NULL,
    language    TEXT NOT NULL DEFAULT 'english',
    paymentMethod TEXT,
    source      TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('voice','bill','manual')),
    merchant    TEXT,
    voiceInput  TEXT,
    billRef     TEXT,
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
`);

// ── prepared statements ──────────────────────────────────────────────────────
const stmtInsert = db.prepare(`
  INSERT INTO transactions
    (id,type,amount,currency,item,category,date,time,language,paymentMethod,source,merchant,voiceInput,billRef,createdAt,updatedAt)
  VALUES
    (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`);

const stmtAll = db.prepare(`SELECT * FROM transactions ORDER BY date DESC, createdAt DESC`);
const stmtById = db.prepare(`SELECT * FROM transactions WHERE id=?`);
const stmtDelete = db.prepare(`DELETE FROM transactions WHERE id=?`);
const stmtUpdate = db.prepare(`
  UPDATE transactions
  SET type=?,amount=?,item=?,category=?,date=?,time=?,language=?,paymentMethod=?,merchant=?,updatedAt=?
  WHERE id=?
`);

// ── helpers ──────────────────────────────────────────────────────────────────
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

// ── public API ────────────────────────────────────────────────────────────────

export function createTransaction(data) {
  const id = randomUUID();
  const now = toISO();
  // Use local date (not UTC) so IST users get the correct date
  const date = data.date || localDateStr();
  const time = data.time || timeStr();

  stmtInsert.run(
    id,
    data.type,
    Number(data.amount),
    data.currency || 'INR',
    data.item,
    data.category || 'General',
    date,
    time,
    data.language || 'english',
    data.paymentMethod || null,
    data.source || 'manual',
    data.merchant || null,
    data.voiceInput || null,
    data.billRef || null,
    now,
    now
  );
  return parseRow(stmtById.get(id));
}

export function getAllTransactions() {
  return stmtAll.all().map(parseRow);
}

export function getTransactionById(id) {
  return parseRow(stmtById.get(id));
}

export function updateTransaction(id, data) {
  const existing = stmtById.get(id);
  if (!existing) return null;
  const now = toISO();
  stmtUpdate.run(
    data.type ?? existing.type,
    Number(data.amount ?? existing.amount),
    data.item ?? existing.item,
    data.category ?? existing.category,
    data.date ?? existing.date,
    data.time ?? existing.time,
    data.language ?? existing.language,
    data.paymentMethod ?? existing.paymentMethod,
    data.merchant ?? existing.merchant,
    now,
    id
  );
  return parseRow(stmtById.get(id));
}

export function deleteTransaction(id) {
  const r = stmtById.get(id);
  if (!r) return false;
  stmtDelete.run(id);
  return true;
}

export function getSummary() {
  const txs = getAllTransactions();

  // today / yesterday date strings (YYYY-MM-DD) in local time
  const todayDate = new Date();
  const todayStr = localDateStr(todayDate);
  const yestDate = new Date(todayDate);
  yestDate.setDate(yestDate.getDate() - 1);
  const yesterdayStr = localDateStr(yestDate);

  const todayTxs = txs.filter(t => t.date === todayStr);
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

  // All transactions (most recent 6) for the dashboard recent list
  const recentTransactions = txs.slice(0, 6);

  return {
    // Today-only stats (what the dashboard "Today's Income / Expenses" cards show)
    income:        todayIncome,
    expenses:      todayExpenses,
    profit:        todayIncome - todayExpenses,
    transactions:  todayTxs.length,

    // Yesterday's baseline (for trend badges)
    yesterday: {
      income:        yestIncome,
      expenses:      yestExpenses,
      profit:        yestIncome - yestExpenses,
      transactions:  yesterdayTxs.length,
    },

    // Percentage-change strings  e.g. "+23%" / "-5%"
    trends: {
      income:       pctChange(todayIncome,   yestIncome),
      expenses:     pctChange(todayExpenses,  yestExpenses),
      profit:       pctChange(todayIncome - todayExpenses, yestIncome - yestExpenses),
      transactions: pctChange(todayTxs.length, yesterdayTxs.length),
    },

    // All-time totals (for other analytics pages that still need them)
    allTime: {
      income:       sum(txs, 'income'),
      expenses:     sum(txs, 'expense'),
      transactions: txs.length,
    },

    recentTransactions,
    todayStr,
    yesterdayStr,
  };
}

export function getWeeklyStats() {
  const txs = getAllTransactions();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const map = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = localDateStr(d);
    map[key] = { name: days[d.getDay()], income: 0, expense: 0, profit: 0 };
  }
  for (const t of txs) {
    if (map[t.date]) {
      if (t.type === 'income') map[t.date].income += t.amount;
      else map[t.date].expense += t.amount;
    }
  }
  return Object.values(map).map(d => ({ ...d, profit: d.income - d.expense }));
}

export function getCategorySpending() {
  const txs = getAllTransactions().filter(t => t.type === 'expense');
  const map = {};
  for (const t of txs) {
    map[t.category] = (map[t.category] || 0) + t.amount;
  }
  const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
  const COLORS = ['#f87171', '#60a5fa', '#facc15', '#4ade80', '#c084fc', '#fb923c', '#a78bfa'];
  const sorted = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, amount], i) => ({
      name,
      amount,
      value: amount,
      percentage: Math.round((amount / total) * 100),
      color: COLORS[i % COLORS.length],
      growth: '+0%'
    }));
  return { topCategories: sorted };
}

export function getGrowthMetrics() {
  const txs = getAllTransactions();
  const today = localDateStr();
  const thisMonth = today.slice(0, 7);
  const lastMonthDate = new Date(); lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = localDateStr(lastMonthDate).slice(0, 7);

  const sum = (arr, type) => arr.filter(t => t.type === type).reduce((s, t) => s + t.amount, 0);

  const thisIncome = sum(txs.filter(t => t.date.startsWith(thisMonth)), 'income');
  const lastIncome = sum(txs.filter(t => t.date.startsWith(lastMonth)), 'income');
  const thisExpenses = sum(txs.filter(t => t.date.startsWith(thisMonth)), 'expense');
  const totalIncome = sum(txs, 'income');
  const totalExpenses = sum(txs, 'expense');

  const revenueGrowth = lastIncome > 0
    ? `${((thisIncome - lastIncome) / lastIncome * 100).toFixed(1)}%`
    : totalIncome > 0 ? '+100%' : '0%';
  const expenseRatio = totalIncome > 0
    ? `${((totalExpenses / totalIncome) * 100).toFixed(0)}%` : '0%';
  const profitMargin = totalIncome > 0
    ? `${(((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(0)}%` : '0%';

  return {
    revenueGrowth: revenueGrowth.startsWith('-') ? revenueGrowth : `+${revenueGrowth}`.replace('++', '+'),
    expenseRatio,
    profitMargin,
    customerRetention: '—'
  };
}

export default db;
