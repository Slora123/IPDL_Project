import React, { createContext, useContext, useMemo } from "react";
import { usePreferences } from "./PreferencesContext";

type TranslationDict = Record<string, string>;
type Namespaces = "common" | "dashboard";

type Translations = Record<string, Record<Namespaces, TranslationDict>>;

const translations: Translations = {
  en: {
    common: {
      app_title: "Trackify Dashboard",
      language: "Language",
      persona: "Persona",
      student: "Student",
      business: "Business",
      common: "Common",
      continue: "Continue",
      save: "Save",
      cancel: "Cancel",
    },
    dashboard: {
      header_title: "Your Business Dashboard",
      subheader_today: "Today's Financial Overview",
      view_reports: "View Reports",
      todays_income: "Today's Income",
      todays_expenses: "Today's Expenses",
      net_profit: "Net Profit",
      transactions: "Transactions",
      income_vs_expenses: "Income vs Expenses",
      profit_loss_trend: "Profit & Loss Trend",
      category_breakdown: "Category Breakdown",
      recent_transactions: "Recent Transactions",
      sale: "Sale",
      expense: "Expense",
      tip_title: "Today's Financial Tip",
    },
  },
  hi: {
    common: {
      app_title: "ट्रैकिफ़ाई डैशबोर्ड",
      language: "भाषा",
      persona: "प्रोफ़ाइल",
      student: "विद्यार्थी",
      business: "व्यवसाय",
      common: "सामान्य",
      continue: "जारी रखें",
      save: "सेव करें",
      cancel: "रद्द करें",
    },
    dashboard: {
      header_title: "आपका बिज़नेस डैशबोर्ड",
      subheader_today: "आज का वित्तीय सारांश",
      view_reports: "रिपोर्ट देखें",
      todays_income: "आज की आय",
      todays_expenses: "आज का खर्च",
      net_profit: "शुद्ध लाभ",
      transactions: "लेन-देन",
      income_vs_expenses: "आय बनाम खर्च",
      profit_loss_trend: "लाभ और हानि रुझान",
      category_breakdown: "श्रेणी विश्लेषण",
      recent_transactions: "हाल के लेन-देन",
      sale: "बिक्री",
      expense: "खर्च",
      tip_title: "आज की वित्तीय सलाह",
    },
  },
};

interface I18nContextValue {
  t: (key: string, ns?: Namespaces) => string;
  language: string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = usePreferences();
  const resolvedLang = language ?? "en";

  const value = useMemo<I18nContextValue>(() => ({
    t: (key: string, ns: Namespaces = "common") => {
      const dict = translations[resolvedLang]?.[ns] ?? translations.en[ns];
      return dict[key] ?? key;
    },
    language: resolvedLang,
  }), [resolvedLang]);

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};


