// server/src/routes/stubs.js
// Stub routes for features not yet backed by real DB logic.
// These return sensible empty/default responses so the frontend pages load without errors.

import { Router } from 'express';
import { randomUUID } from 'node:crypto';

const router = Router();

// ── In-memory stores (survive the process lifetime; replace with SQLite later) ──
const loansStore = [];
const userSettings = {
  profile: { name: 'User', email: '', phone: '', businessName: '' },
  preferences: { currency: 'INR', language: 'en', theme: 'dark', notifications: true },
};

// ── Loans ──────────────────────────────────────────────────────────────────────
router.get('/loans', (_req, res) => res.json(loansStore));

router.post('/loans', (req, res) => {
  const { name, amount, emiAmount, dueDate } = req.body;
  if (!name || !amount || !dueDate)
    return res.status(400).json({ error: 'name, amount, and dueDate are required' });
  const loan = { id: randomUUID(), name, amount: Number(amount), emiAmount: Number(emiAmount) || 0, dueDate, status: 'active', createdAt: new Date().toISOString() };
  loansStore.push(loan);
  res.status(201).json(loan);
});

router.put('/loans/:id', (req, res) => {
  const idx = loansStore.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Loan not found' });
  loansStore[idx] = { ...loansStore[idx], ...req.body, id: loansStore[idx].id };
  res.json(loansStore[idx]);
});

router.delete('/loans/:id', (req, res) => {
  const idx = loansStore.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Loan not found' });
  loansStore.splice(idx, 1);
  res.json({ success: true });
});

// ── Reports ────────────────────────────────────────────────────────────────────
router.get('/reports', (_req, res) => {
  res.json([
    { id: 'monthly', name: 'Monthly Summary', description: 'Income, expense & profit summary' },
    { id: 'category', name: 'Category Breakdown', description: 'Spending by category' },
    { id: 'weekly', name: 'Weekly Trends', description: 'Last 7 days performance' },
  ]);
});

router.get('/reports/generate/:id', (req, res) => {
  // Returns a stub report payload — replace with real PDF generation later
  res.json({
    id: req.params.id,
    generatedAt: new Date().toISOString(),
    message: `Report "${req.params.id}" generated. PDF download coming soon.`,
  });
});

// ── User Settings ──────────────────────────────────────────────────────────────
router.get('/user/settings', (_req, res) => res.json(userSettings));
router.put('/user/settings', (req, res) => {
  if (req.body.profile) Object.assign(userSettings.profile, req.body.profile);
  if (req.body.preferences) Object.assign(userSettings.preferences, req.body.preferences);
  res.json({ success: true, settings: userSettings });
});

// ── Growth (alias — analytics/growth already exists but GrowthInsights.tsx hits this) ──
router.get('/analytics/growth', (_req, res) => {
  // Will be overridden by analytics router if registered first; this is a fallback
  res.json({ revenueGrowth: '0%', expenseRatio: '0%', profitMargin: '0%', customerRetention: '—' });
});

export default router;
