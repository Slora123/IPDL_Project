import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type PersonaType = "student" | "business" | "common";

interface PreferencesState {
  language: string | null;
  persona: PersonaType | null;
  name: string | null;
  businessName: string | null;
  phone: string | null;
  location: string | null;
  shopCategory: string | null;
}

interface PreferencesContextValue extends PreferencesState {
  setLanguage: (language: string) => void;
  setPersona: (persona: PersonaType) => void;
  setName: (name: string) => void;
  setBusinessName: (businessName: string) => void;
  setPhone: (phone: string) => void;
  setLocation: (location: string) => void;
  setShopCategory: (shopCategory: string) => void;
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
        location: parsed.location || null,
        shopCategory: parsed.shopCategory || null,
      };
    }
  } catch {
    // ignore
  }
  return { language: null, persona: "business", name: null, businessName: null, phone: null, location: null, shopCategory: null };
};

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string | null>(() => getInitialPreferences().language);
  const [persona, setPersonaState] = useState<PersonaType | null>(() => getInitialPreferences().persona);
  const [name, setNameState] = useState<string | null>(() => getInitialPreferences().name);
  const [businessName, setBusinessNameState] = useState<string | null>(() => getInitialPreferences().businessName);
  const [phone, setPhoneState] = useState<string | null>(() => getInitialPreferences().phone);
  const [location, setLocationState] = useState<string | null>(() => getInitialPreferences().location);
  const [shopCategory, setShopCategoryState] = useState<string | null>(() => getInitialPreferences().shopCategory);

  useEffect(() => {
    try {
      const state: PreferencesState = { language, persona, name, businessName, phone, location, shopCategory };
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [language, persona, name, businessName, phone, location, shopCategory]);

  const setLanguage = useCallback((lng: string) => { setLanguageState(lng); }, []);
  const setPersona = useCallback((p: PersonaType) => { setPersonaState(p); }, []);
  const setName = useCallback((n: string) => { setNameState(n); }, []);
  const setBusinessName = useCallback((b: string) => { setBusinessNameState(b); }, []);
  const setPhone = useCallback((ph: string) => { setPhoneState(ph); }, []);
  const setLocation = useCallback((loc: string) => { setLocationState(loc); }, []);
  const setShopCategory = useCallback((cat: string) => { setShopCategoryState(cat); }, []);

  const resetPreferences = useCallback(() => {
    setLanguageState(null);
    setPersonaState(null);
    setNameState(null);
    setBusinessNameState(null);
    setPhoneState(null);
    setLocationState(null);
    setShopCategoryState(null);
  }, []);

  const value = useMemo<PreferencesContextValue>(() => ({
    language,
    persona,
    name,
    businessName,
    phone,
    location,
    shopCategory,
    setLanguage,
    setPersona,
    setName,
    setBusinessName,
    setPhone,
    setLocation,
    setShopCategory,
    resetPreferences,
  }), [language, persona, name, businessName, phone, location, shopCategory,
      setLanguage, setPersona, setName, setBusinessName, setPhone, setLocation, setShopCategory, resetPreferences]);

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
