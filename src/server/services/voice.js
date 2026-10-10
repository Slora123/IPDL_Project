// server/src/services/voice.js
// Integrates SarvamAI speech-to-text/translate pipeline from nlp/backend/main.py
// and adds financial intent parsing on top



const SARVAM_KEY = process.env.SARVAM_API_KEY;
const SARVAM_BASE = 'https://api.sarvam.ai';

/**
 * Step 1+2: transcribe audio in native language AND translate to English
 * Mirrors the logic in nlp/backend/main.py:transcribe_translate()
 */
export async function transcribeAndTranslate(audioBuffer, mimeType, targetLang = 'en-IN') {
  if (!SARVAM_KEY) throw new Error('SARVAM_API_KEY not set in server/.env');

  // 1. Transcribe
  const fd1 = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });
  fd1.append('file', blob, 'audio.webm');
  fd1.append('model', 'saaras:v3');
  fd1.append('language_code', 'unknown');
  fd1.append('mode', 'transcribe');

  const transcribeRes = await fetch(`${SARVAM_BASE}/speech-to-text`, {
    method: 'POST',
    headers: { 'api-subscription-key': SARVAM_KEY },
    body: fd1
  });

  if (!transcribeRes.ok) {
    const err = await transcribeRes.text();
    throw new Error(`Sarvam transcribe failed (${transcribeRes.status}): ${err}`);
  }

  const transcribeData = await transcribeRes.json();
  const transcript = transcribeData.transcript || '';
  const sourceLanguage = transcribeData.language_code || 'unknown';

  // 2. Translate to English (direct speech-to-english)
  const fd2 = new FormData();
  fd2.append('file', blob, 'audio.webm');
  fd2.append('model', 'saaras:v3');
  fd2.append('mode', 'translate');

  const translateRes = await fetch(`${SARVAM_BASE}/speech-to-text-translate`, {
    method: 'POST',
    headers: { 'api-subscription-key': SARVAM_KEY },
    body: fd2
  });

  let englishTranslation = transcript; // fallback
  if (translateRes.ok) {
    const translateData = await translateRes.json();
    englishTranslation = translateData.transcript || transcript;
  } else {
    console.warn('Sarvam translate step failed, using transcript as-is');
  }

  return { transcript, englishTranslation, sourceLanguage, targetLang };
}

/**
 * Step 3: Parse financial intent from English text
 * Extracts: type (income|expense), amount, item, category, date, paymentMethod
 */
export function parseFinancialIntent(text, originalText = '') {
  if (!text || text.trim().length < 3) return null;

  const normalized = (text + ' ' + originalText).toLowerCase().trim();

  // ── Amount extraction ───────────────────────────────────────────────────
  // Matches patterns: 500 rupees, ₹500, Rs 500, 1,000, 1.5k, etc.
  const amountPatterns = [
    /(?:₹|rs\.?|inr|rupees?)\s*([\d,]+(?:\.\d+)?)\s*(?:k|thousand)?/i,
    /([\d,]+(?:\.\d+)?)\s*(?:₹|rs\.?|inr|rupees?)/i,
    /([\d,]+(?:\.\d+)?)\s*k\b/i,  // 5k = 5000
    /\b([\d,]+(?:\.\d+)?)\b(?=\s+(?:to|for|on|from|at))/i
  ];

  let amount = null;
  let isKilo = false;
  for (const pat of amountPatterns) {
    const m = normalized.match(pat);
    if (m) {
      const raw = m[1].replace(/,/g, '');
      amount = parseFloat(raw);
      if (normalized.includes(`${m[1]}k`) || normalized.includes(`${m[1]} k`)) {
        amount *= 1000;
        isKilo = true;
      }
      break;
    }
  }

  // Fallback: just grab any number
  if (!amount) {
    const nums = normalized.match(/\b(\d[\d,]*(?:\.\d+)?)\b/g);
    if (nums && nums.length > 0) {
      amount = parseFloat(nums[0].replace(/,/g, ''));
    }
  }

  if (!amount || amount <= 0 || isNaN(amount)) return null;

  // ── Transaction type ────────────────────────────────────────────────────
  const INCOME_TRIGGERS = [
    'earned', 'earn', 'received', 'receive', 'got', 'get', 'salary', 'income',
    'payment received', 'sold', 'sell', 'sale', 'revenue', 'profit received',
    'client paid', 'customer paid', 'collected', 'credited', 'deposited',
    'freelancing', 'freelance income', 'profit from', 'gain', 'bonus',
    'dividend', 'interest received', 'refund received', 'cashback'
  ];
  const EXPENSE_TRIGGERS = [
    'spent', 'spend', 'paid', 'pay', 'bought', 'buy', 'purchased', 'purchase',
    'lost', 'wasted', 'gave', 'given', 'donated', 'bill', 'fee', 'cost',
    'expense', 'invested in', 'charged', 'deducted', 'withdrawal', 'withdrew',
    'transfer to', 'sent to', 'lent', 'borrowed and spent', 'subscribed',
    'subscription', 'rent paid', 'grocery', 'shopping', 'electricity', 'fuel'
  ];

  let type = null;
  for (const trigger of INCOME_TRIGGERS) {
    if (normalized.includes(trigger)) { type = 'income'; break; }
  }
  if (!type) {
    for (const trigger of EXPENSE_TRIGGERS) {
      if (normalized.includes(trigger)) { type = 'expense'; break; }
    }
  }
  // Default to expense if truly ambiguous
  if (!type) type = 'expense';

  // ── Category ────────────────────────────────────────────────────────────
  const CATEGORY_MAP = {
    'Food & Beverage': ['food', 'restaurant', 'meal', 'lunch', 'dinner', 'breakfast', 'coffee', 'tea', 'snack', 'juice', 'water', 'hotel food'],
    'Grocery': ['grocery', 'groceries', 'vegetables', 'sabji', 'sabzi', 'milk', 'bread', 'rice', 'dal', 'ration', 'supermarket'],
    'Transport': ['transport', 'travel', 'uber', 'ola', 'auto', 'bus', 'train', 'petrol', 'diesel', 'fuel', 'cab', 'taxi', 'metro', 'flight', 'ticket'],
    'Utilities': ['electricity', 'electric', 'water bill', 'gas bill', 'internet', 'mobile recharge', 'recharge', 'phone bill', 'wifi', 'broadband'],
    'Shopping': ['shopping', 'clothes', 'clothing', 'shoes', 'dress', 'shirt', 'amazon', 'flipkart', 'online', 'purchase'],
    'Healthcare': ['medicine', 'doctor', 'hospital', 'medical', 'pharmacy', 'health', 'clinic', 'test', 'checkup'],
    'Entertainment': ['movie', 'entertainment', 'netflix', 'spotify', 'gaming', 'game', 'fun', 'outing', 'party'],
    'Salary': ['salary', 'paycheck', 'wages', 'stipend', 'pay received'],
    'Freelancing': ['freelance', 'freelancing', 'project', 'client', 'consulting', 'gig'],
    'Sales': ['sold', 'sale', 'customer paid', 'customer', 'selling'],
    'Business': ['business', 'office', 'stationery', 'supplies', 'inventory', 'restock'],
    'Rent': ['rent', 'accommodation', 'pg', 'hostel'],
    'Education': ['education', 'course', 'book', 'tuition', 'school', 'college', 'fees'],
    'Investment': ['investment', 'stock', 'mutual fund', 'sip', 'fd', 'insurance'],
  };

  let category = 'General';
  for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(kw => normalized.includes(kw))) {
      category = cat;
      break;
    }
  }
  // Align income categories
  if (type === 'income' && category === 'General') {
    if (normalized.includes('salary') || normalized.includes('wages')) category = 'Salary';
    else if (normalized.includes('freelan')) category = 'Freelancing';
    else if (normalized.includes('sold') || normalized.includes('sale')) category = 'Sales';
    else if (normalized.includes('client') || normalized.includes('project')) category = 'Freelancing';
  }

  // ── Item/description ────────────────────────────────────────────────────
  // Extract what follows "on", "for", "from", "to", prepositions
  let item = '';
  const itemPatterns = [
    /(?:spent?|paid?|bought?)\s+(?:₹|rs\.?|rupees?|inr)?\s*[\d,]+\s*(?:rupees?)?\s+(?:on|for)\s+(.+?)(?:\s+(?:via|using|by|through|on|$))/i,
    /(?:on|for)\s+(.+?)(?:\s+(?:using|via|by|through|\d|rupees?|₹|$))/i,
    /(?:from|for)\s+(.+?)(?:\s+\d|$)/i,
  ];
  for (const pat of itemPatterns) {
    const m = text.match(pat);
    if (m && m[1] && m[1].trim().length > 1) {
      item = m[1].trim();
      break;
    }
  }

  // Fallback: strip amount and transaction words, use rest as item
  if (!item) {
    item = text
      .replace(/[\d,]+(?:\.\d+)?\s*(?:rupees?|₹|rs\.?|inr)?/gi, '')
      .replace(/\b(i|me|my|the|a|an|some|earned?|spent?|paid?|received?|got|bought?|wasted?|gave?|given|lost|income|expense|transaction)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  if (!item || item.length < 2) item = text.trim().slice(0, 60);

  // ── Payment method ──────────────────────────────────────────────────────
  let paymentMethod = null;
  if (/\b(upi|gpay|google pay|phonepe|paytm)\b/i.test(normalized)) paymentMethod = 'UPI';
  else if (/\b(cash|nakit)\b/i.test(normalized)) paymentMethod = 'Cash';
  else if (/\b(card|debit|credit|swipe)\b/i.test(normalized)) paymentMethod = 'Card';
  else if (/\b(net banking|neft|rtgs|imps|bank transfer)\b/i.test(normalized)) paymentMethod = 'Net Banking';
  else if (/\b(cheque|check)\b/i.test(normalized)) paymentMethod = 'Cheque';

  // ── Date ────────────────────────────────────────────────────────────────
  let date = new Date().toISOString().slice(0, 10);
  if (/\byesterday\b/i.test(normalized)) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    date = y.toISOString().slice(0, 10);
  } else if (/\b(last\s+week|past\s+week)\b/i.test(normalized)) {
    const lw = new Date(); lw.setDate(lw.getDate() - 7);
    date = lw.toISOString().slice(0, 10);
  }

  return { type, amount, item: item || text.trim(), category, date, paymentMethod };
}
