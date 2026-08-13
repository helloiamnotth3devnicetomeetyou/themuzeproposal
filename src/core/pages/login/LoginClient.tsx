"use client";

import { useRef } from "react";
import { useTheme } from "@/core/providers/ThemeContext";
import { useLocale } from "@/core/providers/LocaleContext";
import type { TurnstileWidgetHandle } from "@/core/components/form/TurnstileWidget";
import { useLoginForm } from "./hooks";
import LoginFormPanel from "./components/LoginFormPanel";
import SlideshowPanel from "./components/SlideshowPanel";

interface LoginClientProps {
  redirectTo: string;
  oauthFailed: boolean;
}

export default function LoginClient({
  redirectTo,
  oauthFailed,
}: LoginClientProps) {
  const { theme } = useTheme();
  const { locale } = useLocale();
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const formState = useLoginForm({
    redirectTo,
    oauthFailed,
    locale,
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
      <SlideshowPanel currentSlide={formState.currentSlide} />
    </div>
  );
}
