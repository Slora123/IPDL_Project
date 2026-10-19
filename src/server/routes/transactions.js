// src/server/routes/transactions.js
// All endpoints require authentication.
// userId is always taken from the verified JWT (req.user.id).
// The frontend cannot supply or override the userId.

import { Router } from 'express';
import { requireAuth } from './auth.js';
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from '../services/db.js';

const router = Router();

// Apply auth to every transaction route
router.use(requireAuth);

// GET /api/transactions
router.get('/', (req, res) => {
  try {
    const txs = getAllTransactions(req.user.id);
    res.json(txs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /api/transactions/:id
router.get('/:id', (req, res) => {
  try {
    const tx = getTransactionById(req.params.id, req.user.id);
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

    // userId always comes from the verified token — never from req.body
    const tx = createTransaction(req.user.id, {
      type, amount: amt, item: item.trim(),
      category, date, time, language,
      paymentMethod, source, merchant, voiceInput, billRef,
    });
    res.status(201).json(tx);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// PATCH /api/transactions/:id
router.patch('/:id', (req, res) => {
  try {
    // getTransactionById checks both id AND userId — cross-user access returns null
    const existing = getTransactionById(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Transaction not found' });

    const { amount } = req.body;
    if (amount !== undefined) {
      const amt = parseFloat(amount);
      if (!amt || amt <= 0 || isNaN(amt))
        return res.status(400).json({ error: 'amount must be a positive number' });
    }

    const tx = updateTransaction(req.params.id, req.user.id, req.body);
    res.json(tx);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', (req, res) => {
  try {
    // deleteTransaction checks both id AND userId — cross-user deletion returns false
    const deleted = deleteTransaction(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
