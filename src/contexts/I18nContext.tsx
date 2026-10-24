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
      edit: "Edit",
      delete: "Delete",
      filter: "Filter",
      search: "Search",
      all: "All",
      today: "Today",
      yesterday: "Yesterday",
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
      transaction_history: "Transaction History",
      all_transactions: "All your voice-recorded and manual transactions",
      add_manual: "Add Manual",
      date_range: "Date Range",
      all_transactions_tab: "All Transactions",
      income_only: "Income Only",
      expenses_only: "Expenses Only",
      voice_recorded: "Voice Recorded",
      todays_transactions: "Today's Transactions",
      yesterdays_transactions: "Yesterday's Transactions",
      total_transactions: "Total Transactions",
      search_placeholder: "Search transactions, categories, or items...",
      income: "Income",
      voice: "Voice",
      voice_tips_title: "Voice Recording Tips",
      voice_tips_desc: "Get better results from voice transaction recording",
      hindi_example: "Hindi Example:",
      english_example: "English Example:",
      marathi_example: "Marathi Example:",
      best_practices: "Best Practices:",
      best_practices_text: "Speak clearly, mention amount and item name",
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
      edit: "संपादित करें",
      delete: "हटाएं",
      filter: "फ़िल्टर",
      search: "खोजें",
      all: "सभी",
      today: "आज",
      yesterday: "कल",
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
      transaction_history: "लेन-देन इतिहास",
      all_transactions: "आपके सभी वॉइस और मैनुअल लेन-देन",
      add_manual: "मैनुअल जोड़ें",
      date_range: "तिथि सीमा",
      all_transactions_tab: "सभी लेन-देन",
      income_only: "केवल आय",
      expenses_only: "केवल खर्च",
      voice_recorded: "वॉइस रिकॉर्डेड",
      todays_transactions: "आज के लेन-देन",
      yesterdays_transactions: "कल के लेन-देन",
      total_transactions: "कुल लेन-देन",
      search_placeholder: "लेन-देन, श्रेणी या आइटम खोजें...",
      income: "आय",
      voice: "वॉइस",
      voice_tips_title: "वॉइस रिकॉर्डिंग टिप्स",
      voice_tips_desc: "वॉइस लेन-देन रिकॉर्डिंग से बेहतर परिणाम प्राप्त करें",
      hindi_example: "हिंदी उदाहरण:",
      english_example: "अंग्रेजी उदाहरण:",
      marathi_example: "मराठी उदाहरण:",
      best_practices: "सर्वोत्तम प्रथाएं:",
      best_practices_text: "स्पष्ट रूप से बोलें, राशि और आइटम का नाम बताएं",
    },
  },
  mr: {
    common: {
      app_title: "ट्रॅकिफाय डॅशबोर्ड",
      language: "भाषा",
      persona: "प्रोफाइल",
      student: "विद्यार्थी",
      business: "व्यवसाय",
      common: "सामान्य",
      continue: "पुढे चालू ठेवा",
      save: "सेव्ह करा",
      cancel: "रद्द करा",
      edit: "संपादित करा",
      delete: "हटवा",
      filter: "फिल्टर",
      search: "शोधा",
      all: "सर्व",
      today: "आज",
      yesterday: "काल",
    },
    dashboard: {
      header_title: "तुमचा बिझनेस डॅशबोर्ड",
      subheader_today: "आजचा आर्थिक आढावा",
      view_reports: "रिपोर्ट पहा",
      todays_income: "आजचे उत्पन्न",
      todays_expenses: "आजचा खर्च",
      net_profit: "निव्वळ नफा",
      transactions: "व्यवहार",
      income_vs_expenses: "उत्पन्न विरुद्ध खर्च",
      profit_loss_trend: "नफा आणि तोटा कल",
      category_breakdown: "श्रेणी विश्लेषण",
      recent_transactions: "अलीकडील व्यवहार",
      sale: "विक्री",
      expense: "खर्च",
      tip_title: "आजची आर्थिक टीप",
      transaction_history: "व्यवहार इतिहास",
      all_transactions: "तुमचे सर्व व्हॉइस आणि मॅन्युअल व्यवहार",
      add_manual: "मॅन्युअल जोडा",
      date_range: "तारीख मर्यादा",
      all_transactions_tab: "सर्व व्यवहार",
      income_only: "फक्त उत्पन्न",
      expenses_only: "फक्त खर्च",
      voice_recorded: "व्हॉइस रेकॉर्ड केलेले",
      todays_transactions: "आजचे व्यवहार",
      yesterdays_transactions: "कालचे व्यवहार",
      total_transactions: "एकूण व्यवहार",
      search_placeholder: "व्यवहार, श्रेणी किंवा वस्तू शोधा...",
      income: "उत्पन्न",
      voice: "व्हॉइस",
      voice_tips_title: "व्हॉइस रेकॉर्डिंग टिप्स",
      voice_tips_desc: "व्हॉइस व्यवहार रेकॉर्डिंगमधून चांगले परिणाम मिळवा",
      hindi_example: "हिंदी उदाहरण:",
      english_example: "इंग्रजी उदाहरण:",
      marathi_example: "मराठी उदाहरण:",
      best_practices: "उत्तम पद्धती:",
      best_practices_text: "स्पष्टपणे बोला, रक्कम आणि वस्तूचे नाव सांगा",
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
