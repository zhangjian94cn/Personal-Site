'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { dictionaries, Language } from '@/lib/i18n';

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('zh');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
  };

  const t = (path: string) => {
    const keys = path.split('.');
    let value: any = dictionaries[lang];
    for (const key of keys) {
      if (value[key] === undefined) {
        // Fallback to English if missing
        let fallback: any = dictionaries['zh'];
        for (const k of keys) fallback = fallback?.[k];
        return fallback || path;
      }
      value = value[key];
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
