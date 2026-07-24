"use client";

import { useTheme } from "../context/ThemeContext";
import { useLocale } from "../context/LocaleContext";
import { useLoginForm } from "./_hooks";
import LoginFormPanel from "./components/LoginFormPanel";
import SlideshowPanel from "./components/SlideshowPanel";

interface LoginClientProps {
  redirectTo: string;
  oauthFailed: boolean;
}

export default function LoginClient({ redirectTo, oauthFailed }: LoginClientProps) {
  const { theme } = useTheme();
  const { locale } = useLocale();

  const formState = useLoginForm({ redirectTo, oauthFailed, locale });

  return (
    <div className="min-h-screen flex w-full" style={{ backgroundColor: "var(--bg-base)" }}>
      <LoginFormPanel {...formState} isDark={theme === "dark"} />
      <SlideshowPanel currentSlide={formState.currentSlide} />
    </div>
  );
}
