// server/src/services/ocr.js
// Integrates OCR pipeline from bill-ocr/server.js using Gemini vision API
// All OCR/analyse logic is moved here; only the bill-ocr standalone frontend is discarded.

const GEMINI_KEY = process.env.GEMINI_API_KEY;
// Receipt extraction is a short, structured multimodal task. Allow a server
// override, but default to Google's supported Gemini 3.8 Flash model.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
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
 * Extract JSON from a Gemini text response.
 * Handles both plain JSON and ```json ... ``` code blocks.
 */
function extractJson(text) {
  if (!text) throw new Error('Empty response from Gemini');
  // Strip markdown code fences if present
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = match ? match[1].trim() : text.trim();
  return JSON.parse(raw);
}

/**
 * Analyse image with Gemini vision.
 * Uses gemini-1.5-flash with a clear JSON-in-text prompt for broad key compatibility.
 */
async function analyseWithGemini(buf, mimeType) {
  if (!GEMINI_KEY) {
    throw Object.assign(new Error('GEMINI_API_KEY is not configured.'), {
      code: 'GEMINI_API_KEY_MISSING',
      status: 503,
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  // Ask Gemini to return pure JSON — works on free-tier gemini-1.5-flash keys.
  const prompt = `You are a bill/receipt OCR assistant. Analyze the attached image and respond with ONLY a valid JSON object (no markdown, no extra text).

Decide if the image is a genuine bill/receipt/invoice. A bill must have several of: vendor name, items, prices, subtotal/total, date, invoice number, or tax/GST. Numbers alone are NOT a bill.

Return this exact JSON structure:
{
  "isBill": true or false,
  "confidence": 0.0 to 1.0,
  "transaction": {
    "vendorName": "string or null",
    "date": "YYYY-MM-DD or null (today is ${today})",
    "invoiceNumber": "string or null",
    "currencySymbol": "₹ or $ or other",
    "items": [
      { "name": "item name", "quantity": 1, "unitPrice": 0.00, "totalPrice": 0.00 }
    ],
    "subtotal": 0.00,
    "tax": 0.00,
    "total": 0.00
  }
}

Rules:
- Never invent values. Use null for anything not visible.
- Numbers must be plain numbers (no currency symbols).
- If quantity is missing, use 1. If unitPrice is missing, compute it from totalPrice/quantity.
- If it is NOT a bill, set isBill=false and transaction can be null.`;

  const candidateModels = [
    GEMINI_MODEL,
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  let out = null;
  let lastError = null;
  let successfulModel = null;

  for (const modelName of candidateModels) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_KEY}`,
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
              temperature: 0.1,
            }
          })
        }
      );

      if (!r.ok) {
        const errBody = await r.text().catch(() => '');
        console.warn(`[OCR] Model ${modelName} returned HTTP ${r.status}:`, errBody.slice(0, 150));
        const statusErr = Object.assign(new Error(`Gemini returned HTTP ${r.status}.`), {
          code: `GEMINI_HTTP_${r.status}`,
          status: r.status === 429 ? 429 : 503,
        });
        lastError = statusErr;

        // On quota (429), not found (404), or transient service busy (503), try next model
        if (r.status === 429 || r.status === 404 || r.status === 503) {
          continue;
        }
        throw statusErr;
      }

      out = await r.json();
      successfulModel = modelName;
      if (modelName !== GEMINI_MODEL) {
        console.log(`[OCR] Successfully scanned bill using fallback model: ${modelName}`);
      }
      break;
    } catch (error) {
      lastError = error;
      if (error?.code?.startsWith('GEMINI_HTTP_') && (error.code === 'GEMINI_HTTP_429' || error.code === 'GEMINI_HTTP_404' || error.code === 'GEMINI_HTTP_503')) {
        continue;
      }
      const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
      const networkErr = Object.assign(new Error(timedOut ? 'Gemini request timed out.' : 'Gemini could not be reached.'), {
        code: timedOut ? 'GEMINI_REQUEST_TIMEOUT' : 'GEMINI_NETWORK_ERROR',
        status: timedOut ? 504 : 502,
      });
      lastError = networkErr;
      console.warn(`[OCR] Model ${modelName} network/timeout error, trying fallback...`);
    }
  }

  if (!out) {
    if (lastError) throw lastError;
    throw Object.assign(new Error('Failed to analyze bill with any AI model.'), {
      code: 'GEMINI_ALL_MODELS_FAILED',
      status: 502,
    });
  }
  const rawText = out?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    console.error('[OCR] Unexpected Gemini response shape:', JSON.stringify(out).slice(0, 500));
    throw Object.assign(new Error('Gemini returned an empty response.'), {
      code: 'GEMINI_EMPTY_RESPONSE',
      status: 502,
    });
  }

  try {
    return extractJson(rawText);
  } catch (parseErr) {
    console.error('[OCR] Failed to parse Gemini JSON:', rawText.slice(0, 500));
    throw Object.assign(new Error('Gemini returned malformed JSON.'), {
      code: 'GEMINI_PARSE_ERROR',
      status: 502,
    });
  }
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
