// server/src/routes/voice.js
// POST /api/voice/process — receives audio, transcribes/translates via SarvamAI,
// parses financial intent, and returns a transaction preview (does NOT save yet).
// The frontend shows the preview and lets the user confirm before POSTing to /api/transactions.

import { Router } from 'express';
import multer from 'multer';
import { transcribeAndTranslate, parseFinancialIntent } from '../services/voice.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.post('/process', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file provided.' });

    const mimeType = req.file.mimetype || 'audio/webm';
    const targetLang = req.body.target_lang || req.body.language || 'en-IN';

    console.log(`[Voice] Processing audio: ${req.file.size} bytes, type: ${mimeType}`);

    // Step 1+2: Transcribe + translate via SarvamAI
    let transcribeResult;
    try {
      transcribeResult = await transcribeAndTranslate(req.file.buffer, mimeType, targetLang);
    } catch (sarvamErr) {
      console.error('[Voice] SarvamAI error:', sarvamErr.message);
      return res.status(502).json({
        success: false,
        error: `Speech processing failed: ${sarvamErr.message}`,
        transcript: null
      });
    }

    const { transcript, englishTranslation, sourceLanguage } = transcribeResult;
    // console.log(`[Voice] Transcript: "${transcript}" | English: "${englishTranslation}"`);

    // Step 3: Parse financial intent from English text
    const intent = parseFinancialIntent(englishTranslation, transcript);

    if (!intent) {
      return res.json({
        success: false,
        transcript,
        englishTranslation,
        sourceLanguage,
        message: 'Could not detect a financial transaction in the speech. Try saying: "I spent 250 rupees on groceries."'
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
        source: 'voice',
        voiceInput: transcript,
        language: sourceLanguage === 'hi-IN' ? 'hindi' : sourceLanguage === 'mr-IN' ? 'marathi' : 'english'
      }
    });
  } catch (e) {
    console.error('[Voice] Unexpected error:', e);
    res.status(500).json({ success: false, error: 'Failed to process audio.' });
  }
});

export default router;
