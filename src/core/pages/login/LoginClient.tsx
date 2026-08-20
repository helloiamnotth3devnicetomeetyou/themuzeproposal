"use client";

import { useTheme } from "@/core/providers/ThemeContext";
import { useLocale } from "@/core/providers/LocaleContext";
import { useRef } from "react";
import type { TurnstileWidgetHandle } from "@/core/components/form/TurnstileWidget";
import { useLoginForm } from "./hooks";
import LoginFormPanel from "./components/LoginFormPanel";
import SlideshowPanel from "./components/SlideshowPanel";
import type { LoginSlide } from "@/core/content/login-slides";

interface LoginClientProps {
  redirectTo: string;
  oauthFailed: boolean;
  slides: LoginSlide[];
}

export default function LoginClient({
  redirectTo,
  oauthFailed,
  slides,
}: LoginClientProps) {
  const { theme } = useTheme();
  const { locale } = useLocale();
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const formState = useLoginForm({
    redirectTo,
    oauthFailed,
    locale,
    slideCount: slides.length,
    resetTurnstile: () => turnstileRef.current?.reset(),
  });

  return (
    <div
      className="min-h-screen flex w-full"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <LoginFormPanel
        {...formState}
        isDark={theme === "dark"}
        showLoginRequired={redirectTo !== "/"}
        turnstileRef={turnstileRef}
      />
      <SlideshowPanel currentSlide={formState.currentSlide} slides={slides} />
    </div>
  );
}
