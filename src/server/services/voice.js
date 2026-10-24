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
    body: formData,
    signal: AbortSignal.timeout(12000)
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

  let transcriptionMs = 0;
  let translationMs = 0;

  // Run transcribe and translate in parallel for non-blocking execution
  const [originalResult, translatedResult] = await Promise.all([
    (async () => {
      const start = performance.now();
      const res = await callSarvam(audioBuffer, mimeType, "transcribe");
      transcriptionMs = Math.round(performance.now() - start);
      return res;
    })(),
    (async () => {
      const start = performance.now();
      const res = await callSarvam(audioBuffer, mimeType, "translate").catch(err => {
        console.warn("[Voice] Sarvam translation fallback:", err.message);
        return {};
      });
      translationMs = Math.round(performance.now() - start);
      return res;
    })()
  ]);

  const transcript = String(originalResult?.transcript || "").trim();
  const rawTranslation = String(translatedResult?.transcript || "").trim();
  const sourceLanguage = originalResult?.language_code || "unknown";

  // If source is already English or translation is empty, use transcript directly
  const englishTranslation =
    sourceLanguage === "en-IN" || !rawTranslation
      ? transcript
      : rawTranslation;

  if (!transcript) {
    throw new Error("No speech could be recognized in the audio.");
  }

  return {
    transcript,
    englishTranslation,
    sourceLanguage,
    timing: {
      transcriptionMs,
      translationMs
    }
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

  const getGenerationConfig = (modelName) => {
    const config = {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 256,
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
    };
    if (modelName && modelName.includes("3.8")) {
      config.thinkingConfig = { thinkingBudget: 0 };
    }
    return config;
  };

  const isBilingual =
    originalText &&
    text &&
    String(originalText).trim().toLowerCase() !== String(text).trim().toLowerCase();

  const speechContext = isBilingual
    ? `Original speech: ${String(originalText).slice(0, 500)}\nEnglish translation: ${String(text).slice(0, 500)}`
    : `Speech: ${String(text || originalText).slice(0, 500)}`;

  const prompt = `
You extract financial transactions from speech for Trackify, an Indian business & personal expense tracker.

${speechContext}

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

  const candidateModels = [
    GEMINI_MODEL,
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash"
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  let lastError;
  let parsed;
  let usedModel = null;

  for (const candidate of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: candidate,
        generationConfig: getGenerationConfig(candidate)
      });

      for (let attempt = 0; attempt <= 1; attempt++) {
        try {
          const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Gemini transaction analysis timed out")), 15000)
            )
          ]);
          const textResponse = result.response.text();
          const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(textResponse);
          usedModel = candidate;
          break;
        } catch (attemptErr) {
          lastError = attemptErr;
          const status = attemptErr?.status || attemptErr?.statusCode;
          const msg = String(attemptErr?.message || "").toLowerCase();
          const isTransient =
            status === 503 ||
            msg.includes("503") ||
            msg.includes("high demand");

          if (isTransient && attempt === 0) {
            console.warn(`[Voice] Model ${candidate} transient spike, quick retry in 400ms...`);
            await new Promise(r => setTimeout(r, 400));
            continue;
          }
          throw attemptErr;
        }
      }

      if (parsed) {
        if (candidate !== GEMINI_MODEL) {
          console.log(`[Voice] Successfully parsed transaction using fallback model: ${candidate}`);
        }
        break;
      }
    } catch (modelErr) {
      lastError = modelErr;
      const status = modelErr?.status || modelErr?.statusCode;
      const msg = String(modelErr?.message || "").toLowerCase();
      console.warn(`[Voice] Model ${candidate} failed (${status || msg.slice(0, 100)}), trying fallback...`);
    }
  }

  if (!parsed) {
    if (lastError) {
      const status = lastError?.status || lastError?.statusCode;
      const msg = String(lastError?.message || "").toLowerCase();
      if (status === 429 || msg.includes("429") || msg.includes("quota")) {
        const quotaErr = new Error("Gemini AI daily quota limit reached on Free Tier. Please check your Gemini API plan.");
        quotaErr.status = 429;
        throw quotaErr;
      }
      throw lastError;
    }
    return null;
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
