import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type PersonaType = "student" | "business" | "common";

interface PreferencesState {
  language: string | null;
  persona: PersonaType | null;
}

interface PreferencesContextValue extends PreferencesState {
  setLanguage: (language: string) => void;
  setPersona: (persona: PersonaType) => void;
  resetPreferences: () => void;
}

const PREFERENCES_STORAGE_KEY = "app.preferences.v1";

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string | null>(null);
  const [persona, setPersonaState] = useState<PersonaType | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PreferencesState;
        setLanguageState(parsed.language ?? null);
        setPersonaState(parsed.persona ?? null);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const state: PreferencesState = { language, persona };
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [language, persona]);

  const setLanguage = useCallback((lng: string) => {
    setLanguageState(lng);
  }, []);

  const setPersona = useCallback((p: PersonaType) => {
    setPersonaState(p);
  }, []);

  const resetPreferences = useCallback(() => {
    setLanguageState(null);
    setPersonaState(null);
  }, []);

  const value = useMemo<PreferencesContextValue>(() => ({
    language,
    persona,
    setLanguage,
    setPersona,
    resetPreferences,
  }), [language, persona, setLanguage, setPersona, resetPreferences]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesContextValue => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
};

export type { PersonaType };


