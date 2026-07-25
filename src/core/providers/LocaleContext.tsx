"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { type Locale, translations } from "../translations";

export type { Locale } from "../translations";

interface LocaleContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof translations[Locale];
}

const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);
const LOCALE_COOKIE = "muze-locale";

function persistLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  localStorage.setItem("locale", locale);
}

export function LocaleProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = initialLocale;
    const hasLocaleCookie = document.cookie.split("; ").some((item) => item.startsWith(`${LOCALE_COOKIE}=`));
    const saved = localStorage.getItem("locale");
    if (!hasLocaleCookie && (saved === "ko" || saved === "en" || saved === "ja") && saved !== initialLocale) {
      persistLocale(saved);
      void Promise.resolve().then(() => setLocaleState(saved));
    }
  }, [initialLocale]);

  const setLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    setLocaleState(nextLocale);
    persistLocale(nextLocale);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      <div className="locale-shell">{children}</div>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within a LocaleProvider");
  return context;
}