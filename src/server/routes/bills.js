// server/src/routes/bills.js
// POST /api/bills/scan  — receive image, run OCR via Gemini, return extracted transaction preview
// POST /api/bills/confirm — save the confirmed transaction to the shared DB

import { Router } from 'express';
import multer from 'multer';
import { scanBill, validateImageFile } from '../services/ocr.js';
import { createTransaction } from '../services/db.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/bills/scan
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

    // Return the extracted transaction for user review — NOT saved yet
    return res.json({
      isBill: true,
      transaction: {
        vendorName: result.transaction.vendorName,
        date: result.transaction.date || new Date().toISOString().slice(0, 10),
        invoiceNumber: result.transaction.invoiceNumber,
        items: result.transaction.items,
        subtotal: result.transaction.subtotal,
        tax: result.transaction.tax,
        total: result.transaction.total,
        currencySymbol: result.transaction.currencySymbol || '₹'
      }
    });
  } catch (e) {
    console.error('[Bills] scan error:', e);
    res.status(500).json({ error: 'Could not process the image. Please try again.' });
  }
});

// POST /api/bills/confirm — called when user clicks "Save Transaction" after reviewing
router.post('/confirm', (req, res) => {
  try {
    const { transaction } = req.body;
    if (!transaction) return res.status(400).json({ error: 'No transaction data provided.' });

    const { total, vendorName, date, invoiceNumber, items } = transaction;

    if (!total || total <= 0)
      return res.status(400).json({ error: 'Bill total is required and must be positive.' });

    // Build the item description from line items
    const itemDesc = items && items.length > 0
      ? (items.length === 1 ? items[0].name : `${items[0].name} + ${items.length - 1} more`)
      : vendorName || 'Bill Expense';

    const saved = createTransaction({
      type: 'expense',
      amount: total,
      item: itemDesc,
      category: 'Shopping',
      date: date || new Date().toISOString().slice(0, 10),
      merchant: vendorName,
      source: 'bill',
      billRef: invoiceNumber || null,
      language: 'english'
    });

    res.status(201).json({ success: true, transaction: saved });
  } catch (e) {
    console.error('[Bills] confirm error:', e);
    res.status(500).json({ error: 'Failed to save bill transaction.' });
  }
});

export default router;
