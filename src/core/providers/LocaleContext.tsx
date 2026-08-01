"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { type Locale, translations } from "@/core/i18n/translations";

export type { Locale } from "@/core/i18n/translations";

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
    const cookieLocale = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=(ko|en|ja)(?:;|$)`))?.[1];
    const savedLocale = cookieLocale ?? localStorage.getItem("locale");
    const nextLocale: Locale = savedLocale === "ko" || savedLocale === "en" || savedLocale === "ja" ? savedLocale : initialLocale;
    queueMicrotask(() => {
      persistLocale(nextLocale);
      setLocaleState(nextLocale);
    });
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
