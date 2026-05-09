"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { localeCookieName, normalizeLocale, t, type Locale, type TranslationKey } from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  cookieName = localeCookieName,
  initialLocale,
}: {
  children: React.ReactNode;
  cookieName?: string | null;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(normalizeLocale(initialLocale));

  useEffect(() => {
    const previousLang = document.documentElement.lang;

    document.documentElement.lang = locale;

    return () => {
      document.documentElement.lang = previousLang;
    };
  }, [locale]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale(nextLocale) {
        const normalizedLocale = normalizeLocale(nextLocale);

        if (cookieName) {
          document.cookie = `${cookieName}=${normalizedLocale}; path=/; max-age=31536000; samesite=lax`;
        }

        document.documentElement.lang = normalizedLocale;
        setLocaleState(normalizedLocale);
      },
      t(key) {
        return t(locale, key);
      },
    }),
    [cookieName, locale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider.");
  }

  return context;
}
