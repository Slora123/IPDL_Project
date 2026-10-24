// src/hooks/useTranslatedUI.ts
// Hook that translates a map of UI strings using the Sarvam API
// when the selected language is not English.
// Translations are cached in memory across re-renders.

import { useState, useEffect, useRef } from 'react';
import { translateText } from '@/lib/sarvamTranslate';
import { usePreferences } from '@/contexts/PreferencesContext';

type TranslationMap = Record<string, string>;

const globalCache = new Map<string, string>();

/**
 * Given a map of { key: englishText }, returns a map of { key: translatedText }
 * in the currently selected language. Falls back to English instantly on error.
 */
export function useTranslatedUI(englishTexts: TranslationMap): TranslationMap {
  const { language } = usePreferences();
  const lang = language ?? 'en';

  // Build initial state: use cache if available, else use English
  const getInitialState = (): TranslationMap => {
    if (lang === 'en') return englishTexts;
    const result: TranslationMap = {};
    for (const [key, text] of Object.entries(englishTexts)) {
      const cacheKey = `${lang}:${text}`;
      result[key] = globalCache.get(cacheKey) ?? text;
    }
    return result;
  };

  const [translated, setTranslated] = useState<TranslationMap>(getInitialState);
  const prevLangRef = useRef(lang);

  useEffect(() => {
    if (lang === 'en') {
      setTranslated(englishTexts);
      prevLangRef.current = lang;
      return;
    }

    // Check if everything is already cached
    const allCached = Object.values(englishTexts).every(text =>
      globalCache.has(`${lang}:${text}`)
    );

    if (allCached) {
      const result: TranslationMap = {};
      for (const [key, text] of Object.entries(englishTexts)) {
        result[key] = globalCache.get(`${lang}:${text}`) ?? text;
      }
      setTranslated(result);
      return;
    }

    // Translate missing entries
    const entries = Object.entries(englishTexts);
    let cancelled = false;

    (async () => {
      const results: TranslationMap = { ...getInitialState() };
      await Promise.all(
        entries.map(async ([key, text]) => {
          const cacheKey = `${lang}:${text}`;
          if (globalCache.has(cacheKey)) {
            results[key] = globalCache.get(cacheKey)!;
            return;
          }
          try {
            const out = await translateText(text, lang, 'en');
            globalCache.set(cacheKey, out);
            results[key] = out;
          } catch {
            results[key] = text; // fallback
          }
        })
      );
      if (!cancelled) setTranslated({ ...results });
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return translated;
}
