"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthUserError, signIn, signUp } from "@/lib/auth";
import { useTheme } from "../context/ThemeContext";
import { useLocale } from "../context/LocaleContext";
import Image from "next/image";
import Link from "next/link";

type Mode = "login" | "signup";

const localT = {
  ko: {
    signIn: "로그인",
    register: "회원가입",
    email: "이메일 주소",
    password: "비밀번호",
    confirmPassword: "비밀번호 확인",
    name: "이름",
    namePlaceholder: "이름을 입력하세요",
    passwordPlaceholder: "비밀번호",
    confirmPlaceholder: "비밀번호 재입력",
    descLogin: "THE MUZE 계정으로 로그인하세요.",
    descSignup: "새 계정을 만들어 시작하세요.",
    processing: "PROCESSING...",
    loginFailed: "로그인에 실패했습니다.",
    rateLimited: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
    signupFailed: "회원가입에 실패했습니다.",
    signupSuccess: "회원가입이 완료되었습니다! 이메일 인증 후 로그인해 주세요.",
    passwordLengthErr: "비밀번호는 6자 이상이어야 합니다.",
    passwordMatchErr: "비밀번호가 일치하지 않습니다.",
    backToHome: "← 홈으로 돌아가기",
    accountSign: "계정 로그인",
    createAccount: "새 계정 등록",
    noAccount: "계정이 없으신가요?",
    hasAccount: "이미 계정이 있으신가요?"
  },
  en: {
    signIn: "SIGN IN",
    register: "REGISTER",
    email: "EMAIL ADDRESS",
    password: "PASSWORD",
    confirmPassword: "CONFIRM PASSWORD",
    name: "NAME",
    namePlaceholder: "Enter your name",
    passwordPlaceholder: "Password",
    confirmPlaceholder: "Re-enter password",
    descLogin: "Sign in to your THE MUZE account.",
    descSignup: "Create a new account to get started.",
    processing: "PROCESSING...",
    loginFailed: "Failed to sign in.",
    rateLimited: "Too many sign-in attempts. Please try again later.",
    signupFailed: "Failed to create account.",
    signupSuccess: "Registration successful! Please check your email to verify.",
    passwordLengthErr: "Password must be at least 6 characters.",
    passwordMatchErr: "Passwords do not match.",
    backToHome: "← BACK TO HOME",
    accountSign: "ACCOUNT SIGN IN",
    createAccount: "CREATE ACCOUNT",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?"
  },
  ja: {
    signIn: "ログイン",
    register: "会員登録",
    email: "メールアドレス",
    password: "パスワード",
    confirmPassword: "パスワード確認",
    name: "お名前",
    namePlaceholder: "お名前を入力してください",
    passwordPlaceholder: "パスワード",
    confirmPlaceholder: "パスワードの再入力",
    descLogin: "THE MUZEアカウントでログインしてください。",
    descSignup: "新しいアカウントを作成して開始します。",
    processing: "PROCESSING...",
    loginFailed: "ログインに失敗しました。",
    rateLimited: "ログイン試行回数が多すぎます。しばらくしてから再試行してください。",
    signupFailed: "会員登録に失敗しました。",
    signupSuccess: "会員登録が完了しました！メール認証後にログインしてください。",
    passwordLengthErr: "パスワードは6文字以上である必要があります。",
    passwordMatchErr: "パスワードが一致しません。",
    backToHome: "← ホームに戻る",
    accountSign: "アカウントログイン",
    createAccount: "新規アカウント作成",
    noAccount: "アカウントをお持ちでないですか？",
    hasAccount: "すでにアカウントをお持ちですか？"
  }
};

const SLIDES = [
  { img: "/images/hero_1.png", title: "PRETTY GIRL" },
  { img: "/images/hero_2.png", title: "RUNAWAY" },
  { img: "/images/hero_3.png", title: "LIP BOMB" },
  { img: "/images/hero_4.png", title: "GLOW UP" },
  { img: "/images/hero_5.png", title: "SCENEDROME" },
];

export default function LoginClient({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const { theme } = useTheme();
  const { locale } = useLocale();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Background Slider State
  const [currentSlide, setCurrentSlide] = useState(0);

  const isDark = theme === "dark";
  const t = localT[locale] || localT.ko;

  // Autoplay Right Slideshow
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
      setError(err instanceof AuthUserError && err.code === "RATE_LIMITED"
        ? t.rateLimited
        : t.loginFailed);
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

  return (
    <div className="min-h-screen flex w-full" style={{ backgroundColor: "var(--bg-base)" }}>
      
      {/* Left Column (Forms) */}
      <div className="w-full md:w-[45%] flex items-center justify-start px-8 md:px-16 lg:px-24 py-24 z-10">
        <div className="w-full max-w-sm flex flex-col items-start text-left">
          
          {/* Brand Logo */}
          <div className="flex flex-col items-start mb-12">
            <Link href="/" className="relative w-44 h-11 block transition-transform duration-300 hover:scale-105">
              <Image
                src="/images/logo.png"
                alt="THE MUZE Logo"
                fill
                sizes="176px"
                className="object-contain object-left transition-all duration-300"
                style={isDark ? { filter: "invert(1)" } : {}}
                priority
              />
            </Link>
            <p className="text-[10px] font-semibold mt-4" style={{ color: "var(--text-muted)" }}>
              {mode === "login" ? t.accountSign : t.createAccount}
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-8 border-b mb-8 w-full" style={{ borderColor: "var(--border-default)" }}>
            <button
              onClick={() => switchMode("login")}
              className="pb-3 text-xs font-bold tracking-widest transition-all duration-300 relative cursor-pointer"
              style={{ color: mode === "login" ? "var(--text-primary)" : "var(--text-muted)" }}
            >
              {t.signIn}
              {mode === "login" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-pink" />
              )}
            </button>
            <button
              onClick={() => switchMode("signup")}
              className="pb-3 text-xs font-bold tracking-widest transition-all duration-300 relative cursor-pointer"
              style={{ color: mode === "signup" ? "var(--text-primary)" : "var(--text-muted)" }}
            >
              {t.register}
              {mode === "signup" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-pink" />
              )}
            </button>
          </div>

          {/* Status Messages */}
          {error && (
            <div
              className="mb-6 w-full px-4 py-3 rounded-lg text-xs font-semibold border"
              style={{
                backgroundColor: "var(--alpha-ef4444-03)",
                color: "var(--palette-ef4444)",
                borderColor: "var(--alpha-ef4444-15)",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="mb-6 w-full px-4 py-3 rounded-lg text-xs font-semibold border"
              style={{
                backgroundColor: "var(--alpha-22c55e-03)",
                color: "var(--palette-22c55e)",
                borderColor: "var(--alpha-22c55e-15)",
              }}
            >
              {success}
            </div>
          )}

          {/* Forms */}
          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="flex flex-col gap-5 w-full">
            {mode === "signup" && (
              <fieldset className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-muted)" }}>
                  {t.name}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-300 focus:outline-none focus:border-brand-pink"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                  placeholder={t.namePlaceholder}
                />
              </fieldset>
            )}

            <fieldset className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-muted)" }}>
                {t.email}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-300 focus:outline-none focus:border-brand-pink"
                style={{
                  backgroundColor: "var(--bg-subtle)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
                placeholder="you@example.com"
              />
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-muted)" }}>
                {t.password}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-300 focus:outline-none focus:border-brand-pink"
                style={{
                  backgroundColor: "var(--bg-subtle)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
                placeholder={t.passwordPlaceholder}
              />
            </fieldset>

            {mode === "signup" && (
              <fieldset className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-muted)" }}>
                  {t.confirmPassword}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-300 focus:outline-none focus:border-brand-pink"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                  placeholder={t.confirmPlaceholder}
                />
              </fieldset>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 rounded-lg text-xs font-bold tracking-widest transition-all duration-300 hover:opacity-90 disabled:opacity-50 cursor-pointer"
              style={{
                backgroundColor: "var(--text-primary)",
                color: "var(--bg-base)",
              }}
            >
              {loading ? t.processing : mode === "login" ? t.signIn : t.register}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-8">
            {mode === "login" ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t.noAccount}{" "}
                <button
                  onClick={() => switchMode("signup")}
                  className="font-bold text-brand-pink hover:underline cursor-pointer"
                >
                  {t.register}
                </button>
              </p>
            ) : (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t.hasAccount}{" "}
                <button
                  onClick={() => switchMode("login")}
                  className="font-bold text-brand-pink hover:underline cursor-pointer"
                >
                  {t.signIn}
                </button>
              </p>
            )}
          </div>

          {/* Back Link */}
          <div className="mt-10">
            <Link
              href="/"
              className="text-[10px] font-bold tracking-widest transition-colors hover:text-brand-pink"
              style={{ color: "var(--text-muted)" }}
            >
              {t.backToHome}
            </Link>
          </div>

        </div>
      </div>

      {/* Right Column (Simplified Visual Slideshow) */}
      <div className="hidden md:block md:w-[55%] relative overflow-hidden h-screen bg-[var(--color-static-black)]">
        {SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <Image
                src={slide.img}
                alt={slide.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={index === 0}
                className={`object-cover transition-transform duration-[4500ms] ease-out ${
                  isActive ? "scale-105" : "scale-100"
                }`}
              />
            </div>
          );
        })}
      </div>

    </div>
  );
}
