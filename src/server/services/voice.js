import { GoogleGenerativeAI } from "@google/generative-ai";

const SARVAM_API_URL = "https://api.sarvam.ai";
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

function requireApiKey(key, name) {
  if (!key) {
    throw new Error(`${name} is missing from the server environment.`);
  }
}

function sanitizeMime(raw) {
  if (!raw) return "audio/webm";
  const base = String(raw).split(";")[0].trim().toLowerCase();
  if (base === "audio/wave" || base === "audio/x-wav") return "audio/wav";
  if (base === "audio/x-m4a") return "audio/mp4";
  return base;
}

function getAudioExtension(mime) {
  switch (mime) {
    case "audio/wav": return "wav";
    case "audio/mp3":
    case "audio/mpeg": return "mp3";
    case "audio/ogg": return "ogg";
    case "audio/mp4":
    case "audio/m4a": return "mp4";
    case "audio/aac": return "aac";
    case "audio/flac": return "flac";
    case "audio/webm":
    default: return "webm";
  }
}

async function callSarvam(audioBuffer, mimeType, mode) {
  const cleanMime = sanitizeMime(mimeType);
  const ext = getAudioExtension(cleanMime);

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([audioBuffer], { type: cleanMime }),
    `audio.${ext}`
  );
  formData.append("model", "saaras:v3");
  formData.append("mode", mode);

  const response = await fetch(`${SARVAM_API_URL}/speech-to-text`, {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY
    },
    body: formData
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result?.message ||
      result?.error ||
      `Sarvam ${mode} request failed (${response.status}).`
    );
  }

  return result;
}

export async function transcribeAndTranslate(
  audioBuffer,
  mimeType = "audio/webm",
  targetLang = "en-IN"
) {
  requireApiKey(SARVAM_API_KEY, "SARVAM_API_KEY");

  if (!audioBuffer || !audioBuffer.length) {
    throw new Error("No valid audio data was provided.");
  }

  // Run transcribe and translate concurrently to halve speech processing latency
  const [originalResult, translatedResult] = await Promise.all([
    callSarvam(audioBuffer, mimeType, "transcribe"),
    callSarvam(audioBuffer, mimeType, "translate").catch(err => {
      console.warn("[Voice] Sarvam translation fallback:", err.message);
      return {};
    })
  ]);

  const transcript = String(originalResult?.transcript || "").trim();
  const englishTranslation = String(
    translatedResult?.transcript || transcript
  ).trim();

  if (!transcript) {
    throw new Error("No speech could be recognized in the audio.");
  }

  return {
    transcript,
    englishTranslation: englishTranslation || transcript,
    sourceLanguage: originalResult?.language_code || "unknown"
  };
}

export async function parseFinancialIntent(
  text,
  originalText = ""
) {
  requireApiKey(GEMINI_API_KEY, "GEMINI_API_KEY");

  if (
    !String(text || "").trim() &&
    !String(originalText || "").trim()
  ) {
    return null;
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          type: {
            type: "STRING",
            enum: ["income", "expense", "unknown"]
          },
          amount: { type: "NUMBER" },
          description: { type: "STRING" },
          category: { type: "STRING" },
          paymentMethod: { type: "STRING" },
          date: { type: "STRING" },
          confidence: { type: "NUMBER" }
        },
        required: [
          "type",
          "amount",
          "description",
          "category",
          "paymentMethod",
          "date",
          "confidence"
        ]
      }
    }
  });

  const prompt = `
You extract financial transactions from speech for Trackify, an Indian business & personal expense tracker.

Original speech:
${String(originalText || "").slice(0, 3000)}

English translation:
${String(text || "").slice(0, 3000)}

Understand the complete natural meaning across English, Hindi, Marathi, and mixed languages.
Never confuse money spent (expense) with money earned / received (income).

Classification Rules:
- INCOME / PROFIT: money received, earned, customer payments, sales, daily collection, salary, business profits.
  * Hindi: "मुनाफा", "नफा", "फायदा", "कमाई", "मिले", "बिक्री", "प्राप्त हुए", "कस्टमर ने दिए", "कैश आया"
  * Marathi: "नफा", "फायदा", "मिळाले", "विक्री झाली", "कमावले", "जमा झाले", "गल्ल्यात आले"
  * English: "profit", "earned", "received", "sales", "salary", "revenue", "income", "got paid"
  * Example: "आज ₹500 का मुनाफा हुआ" or "500 रुपये नफा झाला" is INCOME of 500, NOT an expense.

- EXPENSE: money spent, paid out, purchases, vendor payments, bills, shop stock bought.
  * Hindi: "खर्च", "दिए", "दी", "दुकान का सामान खरीदा", "पेमेंट किया", "दुकानदार को दिए"
  * Marathi: "खर्च झाले", "खर्च केले", "दिले", "खरेदी केली", "भरले"
  * English: "spent", "paid", "bought", "gave", "purchased", "expense", "bill payment"
  * Example: "सब्जी के लिए 1500 दिए" is EXPENSE of 1500.

- Amount: must be a strictly positive number without currency symbols.
- If no positive amount is mentioned or clear, return amount: 0, type: "unknown", and confidence: 0.0.
- Description: short, clear English description of the item or reason (e.g. "Groceries", "Shop Sales", "Petrol", "Coffee", "Customer Payment").
- Category: choose a suitable standard business/personal category:
  Food, Groceries, Transport, Shopping, Salary, Sales, Inventory, Business, Bills, Utilities, Entertainment, Health, or General.
- PaymentMethod: Cash, UPI, Card, Bank Transfer, or Unknown.
- Date: YYYY-MM-DD if explicitly stated, otherwise "".
- If speech is casual conversation, unclear, or not a financial transaction, return type: "unknown", amount: 0, and confidence: 0.0.
- Never invent missing details or assume numbers not in the speech.
`;

  let lastError;
  let parsed;

  // Retry up to 2 times for transient 503/429 spikes
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      parsed = JSON.parse(result.response.text());
      break;
    } catch (err) {
      lastError = err;
      const status = err?.status || err?.statusCode;
      const msg = String(err?.message || "");
      const isTransient =
        status === 503 ||
        status === 429 ||
        msg.includes("503") ||
        msg.includes("429") ||
        msg.includes("high demand");

      if (isTransient && attempt < 2) {
        console.warn(
          `[Voice] Gemini transient error (${status || "busy"}), retrying in ${
            1000 * (attempt + 1)
          }ms... (attempt ${attempt + 1}/2)`
        );
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }

  const allowedTypes = ["income", "expense", "unknown"];
  const type = allowedTypes.includes(parsed?.type)
    ? parsed.type
    : "unknown";

  const amount = Number(parsed?.amount);
  const confidence = Number(parsed?.confidence);

  // If unclear, casual, zero amount, or low confidence, return null
  if (
    type === "unknown" ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isFinite(confidence) ||
    confidence < 0.5
  ) {
    return null;
  }

  const description = String(parsed?.description || "").trim();
  if (!description) {
    return null;
  }

  const date = String(parsed?.date || "");

  return {
    type,
    amount,
    item: description,
    description,
    category: String(parsed?.category || "General").trim() || "General",
    paymentMethod: String(parsed?.paymentMethod || "Unknown").trim(),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
    confidence: Math.max(0, Math.min(1, confidence))
  };
}
