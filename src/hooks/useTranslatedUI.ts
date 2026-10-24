// src/hooks/useTranslatedUI.ts
// Synchronous, instant translation map backed by Trackify's I18nContext.
// Completely eliminates network lag, audio API dependencies, and flickers.

import { useMemo } from 'react';
import { useI18n } from '@/contexts/I18nContext';

type TranslationMap = Record<string, string>;

/**
 * Given a map of { key: englishText }, returns an instant map of { key: translatedText }
 * in the currently selected language (English, Hindi, Marathi).
 */
export function useTranslatedUI(englishTexts: TranslationMap): TranslationMap {
  const { t, language } = useI18n();

  return useMemo(() => {
    const result: TranslationMap = {};
    for (const [key, fallbackText] of Object.entries(englishTexts)) {
      result[key] = t(key, undefined, fallbackText);
    }
    return result;
  }, [englishTexts, t, language]);
}
