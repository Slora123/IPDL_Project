// server/src/routes/transactions.js
import { Router } from 'express';
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getWeeklyStats,
  getCategorySpending,
  getGrowthMetrics
} from '../services/db.js';

const router = Router();

// GET /api/transactions
router.get('/', (req, res) => {
  try {
    const txs = getAllTransactions();
    res.json(txs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /api/transactions/:id
router.get('/:id', (req, res) => {
  try {
    const tx = getTransactionById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json(tx);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// POST /api/transactions
router.post('/', (req, res) => {
  try {
    const { type, amount, item, category, date, time, language, paymentMethod, source, merchant, voiceInput, billRef } = req.body;

    if (!type || !['income', 'expense'].includes(type))
      return res.status(400).json({ error: 'type must be "income" or "expense"' });
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || isNaN(amt))
      return res.status(400).json({ error: 'amount must be a positive number' });
    if (!item || typeof item !== 'string' || item.trim().length < 1)
      return res.status(400).json({ error: 'item description is required' });

    const tx = createTransaction({ type, amount: amt, item: item.trim(), category, date, time, language, paymentMethod, source, merchant, voiceInput, billRef });
    res.status(201).json(tx);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// PATCH /api/transactions/:id
router.patch('/:id', (req, res) => {
  try {
    const existing = getTransactionById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Transaction not found' });

    const { amount } = req.body;
    if (amount !== undefined) {
      const amt = parseFloat(amount);
      if (!amt || amt <= 0 || isNaN(amt))
        return res.status(400).json({ error: 'amount must be a positive number' });
    }

    const tx = updateTransaction(req.params.id, req.body);
    res.json(tx);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteTransaction(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// ── analytics ──────────────────────────────────────────────────────────────

// GET /api/stats  (dashboard summary)
router.get('/stats/summary', (req, res) => {
  res.json(getSummary());
});

export default router;
