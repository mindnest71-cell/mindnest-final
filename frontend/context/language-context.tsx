import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANG_STORAGE_KEY = 'app_language';

export type AppLang = 'en' | 'th';

type LangContextValue = {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
  toggleLang: () => void;
};

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => undefined,
  toggleLang: () => undefined,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLang>('en');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(LANG_STORAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
        if (stored === 'en' || stored === 'th') setLangState(stored);
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  const setLang = (next: AppLang) => {
    setLangState(next);
    AsyncStorage.setItem(LANG_STORAGE_KEY, next).catch(() => undefined);
  };

  const toggleLang = () => setLang(lang === 'en' ? 'th' : 'en');

  const value = useMemo(() => ({ lang, setLang, toggleLang }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLanguage() {
  return useContext(LangContext);
}
