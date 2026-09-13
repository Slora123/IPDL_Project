import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type PersonaType = "student" | "business" | "common";

interface PreferencesState {
  language: string | null;
  persona: PersonaType | null;
  name: string | null;
  businessName: string | null;
  phone: string | null;
}

interface PreferencesContextValue extends PreferencesState {
  setLanguage: (language: string) => void;
  setPersona: (persona: PersonaType) => void;
  setName: (name: string) => void;
  setBusinessName: (businessName: string) => void;
  setPhone: (phone: string) => void;
  resetPreferences: () => void;
}

const PREFERENCES_STORAGE_KEY = "app.preferences.v1";

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

const getInitialPreferences = (): PreferencesState => {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PreferencesState;
      return {
        language: parsed.language || null,
        persona: parsed.persona || "business",
        name: parsed.name || null,
        businessName: parsed.businessName || null,
        phone: parsed.phone || null,
      };
    }
  } catch {
    // ignore
  }
  return { language: null, persona: "business", name: null, businessName: null, phone: null };
};

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string | null>(() => getInitialPreferences().language);
  const [persona, setPersonaState] = useState<PersonaType | null>(() => getInitialPreferences().persona);
  const [name, setNameState] = useState<string | null>(() => getInitialPreferences().name);
  const [businessName, setBusinessNameState] = useState<string | null>(() => getInitialPreferences().businessName);
  const [phone, setPhoneState] = useState<string | null>(() => getInitialPreferences().phone);

  useEffect(() => {
    try {
      const state: PreferencesState = { language, persona, name, businessName, phone };
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [language, persona, name, businessName, phone]);

  const setLanguage = useCallback((lng: string) => {
    setLanguageState(lng);
  }, []);

  const setPersona = useCallback((p: PersonaType) => {
    setPersonaState(p);
  }, []);

  const setName = useCallback((n: string) => {
    setNameState(n);
  }, []);

  const setBusinessName = useCallback((b: string) => {
    setBusinessNameState(b);
  }, []);

  const setPhone = useCallback((ph: string) => {
    setPhoneState(ph);
  }, []);

  const resetPreferences = useCallback(() => {
    setLanguageState(null);
    setPersonaState(null);
    setNameState(null);
    setBusinessNameState(null);
    setPhoneState(null);
  }, []);

  const value = useMemo<PreferencesContextValue>(() => ({
    language,
    persona,
    name,
    businessName,
    phone,
    setLanguage,
    setPersona,
    setName,
    setBusinessName,
    setPhone,
    resetPreferences,
  }), [language, persona, name, businessName, phone, setLanguage, setPersona, setName, setBusinessName, setPhone, resetPreferences]);

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


