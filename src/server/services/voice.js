import { GoogleGenerativeAI } from "@google/generative-ai";

const SARVAM_API_URL = "https://api.sarvam.ai";
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function requireApiKey(key, name) {
  if (!key) {
    throw new Error(`${name} is missing from the server environment.`);
  }
}

async function callSarvam(audioBuffer, mimeType, mode) {
  const formData = new FormData();

  formData.append(
    "file",
    new Blob([audioBuffer], { type: mimeType }),
    "audio.webm"
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

  // Get the speech in its original language.
  const originalResult = await callSarvam(
    audioBuffer,
    mimeType,
    "transcribe"
  );

  // Get an English translation of the same speech.
  const translatedResult = await callSarvam(
    audioBuffer,
    mimeType,
    "translate"
  );

  const transcript = String(originalResult.transcript || "").trim();
  const englishTranslation = String(
    translatedResult.transcript || ""
  ).trim();

  if (!transcript) {
    throw new Error("No speech could be recognized in the audio.");
  }

  return {
    transcript,
    englishTranslation: englishTranslation || transcript,
    sourceLanguage: originalResult.language_code || "unknown"
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
    model: "gemini-2.5-flash",
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
You extract financial transactions from speech for a finance app.

Original speech:
${String(originalText || "").slice(0, 3000)}

English translation:
${String(text || "").slice(0, 3000)}

Understand the complete meaning, including Hindi, Marathi and
mixed-language speech. Do not rely on fixed keywords alone.

Rules:
- income: money earned, received, profit, salary or earnings.
- expense: money spent, paid out or used for a purchase.
- "आज ₹500 का मुनाफा हुआ" means income of 500, not an expense.
- "आज ₹500 खर्च किए" means an expense of 500.
- Do not guess the transaction type from the amount alone.
- Return amount as a positive number without currency symbols.
- If no amount is clear, return 0.
- Use a short, meaningful English description.
- Use a suitable category, such as Food, Transport, Shopping,
  Salary, Business, Bills, Entertainment, Health or General.
- paymentMethod must be Cash, UPI, Card, Bank Transfer or Unknown.
- Only provide a date in YYYY-MM-DD format if the speech states
  a date that can be determined reliably. Otherwise use "".
- If the speech is not clearly a financial transaction, return
  type "unknown" and confidence below 0.5.
- confidence must be between 0 and 1.
- Do not invent missing information.
`;

  const result = await model.generateContent(prompt);
  let parsed;

  try {
    parsed = JSON.parse(result.response.text());
  } catch {
    throw new Error("Gemini returned an invalid transaction response.");
  }

  const allowedTypes = ["income", "expense", "unknown"];
  const type = allowedTypes.includes(parsed.type)
    ? parsed.type
    : "unknown";

  const amount = Number(parsed.amount);
  const confidence = Number(parsed.confidence);

  // Don't show a transaction preview when the result is unclear.
  if (
    type === "unknown" ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isFinite(confidence) ||
    confidence < 0.5
  ) {
    return null;
  }

  const description = String(parsed.description || "").trim();

  if (!description) {
    return null;
  }

  const date = String(parsed.date || "");

  return {
    type,
    amount,
    item: description,
    description,
    category: String(parsed.category || "General").trim() || "General",
    paymentMethod: String(parsed.paymentMethod || "Unknown").trim(),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
    confidence: Math.max(0, Math.min(1, confidence))
  };
}
