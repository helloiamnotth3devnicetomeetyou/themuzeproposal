"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AuthUserError,
  signIn,
  signInWithGoogle,
  signUp,
} from "@/core/auth/auth";
import { SLIDES } from "./constants";
import { localT, type LocaleKey, type LoginTranslations } from "./locales";

type Mode = "login" | "signup";

function loginErrorMessage(error: unknown, t: LoginTranslations) {
  if (!(error instanceof AuthUserError)) return t.loginFailed;

  switch (error.code) {
    case "INVALID_CREDENTIALS":
      return t.invalidCredentials;
    case "RATE_LIMITED": {
      const minutes = Math.max(
        1,
        Math.ceil((error.retryAfterSeconds ?? 15 * 60) / 60),
      );
      return t.rateLimited.replace("{minutes}", String(minutes));
    }
    case "SERVICE_UNAVAILABLE":
      return t.serviceUnavailable;
    default:
      return t.loginFailed;
  }
}

function signupErrorMessage(
  error: unknown,
  t: LoginTranslations,
  locale: LocaleKey,
) {
  if (!(error instanceof AuthUserError) || error.code !== "RATE_LIMITED")
    return t.signupFailed;
  if (locale === "ko")
    return "회원가입 요청이 너무 많아 잠시 제한되었습니다. 보안상 1분 후 다시 시도해 주세요.";
  if (locale === "ja")
    return "登録リクエストが多すぎます。1分ほど待ってからもう一度お試しください。";
  return "Too many sign-up requests. Please wait one minute before trying again.";
}

interface UseLoginFormOptions {
  redirectTo: string;
  oauthFailed: boolean;
  locale: LocaleKey;
  resetTurnstile?: () => void;
}

export interface LoginFormState {
  mode: Mode;
  signupStep: 1 | 2;
  email: string;
  password: string;
  name: string;
  error: string;
  notice: string;
  loading: boolean;
  currentSlide: number;
  t: LoginTranslations;
  turnstileToken: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setName: (v: string) => void;
  setTurnstileToken: (v: string | null) => void;
  switchMode: (next: Mode) => void;
  previousSignupStep: () => void;
  handleLogin: (e: React.FormEvent) => Promise<void>;
  handleSignup: (e: React.FormEvent) => Promise<void>;
  handleGoogleLogin: () => Promise<void>;
}

export function useLoginForm({
  redirectTo,
  oauthFailed,
  locale,
  resetTurnstile,
}: UseLoginFormOptions): LoginFormState {
  const router = useRouter();
  const t = localT[locale] ?? localT.ko;

  const [mode, setMode] = useState<Mode>("login");
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(oauthFailed ? t.googleFailed : "");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [turnstileToken, setTurnstileTokenState] = useState("");
  const setTurnstileToken = (v: string | null) =>
    setTurnstileTokenState(v ?? "");

  // Autoplay slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setError("");
    setNotice("");
    setSignupStep(1);
    setTurnstileTokenState("");
    resetTurnstile?.();
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    resetForm();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!turnstileToken) {
      setError(t.captchaRequired);
      return;
    }
    setLoading(true);

    try {
      await signIn(email, password, turnstileToken);
      router.push(redirectTo);
      setTimeout(() => window.location.reload(), 100);
    } catch (err: unknown) {
      setError(loginErrorMessage(err, t));
      setTurnstileTokenState("");
      resetTurnstile?.();
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (signupStep === 1) {
      setSignupStep(2);
      return;
    }
    setLoading(true);

    if (password.length < 12) {
      setError(t.passwordLengthErr);
      setLoading(false);
      return;
    }

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);
    if (!hasLower || !hasUpper || !hasDigit || !hasSymbol) {
      setError(t.passwordStrengthErr);
      setLoading(false);
      return;
    }

    if (!turnstileToken) {
      setError(t.captchaRequired);
      setLoading(false);
      return;
    }

    try {
      const data = await signUp(email, password, turnstileToken, name);
      if (!data.session) {
        setNotice(t.confirmEmail);
        setMode("login");
        setSignupStep(1);
        setPassword("");
        return;
      }
      router.push(redirectTo);
      setTimeout(() => window.location.reload(), 100);
    } catch (error: unknown) {
      setError(signupErrorMessage(error, t, locale));
      setTurnstileTokenState("");
      resetTurnstile?.();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await signInWithGoogle(redirectTo);
    } catch {
      setError(t.googleFailed);
      setLoading(false);
    }
  };

  return {
    mode,
    signupStep,
    email,
    password,
    name,
    error,
    notice,
    loading,
    currentSlide,
    t,
    turnstileToken,
    setEmail,
    setPassword,
    setName,
    setTurnstileToken,
    switchMode,
    previousSignupStep: () => {
      setSignupStep(1);
      setError("");
    },
    handleLogin,
    handleSignup,
    handleGoogleLogin,
  };
}
