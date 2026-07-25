"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthUserError, signIn, signInWithGoogle, signUp } from "@/core/auth/auth";
import { SLIDES } from "./constants";
import { localT, type LocaleKey, type LoginTranslations } from "./locales";

export type Mode = "login" | "signup";

interface UseLoginFormOptions {
  redirectTo: string;
  oauthFailed: boolean;
  locale: LocaleKey;
}

export interface LoginFormState {
  mode: Mode;
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  error: string;
  success: string;
  loading: boolean;
  currentSlide: number;
  t: LoginTranslations;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setConfirmPassword: (v: string) => void;
  setName: (v: string) => void;
  switchMode: (next: Mode) => void;
  handleLogin: (e: React.FormEvent) => Promise<void>;
  handleSignup: (e: React.FormEvent) => Promise<void>;
  handleGoogleLogin: () => Promise<void>;
}

export function useLoginForm({
  redirectTo,
  oauthFailed,
  locale,
}: UseLoginFormOptions): LoginFormState {
  const router = useRouter();
  const t = localT[locale] ?? localT.ko;

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(oauthFailed ? t.googleFailed : "");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

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
    setConfirmPassword("");
    setName("");
    setError("");
    setSuccess("");
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    resetForm();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      router.push(redirectTo);
      setTimeout(() => window.location.reload(), 100);
    } catch (err: unknown) {
      setError(
        err instanceof AuthUserError && err.code === "RATE_LIMITED"
          ? t.rateLimited
          : t.loginFailed,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (password.length < 6) {
      setError(t.passwordLengthErr);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.passwordMatchErr);
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, name);
      setSuccess(t.signupSuccess);
      setMode("login");
      setPassword("");
      setConfirmPassword("");
      setName("");
    } catch {
      setError(t.signupFailed);
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
    email,
    password,
    confirmPassword,
    name,
    error,
    success,
    loading,
    currentSlide,
    t,
    setEmail,
    setPassword,
    setConfirmPassword,
    setName,
    switchMode,
    handleLogin,
    handleSignup,
    handleGoogleLogin,
  };
}
