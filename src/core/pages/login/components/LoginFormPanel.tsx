"use client";

import Image from "next/image";
import Link from "next/link";
import { type LoginFormState } from "../hooks";
import GoogleSignInButton from "./GoogleSignInButton";
import { useLocale } from "@/core/providers/LocaleContext";

interface LoginFormPanelProps extends LoginFormState {
  isDark: boolean;
  showLoginRequired: boolean;
}

/** Reusable styled input field */
function FormInput({
  id,
  type,
  required,
  value,
  onChange,
  placeholder,
  label,
}: {
  id: string;
  type: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[10px] font-bold tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-slow focus:outline-none focus:border-brand-pink"
        style={{
          backgroundColor: "var(--bg-subtle)",
          border: "1px solid var(--border-default)",
          color: "var(--text-primary)",
        }}
        placeholder={placeholder}
      />
    </fieldset>
  );
}

/** Tab button with active underline indicator */
function ModeTab({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="pb-3 text-[10px] font-bold transition-all duration-slow relative cursor-pointer"
      style={{ color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}
    >
      {label}
      {isActive && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-pink" />}
    </button>
  );
}

type RuleKey = "length" | "lower" | "upper" | "digit" | "symbol";

interface PasswordRule {
  key: RuleKey;
  label: { ko: string; en: string; ja: string };
  test: (p: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  {
    key: "length",
    label: { ko: "8자 이상", en: "8+ characters", ja: "8文字以上" },
    test: (p) => p.length >= 8,
  },
  {
    key: "lower",
    label: { ko: "소문자 포함", en: "Lowercase letter", ja: "小文字を含む" },
    test: (p) => /[a-z]/.test(p),
  },
  {
    key: "upper",
    label: { ko: "대문자 포함", en: "Uppercase letter", ja: "大文字を含む" },
    test: (p) => /[A-Z]/.test(p),
  },
  {
    key: "digit",
    label: { ko: "숫자 포함", en: "Number", ja: "数字を含む" },
    test: (p) => /[0-9]/.test(p),
  },
  {
    key: "symbol",
    label: { ko: "기호 포함", en: "Symbol", ja: "記号を含む" },
    test: (p) => /[^a-zA-Z0-9]/.test(p),
  },
];

/** Micro-animated password strength meter, shown only in signup mode when password is non-empty */
function PasswordStrengthMeter({ password, locale }: { password: string; locale: "ko" | "en" | "ja" }) {
  if (!password) return null;

  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const total = PASSWORD_RULES.length;

  const barColor =
    passed <= 1
      ? "#ef4444"
      : passed <= 2
      ? "#f97316"
      : passed <= 3
      ? "#eab308"
      : passed === 4
      ? "#22c55e"
      : "#22c55e";

  return (
    <div
      style={{
        overflow: "hidden",
        animation: "pwStrengthIn 180ms cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <style>{`
        @keyframes pwStrengthIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pwBarGrow {
          from { width: 0%; }
        }
        @keyframes pwRuleIn {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Strength bar */}
      <div
        className="rounded-full overflow-hidden mb-2"
        style={{ height: "2px", backgroundColor: "var(--border-default)" }}
      >
        <div
          style={{
            height: "100%",
            width: `${(passed / total) * 100}%`,
            backgroundColor: barColor,
            borderRadius: "9999px",
            transition: "width 300ms cubic-bezier(0.22,1,0.36,1), background-color 300ms ease",
          }}
        />
      </div>

      {/* Rule checklist */}
      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
        {PASSWORD_RULES.map((rule, i) => {
          const ok = rule.test(password);
          return (
            <li
              key={rule.key}
              className="flex items-center gap-1"
              style={{
                animation: `pwRuleIn 200ms ${i * 30}ms cubic-bezier(0.22,1,0.36,1) both`,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  backgroundColor: ok ? "#22c55e" : "var(--border-default)",
                  transition: "background-color 200ms ease",
                }}
              />
              <span
                className="text-[9px] font-medium"
                style={{
                  color: ok ? "var(--text-secondary)" : "var(--text-faint)",
                  transition: "color 200ms ease",
                  textDecoration: ok ? "line-through" : "none",
                }}
              >
                {rule.label[locale]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function LoginFormPanel({
  mode,
  email,
  password,
  confirmPassword,
  name,
  error,
  loading,
  t,
  isDark,
  showLoginRequired,
  setEmail,
  setPassword,
  setConfirmPassword,
  setName,
  switchMode,
  handleLogin,
  handleSignup,
  handleGoogleLogin,
}: LoginFormPanelProps) {
  const { locale, setLocale } = useLocale();

  return (
    <div className="relative w-full md:w-[45%] flex items-center justify-start px-8 md:px-16 lg:px-24 py-24 z-10">
      <div className="w-full max-w-sm flex flex-col items-start text-left">

        {/* Top Back Link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-brand-pink"
            style={{ color: "var(--text-muted)" }}
          >
            <span>{t.backToHome}</span>
          </Link>
        </div>

        {/* Brand Logo */}
        <div className="flex flex-col items-start mb-12">
          <Link href="/" className="relative w-52 h-[3.25rem] block">
            <Image
              src="/images/logo.png"
              alt="THE MUZE Logo"
              fill
              sizes="176px"
              className="object-contain object-left transition-all duration-slow"
              style={isDark ? { filter: "invert(1)" } : {}}
              priority
            />
          </Link>
          <p className="text-[10px] font-semibold mt-4" style={{ color: "var(--text-muted)" }}>
            {mode === "login" ? t.accountSign : t.createAccount}
          </p>
          <div className="mt-3 flex gap-3" aria-label="언어 선택">
            {(["ko", "ja", "en"] as const).map((value) => <button type="button" key={value} onClick={() => setLocale(value)} className="relative h-5 text-[8px] font-bold" style={{ color: locale === value ? "var(--text-primary)" : "var(--text-faint)", borderBottom: locale === value ? "2px solid var(--color-brand-pink)" : "2px solid transparent" }}>{value === "ko" ? "KR" : value === "ja" ? "JP" : "EN"}</button>)}
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-8 border-b mb-8 w-full" style={{ borderColor: "var(--border-default)" }}>
          <ModeTab label={t.signIn} isActive={mode === "login"} onClick={() => switchMode("login")} />
          <ModeTab label={t.register} isActive={mode === "signup"} onClick={() => switchMode("signup")} />
        </div>

        {/* Status Messages */}
        {showLoginRequired && (
          <div
            role="status"
            className="mb-6 w-full px-4 py-3 rounded-lg text-xs font-semibold border"
            style={{
              backgroundColor: "var(--bg-subtle)",
              color: "var(--text-secondary)",
              borderColor: "var(--border-default)",
            }}
          >
            {t.loginRequired}
          </div>
        )}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 w-full px-4 py-3 rounded-lg text-xs font-semibold border"
            style={{
              backgroundColor: "var(--color-error-subtle)",
              color: "var(--color-error)",
              borderColor: "var(--color-error-border)",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={mode === "login" ? handleLogin : handleSignup}
          className="flex flex-col gap-5 w-full"
        >
          {mode === "signup" && (
            <FormInput
              id="login-name"
              type="text"
              required
              label={t.name}
              value={name}
              onChange={setName}
              placeholder={t.namePlaceholder}
            />
          )}

          <FormInput
            id="login-email"
            type="email"
            required
            label={t.email}
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          />

          <div className="flex flex-col gap-2">
            <FormInput
              id="login-password"
              type="password"
              required
              label={t.password}
              value={password}
              onChange={setPassword}
              placeholder={t.passwordPlaceholder}
            />
            {mode === "signup" && (
              <PasswordStrengthMeter
                password={password}
                locale={locale === "ja" ? "ja" : locale === "en" ? "en" : "ko"}
              />
            )}
          </div>

          {mode === "signup" && (
            <FormInput
              id="login-confirm-password"
              type="password"
              required
              label={t.confirmPassword}
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder={t.confirmPlaceholder}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 rounded-lg text-xs font-bold tracking-widest transition-all duration-slow hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{
              backgroundColor: "var(--text-primary)",
              color: "var(--bg-base)",
            }}
          >
            {loading ? t.processing : mode === "login" ? t.signIn : t.register}
          </button>
        </form>

        {/* Google Sign-In (login mode only) */}
        {mode === "login" && (
          <GoogleSignInButton
            loading={loading}
            label={t.googleSignIn}
            onClick={handleGoogleLogin}
          />
        )}

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

      </div>
    </div>
  );
}
