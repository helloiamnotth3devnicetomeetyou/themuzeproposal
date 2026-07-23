"use client";

import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Locale, translations } from "../translations";

interface LocaleContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof translations[Locale];
}

const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);

const localeTextSelector = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "a", "button", "span", "li", "label",
  "dt", "dd", "figcaption", "blockquote", "td", "th",
  "[data-locale-text]",
].join(",");

function visibleLocaleText() {
  return Array.from(document.body.querySelectorAll<HTMLElement>(localeTextSelector)).filter((element) => {
    if (!element.textContent?.trim() || element.closest("[data-locale-static], [aria-hidden='true'], .sr-only")) return false;

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || rect.bottom <= 0 || rect.top >= window.innerHeight) return false;

    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  });
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ko");
  const localeRef = useRef(locale);
  const previousTextRef = useRef<Map<HTMLElement, string> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale;
    if (saved && (saved === "ko" || saved === "en" || saved === "ja")) {
      localeRef.current = saved;
      document.documentElement.lang = saved;
      void Promise.resolve().then(() => setLocaleState(saved));
    }
  }, []);

  useLayoutEffect(() => {
    const previousText = previousTextRef.current;
    previousTextRef.current = null;
    if (!previousText || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const changedElements = visibleLocaleText().filter(
      (element) => previousText.get(element) !== element.textContent?.trim(),
    );
    const leafElements = changedElements.filter(
      (element) => !changedElements.some((candidate) => candidate !== element && element.contains(candidate)),
    );
    const orderedElements = leafElements.sort(
      (left, right) => left.getBoundingClientRect().top - right.getBoundingClientRect().top,
    );

    let row = -1;
    let previousTop = Number.NEGATIVE_INFINITY;
    orderedElements.forEach((element) => {
      const top = element.getBoundingClientRect().top;
      if (top - previousTop > 18) row += 1;
      previousTop = top;

      element.getAnimations().forEach((animation) => {
        if (animation.id === "locale-reveal") animation.cancel();
      });
      const animation = element.animate(
        [
          { opacity: 0, transform: "translate3d(0, -8px, 0)", filter: "blur(3px)" },
          { opacity: 1, transform: "translate3d(0, 0, 0)", filter: "blur(0)" },
        ],
        {
          duration: 280,
          delay: Math.min(row * 38, 420),
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "backwards",
        },
      );
      animation.id = "locale-reveal";
    });
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    if (newLocale === localeRef.current) return;

    previousTextRef.current = new Map(
      visibleLocaleText().map((element) => [element, element.textContent?.trim() ?? ""]),
    );
    localeRef.current = newLocale;
    document.documentElement.lang = newLocale;
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  const t = translations[locale];

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
