"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTheme } from "@/core/providers/ThemeContext";
import { getTurnstileSiteKey } from "@/core/config/public-env";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileRenderOptions = {
  sitekey: string;
  theme: "light" | "dark";
  size: "normal" | "invisible" | "flexible";
  action?: string;
  execution?: "render" | "execute";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __turnstileOnLoad?: () => void;
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src^="${SCRIPT_SRC.split("?")[0]}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Turnstile script")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile script"));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

export interface TurnstileWidgetHandle {
  execute: () => void;
  reset: () => void;
}

interface TurnstileWidgetProps {
  onToken: (token: string | null) => void;
  action?: string;
  size?: "normal" | "invisible" | "flexible";
  className?: string;
}

const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(function TurnstileWidget(
  { onToken, action, size = "normal", className },
  ref,
) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const [failed, setFailed] = useState(false);

  useImperativeHandle(ref, () => ({
    execute: () => {
      if (widgetIdRef.current && window.turnstile) window.turnstile.execute(widgetIdRef.current);
    },
    reset: () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        onTokenRef.current(null);
      }
    },
  }), []);

  useEffect(() => {
    let cancelled = false;
    let siteKey: string;
    try {
      siteKey = getTurnstileSiteKey();
    } catch {
      setFailed(true);
      return;
    }

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: theme === "dark" ? "dark" : "light",
          size,
          action,
          execution: size === "invisible" ? "execute" : undefined,
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [theme, size, action]);

  if (failed) return null;
  return <div ref={containerRef} className={className} />;
});

export default TurnstileWidget;
