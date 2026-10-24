// server/src/services/voice.js
// SarvamAI speech-to-text/translation + financial intent parsing.

const SARVAM_KEY = process.env.SARVAM_API_KEY;
const SARVAM_BASE = 'https://api.sarvam.ai';

/**
 * Step 1 + 2: Transcribe speech and translate it to English.
 */
export async function transcribeAndTranslate(audioBuffer, mimeType, targetLang = 'en-IN') {
  if (!SARVAM_KEY) {
    throw new Error('SARVAM_API_KEY not set in server/.env');
  }

  const blob = new Blob([audioBuffer], { type: mimeType });

  const transcribeForm = new FormData();
  transcribeForm.append('file', blob, 'audio.webm');
  transcribeForm.append('model', 'saaras:v3');
  transcribeForm.append('language_code', 'unknown');
  transcribeForm.append('mode', 'transcribe');

  const transcribeRes = await fetch(`${SARVAM_BASE}/speech-to-text`, {
    method: 'POST',
    headers: { 'api-subscription-key': SARVAM_KEY },
    body: transcribeForm
  });

  if (!transcribeRes.ok) {
    const error = await transcribeRes.text();
    throw new Error(`Sarvam transcribe failed (${transcribeRes.status}): ${error}`);
  }

  const transcribeData = await transcribeRes.json();
  const transcript = transcribeData.transcript || '';
  const sourceLanguage = transcribeData.language_code || 'unknown';

  const translateForm = new FormData();
  translateForm.append('file', blob, 'audio.webm');
  translateForm.append('model', 'saaras:v3');
  translateForm.append('mode', 'translate');

  let englishTranslation = transcript;

  const translateRes = await fetch(`${SARVAM_BASE}/speech-to-text-translate`, {
    method: 'POST',
    headers: { 'api-subscription-key': SARVAM_KEY },
    body: translateForm
  });

  if (translateRes.ok) {
    const translateData = await translateRes.json();
    englishTranslation = translateData.transcript || transcript;
  } else {
    console.warn('[Voice] Translation failed; using original transcript.');
  }

  return { transcript, englishTranslation, sourceLanguage, targetLang };
}

/**
 * Convert common English number words into a numeric amount.
 * Examples: "five hundred" -> 500, "one thousand two hundred" -> 1200.
 */
function parseNumberWords(text) {
  const words = text.toLowerCase().replace(/-/g, ' ').match(/[a-z]+/g) || [];

  const smallNumbers = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
    fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
    nineteen: 19
  };

  const tens = {
    twenty: 20, thirty: 30, forty: 40, fifty: 50,
    sixty: 60, seventy: 70, eighty: 80, ninety: 90
  };

  let total = 0;
  let current = 0;
  let found = false;

  for (const word of words) {
    if (Object.hasOwn(smallNumbers, word)) {
      current += smallNumbers[word];
      found = true;
    } else if (Object.hasOwn(tens, word)) {
      current += tens[word];
      found = true;
    } else if (word === 'hundred' && found) {
      current = Math.max(1, current) * 100;
    } else if ((word === 'thousand' || word === 'thousands') && found) {
      total += Math.max(1, current) * 1000;
      current = 0;
    } else if (word === 'lakh' || word === 'lakhs') {
      if (found) total += Math.max(1, current) * 100000;
      current = 0;
      found = false;
    } else if (word === 'and' && found) {
      continue;
    } else {
      // Ignore ordinary words before the number, but stop after a number
      // phrase so unrelated words aren't accidentally combined.
      if (found) break;
    }
  }

  const result = total + current;
  return found && result > 0 ? result : null;
}

/**
 * Parse numeric amounts, Indian-script digits, and common English number words.
 */
function extractAmount(text) {
  const normalizedDigits = text
    .replace(/[०-९]/g, digit => String('०१२३४५६७८९'.indexOf(digit)))
    .replace(/[૦-૯]/g, digit => String('૦૧૨૩૪૫૬૭૮૯'.indexOf(digit)));

  const patterns = [
    /(?:₹|rs\.?|inr|rupees?)\s*([\d,]+(?:\.\d+)?)\s*(k|thousand)?/i,
    /([\d,]+(?:\.\d+)?)\s*(?:₹|rs\.?|inr|rupees?)\b/i,
    /\b([\d,]+(?:\.\d+)?)\s*k\b/i,
    /\b([\d,]+(?:\.\d+)?)\s*(?:thousand|lakh|lakhs)\b/i
  ];

  for (const pattern of patterns) {
    const match = normalizedDigits.match(pattern);
    if (!match) continue;

    let amount = Number(match[1].replace(/,/g, ''));
    const suffix = (match[2] || '').toLowerCase();

    if (suffix === 'k' || suffix === 'thousand') amount *= 1000;
    if (/lakh|lakhs/i.test(match[0])) amount *= 100000;

    if (Number.isFinite(amount) && amount > 0) return amount;
  }

  // If the translation uses digits without a currency symbol, prefer a number
  // near a currency word or a transaction preposition.
  const numberMatch = normalizedDigits.match(
    /\b(\d[\d,]*(?:\.\d+)?)\b(?=\s*(?:rupees?|rs\.?|inr|₹|for|on|profit|income|earned|spent|खर्च|नफा|मुनाफा|लाभ))/i
  );

  if (numberMatch) {
    const amount = Number(numberMatch[1].replace(/,/g, ''));
    if (Number.isFinite(amount) && amount > 0) return amount;
  }

  // Handle translated speech such as "five hundred rupees".
  const wordAmountMatch = normalizedDigits.match(
    /\b((?:(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakhs?|and)[\s-]+)*(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety))\s+(?:indian\s+)?rupees?\b/i
  );

  if (wordAmountMatch) {
    const amount = parseNumberWords(wordAmountMatch[1]);
    if (amount) return amount;
  }

  // Final numeric fallback.
  const fallback = normalizedDigits.match(/\b(\d[\d,]*(?:\.\d+)?)\b/);
  if (fallback) {
    const amount = Number(fallback[1].replace(/,/g, ''));
    if (Number.isFinite(amount) && amount > 0) return amount;
  }

  return null;
}

/**
 * Determine income/expense from English, Hindi and Marathi keywords.
 * Income and expense are detected independently; explicit spending words
 * take priority when the sentence describes an actual expense.
 */
function classifyTransaction(text) {
  const normalized = text.toLowerCase();

  const incomePatterns = [
    /\b(income|profit|profits|profited|profit earned|made a profit|net profit)\b/i,
    /\b(earned|earnings|earn|salary|wages|bonus|commission|revenue)\b/i,
    /\b(received|receive|got paid|payment received|credited|deposited)\b/i,
    /\b(sold|sale proceeds|customer paid|client paid|interest received|cashback|refund received)\b/i,
    /मुनाफा|नफा|लाभ|कमाई|कमाया|कमाए|कमाई हुई|आमदनी|वेतन|पगार|मिळाले|मिळाली|मिळालेले|उत्पन्न|नफ्यात/i,
    /नफा झाला|नफा मिळाला|पैसे मिळाले|पगार मिळाला|उत्पन्न झाले/i
  ];

  const expensePatterns = [
    /\b(expense|expenses|spent|spend|paid for|bought|purchased|purchase)\b/i,
    /\b(cost|bill|fee|rent paid|withdrawal|withdrew|deducted|charged)\b/i,
    /\b(donated|wasted|lost money|lent money|sent money|transfer to)\b/i,
    /खर्च|खर्च केला|खर्च झाले|खर्च झाला|भरले|भरला|दिले|दिला|खरेदी|विकत घेतले|पैसे गेले|देयक|बिल भरले/i,
    /खर्च केला आहे|खर्च झाले आहेत|पैसे खर्च/i
  ];

  const hasIncome = incomePatterns.some(pattern => pattern.test(normalized));
  const hasExpense = expensePatterns.some(pattern => pattern.test(normalized));

  // If the user explicitly describes spending, classify it as an expense.
  // Otherwise, explicit profit/earning/receipt language means income.
  if (hasExpense) return 'expense';
  if (hasIncome) return 'income';

  return null;
}

/**
 * Parse financial intent from translated text and the original transcript.
 * Returns null when the amount or transaction type cannot be determined.
 */
export function parseFinancialIntent(text, originalText = '') {
  if (!text && !originalText) return null;

  const englishText = String(text || '').trim();
  const original = String(originalText || '').trim();
  const combined = `${englishText} ${original}`.trim();

  if (combined.length < 2) return null;

  const amount = extractAmount(combined);
  if (!amount) return null;

  const type = classifyTransaction(combined);

  // Do not silently turn an unknown transaction into an expense.
  if (!type) {
    console.warn('[Voice] Could not determine transaction type:', combined);
    return null;
  }

  // Category detection uses both the translation and original speech.
  const normalized = combined.toLowerCase();

  const categoryMap = {
    'Food & Beverage': [
      'food', 'restaurant', 'meal', 'lunch', 'dinner', 'breakfast',
      'coffee', 'tea', 'snack', 'juice', 'खाना', 'नाश्ता', 'जेवण'
    ],
    Grocery: [
      'grocery', 'groceries', 'vegetables', 'sabji', 'sabzi', 'milk',
      'bread', 'rice', 'dal', 'ration', 'supermarket', 'भाजी', 'दूध'
    ],
    Transport: [
      'transport', 'travel', 'uber', 'ola', 'auto', 'bus', 'train',
      'petrol', 'diesel', 'fuel', 'cab', 'taxi', 'metro', 'flight'
    ],
    Utilities: [
      'electricity', 'electric', 'water bill', 'gas bill', 'internet',
      'mobile recharge', 'recharge', 'phone bill', 'wifi', 'broadband'
    ],
    Shopping: [
      'shopping', 'clothes', 'clothing', 'shoes', 'dress', 'shirt',
      'amazon', 'flipkart', 'purchase', 'खरेदी'
    ],
    Healthcare: [
      'medicine', 'doctor', 'hospital', 'medical', 'pharmacy',
      'health', 'clinic', 'औषध', 'डॉक्टर'
    ],
    Entertainment: [
      'movie', 'entertainment', 'netflix', 'spotify', 'gaming',
      'game', 'outing', 'party'
    ],
    Salary: [
      'salary', 'paycheck', 'wages', 'stipend', 'पगार', 'वेतन'
    ],
    Freelancing: [
      'freelance', 'freelancing', 'consulting', 'gig', 'client project'
    ],
    Sales: [
      'sold', 'sale', 'selling', 'sales', 'विक्री', 'माल विकला'
    ],
    Business: [
      'business', 'office', 'stationery', 'supplies', 'inventory'
    ],
    Rent: [
      'rent', 'accommodation', 'pg', 'hostel', 'भाडे'
    ],
    Education: [
      'education', 'course', 'book', 'tuition', 'school', 'college', 'fees'
    ],
    Investment: [
      'investment', 'stock', 'mutual fund', 'sip', 'fd', 'insurance'
    ]
  };

  let category = 'General';

  for (const [name, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      category = name;
      break;
    }
  }

  // Recognize income types that may not have a more specific category.
  if (type === 'income' && category === 'General') {
    if (/मुनाफा|नफा|लाभ|\bprofit\b|\bgain\b/i.test(normalized)) {
      category = 'Business';
    } else if (/earned|salary|wages|पगार|वेतन/i.test(normalized)) {
      category = 'Salary';
    } else if (/freelanc|consulting|gig/i.test(normalized)) {
      category = 'Freelancing';
    } else if (/sold|sale|selling|विक्री/i.test(normalized)) {
      category = 'Sales';
    }
  }

  // Keep the original spoken phrase as the description when available.
  // This avoids replacing a Hindi/Marathi description with a generic translation.
  let item = original || englishText;

  // Remove leading/trailing whitespace and keep the description readable.
  item = item.replace(/\s+/g, ' ').trim();

  // Avoid returning a description consisting only of the amount.
  if (!item || /^[₹\d,\s.]+$/.test(item)) {
    item = type === 'income' ? 'Income' : 'Expense';
  }

  // Payment method detection.
  let paymentMethod = null;

  if (/\b(upi|gpay|google pay|phonepe|paytm)\b/i.test(normalized)) {
    paymentMethod = 'UPI';
  } else if (/\b(cash|nakit)\b|रोख|नकद/i.test(normalized)) {
    paymentMethod = 'Cash';
  } else if (/\b(card|debit|credit|swipe)\b/i.test(normalized)) {
    paymentMethod = 'Card';
  } else if (/\b(net banking|neft|rtgs|imps|bank transfer)\b/i.test(normalized)) {
    paymentMethod = 'Net Banking';
  } else if (/\b(cheque|check)\b/i.test(normalized)) {
    paymentMethod = 'Cheque';
  }

  // Date handling.
  const today = new Date();
  let transactionDate = new Date(today);

  if (/\byesterday\b|कल|काल/i.test(normalized)) {
    transactionDate.setDate(transactionDate.getDate() - 1);
  } else if (/\b(last week|past week)\b/i.test(normalized)) {
    transactionDate.setDate(transactionDate.getDate() - 7);
  }

  // Format using local calendar date, not UTC.
  const date = [
    transactionDate.getFullYear(),
    String(transactionDate.getMonth() + 1).padStart(2, '0'),
    String(transactionDate.getDate()).padStart(2, '0')
  ].join('-');

  return {
    type,
    amount,
    item,
    category,
    date,
    paymentMethod
  };
}
