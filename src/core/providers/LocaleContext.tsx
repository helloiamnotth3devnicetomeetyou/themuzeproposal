"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { type Locale, translations } from "@/core/i18n/translations";

export type { Locale } from "@/core/i18n/translations";

interface LocaleContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (typeof translations)[Locale];
}

const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);
const LOCALE_COOKIE = "muze-locale";
let localeAnimations: Animation[] = [];

function snapshotLocaleText() {
  const snapshot = new Map<Element, string[]>();
  const root = document.querySelector(".locale-shell");
  if (!root) return snapshot;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.parentElement)
      snapshot.set(node.parentElement, [
        ...(snapshot.get(node.parentElement) ?? []),
        node.data,
      ]);
  }
  return snapshot;
}

function animateLocaleText(previousText: Map<Element, string[]>) {
  localeAnimations.forEach((animation) => animation.cancel());
  localeAnimations = [];
  const root = document.querySelector(".locale-shell");
  if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Array<{ node: Text; parent: HTMLElement }> = [];
  const positions = new Map<Element, number>();
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parent = node.parentElement;
    if (!parent) continue;
    const position = positions.get(parent) ?? 0;
    positions.set(parent, position + 1);
    const rect = parent.getBoundingClientRect();
    if (
      previousText.get(parent)?.[position] !== node.data &&
      node.data.trim() &&
      !parent.childElementCount &&
      rect.bottom >= 0 &&
      rect.top <= innerHeight &&
      !parent.closest("script, style, [aria-hidden='true']")
    )
      nodes.push({ node, parent });
  }

  let delay = 0;
  nodes
    .sort((a, b) => {
      const aRect = a.parent.getBoundingClientRect();
      const bRect = b.parent.getBoundingClientRect();
      return aRect.top - bRect.top || aRect.left - bRect.left;
    })
    .forEach(({ node, parent }) => {
      const letters = [...node.data].filter(
        (letter) => !/\s/.test(letter),
      ).length;
      const animation = parent.animate?.(
        [
          {
            opacity: 0,
            filter: "blur(10px)",
            clipPath: "inset(0 100% 0 0)",
            transform: "translateX(-.35em)",
          },
          {
            opacity: 1,
            filter: "none",
            clipPath: "inset(0)",
            transform: "none",
          },
        ],
        {
          duration: Math.max(160, letters * 21),
          delay,
          easing: `steps(${Math.max(letters, 1)}, end)`,
          fill: "backwards",
        },
      );
      if (animation) localeAnimations.push(animation);
      delay += letters * 10;
    });
}

function persistLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  localStorage.setItem("locale", locale);
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const cookieLocale = document.cookie.match(
      new RegExp(`(?:^|; )${LOCALE_COOKIE}=(ko|en|ja)(?:;|$)`),
    )?.[1];
    const savedLocale = cookieLocale ?? localStorage.getItem("locale");
    const nextLocale: Locale =
      savedLocale === "ko" || savedLocale === "en" || savedLocale === "ja"
        ? savedLocale
        : initialLocale;
    queueMicrotask(() => {
      persistLocale(nextLocale);
      setLocaleState(nextLocale);
    });
  }, [initialLocale]);

  const setLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    const previousText = snapshotLocaleText();
    setLocaleState(nextLocale);
    persistLocale(nextLocale);
    setTimeout(() => animateLocaleText(previousText));
  };

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, t: translations[locale] }}
    >
      <div className="locale-shell">{children}</div>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context)
    throw new Error("useLocale must be used within a LocaleProvider");
  return context;
}
