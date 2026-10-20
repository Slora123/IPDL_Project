// server/src/services/ocr.js
// Integrates OCR pipeline from bill-ocr/server.js using Gemini vision API
// All OCR/analyse logic is moved here; only the bill-ocr standalone frontend is discarded.

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_TIMEOUT_MS = 45_000;
const MAX_BYTES = 10 * 1024 * 1024;
const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImageFile(file) {
  if (!file) throw Object.assign(new Error('No image file provided.'), { status: 400 });
  if (!VALID_TYPES.includes(file.mimetype))
    throw Object.assign(new Error('Only JPEG, PNG, or WebP images are supported.'), { status: 415 });
  if (file.size > MAX_BYTES)
    throw Object.assign(new Error('Image too large (max 10 MB).'), { status: 413 });
}

/**
 * Analyse image with Gemini vision (same logic as bill-ocr/server.js:analyse())
 */
async function analyseWithGemini(buf, mimeType) {
  if (!GEMINI_KEY) {
    throw Object.assign(new Error('GEMINI_API_KEY is not configured.'), {
      code: 'GEMINI_API_KEY_MISSING',
      status: 503,
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const prompt = `Decide whether the attached image is a genuine bill/receipt/invoice, and if so extract its details.
Numbers alone do NOT make a bill. A bill has several of: vendor name, purchased items, quantities, prices, subtotal/total, date, invoice number, tax/GST.
Never invent values. Use null for anything not present. Numbers must be plain numbers (no currency symbols). Dates as YYYY-MM-DD (today is ${today}). If quantity is missing use 1; if unitPrice is missing compute it from totalPrice/quantity.`;

  const schema = {
    type: 'object',
    properties: {
      isBill: { type: 'boolean' },
      confidence: { type: 'number' },
      transaction: {
        type: 'object',
        properties: {
          vendorName: { type: 'string', nullable: true },
          date: { type: 'string', nullable: true },
          invoiceNumber: { type: 'string', nullable: true },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                quantity: { type: 'number' },
                unitPrice: { type: 'number', nullable: true },
                totalPrice: { type: 'number', nullable: true }
              },
              required: ['name', 'quantity']
            }
          },
          subtotal: { type: 'number', nullable: true },
          tax: { type: 'number', nullable: true },
          total: { type: 'number', nullable: true },
          currencySymbol: { type: 'string', nullable: true }
        }
      }
    },
    required: ['isBill', 'confidence']
  };

  let r;
  try {
    r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: buf.toString('base64') } }
            ]
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseJsonSchema: schema,
            // OCR extraction is a straightforward structured task; low thinking
            // avoids spending the browser's entire request window reasoning.
            thinkingConfig: { thinkingLevel: 'low' },
          }
        })
      }
    );
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    throw Object.assign(new Error(timedOut ? 'Gemini request timed out.' : 'Gemini could not be reached.'), {
      code: timedOut ? 'GEMINI_REQUEST_TIMEOUT' : 'GEMINI_NETWORK_ERROR',
      status: timedOut ? 504 : 502,
    });
  }

  if (!r.ok) {
    // Keep provider response bodies out of logs and client errors; they can
    // contain request details. The HTTP status is enough to diagnose config,
    // quota, and provider failures safely.
    throw Object.assign(new Error(`Gemini returned HTTP ${r.status}.`), {
      code: `GEMINI_HTTP_${r.status}`,
      status: 503,
    });
  }
  const out = await r.json();
  return JSON.parse(out.candidates[0].content.parts[0].text);
}

function isConfidentBill(a) {
  const t = a?.transaction;
  if (!a?.isBill || !t || !(a.confidence >= 0.7)) return false;
  const hasItems = Array.isArray(t.items) && t.items.length > 0 && t.items.every(i => i?.name);
  const hasTotal = typeof t.total === 'number' && t.total > 0;
  return hasItems && hasTotal && Boolean(t.vendorName || t.invoiceNumber);
}

const num = v => (typeof v === 'number' && isFinite(v) ? v : null);

function cleanTransaction(t) {
  return {
    vendorName: t.vendorName || null,
    date: /^\d{4}-\d{2}-\d{2}$/.test(t.date || '') ? t.date : null,
    invoiceNumber: t.invoiceNumber ? String(t.invoiceNumber) : null,
    currencySymbol: t.currencySymbol || '₹',
    items: t.items.map(i => ({
      name: i.name,
      quantity: num(i.quantity) ?? 1,
      unitPrice: num(i.unitPrice),
      totalPrice: num(i.totalPrice)
    })),
    subtotal: num(t.subtotal),
    tax: num(t.tax) ?? 0,
    total: num(t.total)
  };
}

/**
 * Main scan entry point — same as bill-ocr/server.js:scan()
 * Returns { isBill, transaction } or { isBill: false, message }
 */
export async function scanBill(buf, mimeType) {
  console.log('[OCR] Sending image to Gemini Vision...');
  const analysis = await analyseWithGemini(buf, mimeType);
  // console.log('[OCR] Analysis:', JSON.stringify(analysis, null, 2));

  if (!isConfidentBill(analysis)) {
    console.log('[OCR] Rejected: not a confident bill');
    return { isBill: false, message: 'This image does not appear to be a valid bill or receipt.' };
  }

  const tx = cleanTransaction(analysis.transaction);
  // console.log('[OCR] Extracted:', JSON.stringify(tx, null, 2));
  return { isBill: true, transaction: tx };
}
