
'use client';
import { createContext, useContext, useState, useEffect, type ReactNode, useMemo } from 'react';
import enTranslations from '@/locales/en.json';
import mrTranslations from '@/locales/mr.json';
import hiTranslations from '@/locales/hi.json';

type Language = 'en' | 'mr' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
}

const translations = {
  en: enTranslations,
  mr: mrTranslations,
  hi: hiTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('agriBazaarLanguage') as Language | null;
    if (storedLang && ['en', 'mr', 'hi'].includes(storedLang)) {
      setLanguage(storedLang);
    }
  }, []);

  const setAndStoreLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('agriBazaarLanguage', lang);
  };

  const t = useMemo(() => (key: string, options?: Record<string, string | number>): string => {
    const langDict = translations[language] as Record<string, string>;
    const fallbackDict = translations['en'] as Record<string, string>;
    
    let translation = langDict[key] || fallbackDict[key] || key;

    if (options) {
      Object.keys(options).forEach(optKey => {
        const regex = new RegExp(`{{${optKey}}}`, 'g');
        translation = translation.replace(regex, String(options[optKey]));
      });
    }

    return translation;
  }, [language]);

  const value = {
    language,
    setLanguage: setAndStoreLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
