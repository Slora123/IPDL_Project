// src/lib/sarvamTranslate.ts
// Utility for translating text using the Sarvam AI translation API.
// Uses the backend proxy endpoint to keep the API key server-side.

import api from './api';

// Sarvam language code mapping
export const LANG_CODE_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
};

// Cache translations to avoid redundant API calls
const translationCache = new Map<string, string>();

/**
 * Translate a single string using Sarvam AI translate API.
 * Falls back to original text on error.
 */
export async function translateText(
  text: string,
  targetLang: string, // 'en' | 'hi' | 'mr'
  sourceLang = 'en'
): Promise<string> {
  if (!text || targetLang === sourceLang || targetLang === 'en') return text;

  const cacheKey = `${sourceLang}:${targetLang}:${text}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey)!;

  try {
    const { data } = await api.post<{ translatedText: string }>('/api/translate', {
      text,
      sourceLang: LANG_CODE_MAP[sourceLang] ?? 'en-IN',
      targetLang: LANG_CODE_MAP[targetLang] ?? 'hi-IN',
    });
    const result = data.translatedText || text;
    translationCache.set(cacheKey, result);
    return result;
  } catch {
    return text;
  }
}

/**
 * Translate a batch of strings.
 * Returns an array of translated strings in the same order.
 */
export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang = 'en'
): Promise<string[]> {
  if (targetLang === sourceLang || targetLang === 'en') return texts;
  return Promise.all(texts.map(t => translateText(t, targetLang, sourceLang)));
}
