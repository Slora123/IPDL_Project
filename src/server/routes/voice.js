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
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No audio file provided."
      });
    }

    const mimeType = req.file.mimetype || "audio/webm";

    console.log(
      `[Voice] Processing audio: ${req.file.size} bytes, type: ${mimeType}`
    );

    let transcribeResult;

    try {
      transcribeResult = await transcribeAndTranslate(
        req.file.buffer,
        mimeType,
        req.body.target_lang || req.body.language || "en-IN"
      );
    } catch (error) {
      console.error("[Voice] Sarvam error:", error.message);

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

    // Gemini parsing is asynchronous, so await the result.
    const intent = await parseFinancialIntent(
      englishTranslation,
      transcript
    );

    if (!intent) {
      return res.json({
        success: false,
        transcript,
        englishTranslation,
        sourceLanguage,
        message:
          "Could not confidently identify a financial transaction. Please try describing the income or expense again."
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
    console.error("[Voice] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to process audio."
    });
  }
});

export default router;
