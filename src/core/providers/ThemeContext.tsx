"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);
const THEME_COOKIE = "muze-theme";

function persistTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.cookie = `${THEME_COOKIE}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
  localStorage.setItem("theme", theme);
}

export function ThemeProvider({ children, initialTheme }: { children: React.ReactNode; initialTheme: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    const cookieTheme = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE}=(dark|light)(?:;|$)`))?.[1];
    const savedTheme = cookieTheme ?? localStorage.getItem("theme");
    const nextTheme: Theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : initialTheme;
    queueMicrotask(() => {
      persistTheme(nextTheme);
      setTheme(nextTheme);
    });
  }, [initialTheme]);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    persistTheme(next);
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
