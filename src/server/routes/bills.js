// src/server/routes/bills.js
// POST /api/bills/scan     — OCR via Gemini, returns extracted preview (not saved)
// POST /api/bills/confirm  — saves as an EXPENSE (shopkeeper bought something)
// POST /api/bills/confirm-sale — saves as an INCOME (shopkeeper sold to customer)
//
// Auth: requireAuth is applied globally in index.js for the /api/bills prefix.
// userId always comes from req.user.id — never from the request body.

import { Router } from 'express';
import multer from 'multer';
import { scanBill, validateImageFile } from '../services/ocr.js';
import { createTransaction, billRefExistsForUser } from '../services/db.js';

const router = Router();

// Keep image in memory (max 10 MB). The compressed JPEG is stored as base64
// in the transaction's billImage column for future viewing.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── POST /api/bills/scan ─────────────────────────────────────────────────────
// Accepts a multipart image, runs Gemini OCR, returns structured preview.
// The image buffer is also returned as base64 so the frontend can pass it
// back during confirm without a second upload.
router.post('/scan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided.' });

    try { validateImageFile(req.file); } catch (validErr) {
      return res.status(validErr.status || 400).json({ error: validErr.message });
    }

    const result = await scanBill(req.file.buffer, req.file.mimetype);

    if (!result.isBill) {
      return res.json({ isBill: false, message: result.message });
    }

    // Return the extracted transaction preview AND a base64 copy of the image
    // so the client can attach it when confirming (no second upload needed).
    const imageBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    return res.json({
      isBill: true,
      imageBase64,
      transaction: {
        vendorName:     result.transaction.vendorName,
        date:           result.transaction.date || new Date().toISOString().slice(0, 10),
        invoiceNumber:  result.transaction.invoiceNumber,
        items:          result.transaction.items,
        subtotal:       result.transaction.subtotal,
        tax:            result.transaction.tax,
        total:          result.transaction.total,
        currencySymbol: result.transaction.currencySymbol || '₹',
      },
    });
  } catch (e) {
    console.error('[Bills] scan error:', e);
    res.status(500).json({ error: 'Could not process the image. Please try again.' });
  }
});

// ── Shared helper ─────────────────────────────────────────────────────────────
function buildItemDescription(items, vendorName) {
  if (!items || items.length === 0) return vendorName || 'Bill';
  if (items.length === 1) return items[0].name;
  return `${items[0].name} + ${items.length - 1} more`;
}

// ── POST /api/bills/confirm — save as EXPENSE ─────────────────────────────────
// Used when shopkeeper records a purchase they made (money out).
router.post('/confirm', (req, res) => {
  try {
    const { transaction, imageBase64 } = req.body;
    if (!transaction) return res.status(400).json({ error: 'No transaction data provided.' });

    const { total, vendorName, date, invoiceNumber, items, category } = transaction;

    if (!total || total <= 0)
      return res.status(400).json({ error: 'Bill total is required and must be positive.' });

    // Duplicate prevention: if the same invoiceNumber was already saved by this
    // user, reject the second save rather than creating a duplicate transaction.
    if (invoiceNumber && billRefExistsForUser(req.user.id, invoiceNumber, 'expense')) {
      return res.status(409).json({ error: 'This bill has already been saved as an expense.' });
    }

    const saved = createTransaction(req.user.id, {
      type:         'expense',
      amount:       total,
      item:         buildItemDescription(items, vendorName),
      category:     category || 'Shopping',
      date:         date || new Date().toISOString().slice(0, 10),
      merchant:     vendorName,
      source:       'bill',
      billRef:      invoiceNumber || null,
      billImage:    imageBase64   || null,
      language:     'english',
    });

    res.status(201).json({ success: true, transaction: saved });
  } catch (e) {
    console.error('[Bills] confirm error:', e);
    res.status(500).json({ error: 'Failed to save bill as expense.' });
  }
});

// ── POST /api/bills/confirm-sale — save as INCOME (revenue) ──────────────────
// Used when shopkeeper records a sale they made to a customer (money in).
router.post('/confirm-sale', (req, res) => {
  try {
    const { transaction, imageBase64 } = req.body;
    if (!transaction) return res.status(400).json({ error: 'No transaction data provided.' });

    const { total, vendorName, date, invoiceNumber, items, category, saleDescription } = transaction;

    if (!total || total <= 0)
      return res.status(400).json({ error: 'Sale total is required and must be positive.' });

    // Duplicate prevention for income entries
    if (invoiceNumber && billRefExistsForUser(req.user.id, invoiceNumber, 'income')) {
      return res.status(409).json({ error: 'This bill has already been saved as a sale/income.' });
    }

    // For sales, the item description is the sale description the shopkeeper wrote,
    // falling back to the items on the bill or the customer name.
    const itemDesc = saleDescription?.trim() ||
                     buildItemDescription(items, vendorName) ||
                     'Customer Sale';

    const saved = createTransaction(req.user.id, {
      type:         'income',
      amount:       total,
      item:         itemDesc,
      category:     category || 'Sales',
      date:         date || new Date().toISOString().slice(0, 10),
      merchant:     vendorName,           // reused as customer name for sales
      source:       'bill',
      billRef:      invoiceNumber || null,
      billImage:    imageBase64   || null,
      language:     'english',
    });

    res.status(201).json({ success: true, transaction: saved });
  } catch (e) {
    console.error('[Bills] confirm-sale error:', e);
    res.status(500).json({ error: 'Failed to save bill as sale.' });
  }
});

export default router;
