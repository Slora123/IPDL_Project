import { Router } from "express";
import multer from "multer";
import {
  transcribeAndTranslate,
  parseFinancialIntent
} from "../services/voice.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

router.post("/process", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer || req.file.size === 0) {
      return res.status(400).json({
        success: false,
        error: "No audio file provided or recorded audio was empty."
      });
    }

    const mimeType = req.file.mimetype || "audio/webm";

    console.log(
      `[Voice] Processing audio: ${req.file.size} bytes, mime: ${mimeType}`
    );

    let transcribeResult;

    try {
      transcribeResult = await transcribeAndTranslate(
        req.file.buffer,
        mimeType,
        req.body.target_lang || req.body.language || "en-IN"
      );
    } catch (error) {
      console.error("[Voice] Sarvam speech processing error:", error.message);

      return res.status(502).json({
        success: false,
        error: `Speech processing failed: ${error.message}`,
        transcript: null
      });
    }

    const {
      transcript,
      englishTranslation,
      sourceLanguage
    } = transcribeResult;

    let intent;
    try {
      intent = await parseFinancialIntent(
        englishTranslation,
        transcript
      );
    } catch (error) {
      console.error("[Voice] Gemini transaction parsing error:", error.message);
      const isUnavailable =
        error?.status === 503 ||
        error?.statusCode === 503 ||
        String(error?.message || "").includes("503");

      const message = isUnavailable
        ? "AI transaction service is temporarily busy. Please try again in a few moments."
        : `Transaction understanding failed: ${error.message}`;

      return res.status(502).json({
        success: false,
        error: message,
        transcript,
        englishTranslation,
        sourceLanguage
      });
    }

    if (!intent) {
      return res.json({
        success: false,
        transcript,
        englishTranslation,
        sourceLanguage,
        message:
          "Could not detect a clear transaction amount. Please try stating the amount and item clearly (e.g., 'Spent 250 on groceries' or '₹500 मुनाफा हुआ')."
      });
    }

    return res.json({
      success: true,
      transcript,
      englishTranslation,
      sourceLanguage,
      transaction: {
        type: intent.type,
        amount: intent.amount,
        item: intent.item,
        category: intent.category,
        date: intent.date,
        paymentMethod: intent.paymentMethod,
        source: "voice",
        voiceInput: transcript,
        language:
          sourceLanguage === "hi-IN"
            ? "hindi"
            : sourceLanguage === "mr-IN"
              ? "marathi"
              : "english"
      }
    });
  } catch (error) {
    console.error("[Voice] Unexpected route error:", error.message);

    return res.status(500).json({
      success: false,
      error: "Failed to process audio request. Please try again."
    });
  }
});

export default router;
