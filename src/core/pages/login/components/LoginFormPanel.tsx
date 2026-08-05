"use client";

import Image from "next/image";
import Link from "next/link";
import { type LoginFormState } from "../hooks";
import GoogleSignInButton from "./GoogleSignInButton";

interface LoginFormPanelProps extends LoginFormState {
  isDark: boolean;
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
  setEmail,
  setPassword,
  setConfirmPassword,
  setName,
  switchMode,
  handleLogin,
  handleSignup,
  handleGoogleLogin,
}: LoginFormPanelProps) {
  return (
    <div className="w-full md:w-[45%] flex items-center justify-start px-8 md:px-16 lg:px-24 py-24 z-10">
      <div className="w-full max-w-sm flex flex-col items-start text-left">

        {/* Top Back Link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-brand-pink"
            style={{ color: "var(--text-muted)" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t.backToHome}</span>
          </Link>
        </div>

        {/* Brand Logo */}
        <div className="flex flex-col items-start mb-12">
          <Link href="/" className="relative w-44 h-11 block transition-transform duration-slow hover:scale-105">
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
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-8 border-b mb-8 w-full" style={{ borderColor: "var(--border-default)" }}>
          <ModeTab label={t.signIn} isActive={mode === "login"} onClick={() => switchMode("login")} />
          <ModeTab label={t.register} isActive={mode === "signup"} onClick={() => switchMode("signup")} />
        </div>

        {/* Status Messages */}
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
