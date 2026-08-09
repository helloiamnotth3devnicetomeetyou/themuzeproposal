"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/core/providers/LocaleContext";
import { type LoginFormState } from "../hooks";
import GoogleSignInButton from "./GoogleSignInButton";

interface LoginFormPanelProps extends LoginFormState {
  isDark: boolean;
  showLoginRequired: boolean;
}

function Input({ id, label, type = "text", value, onChange, placeholder, autoComplete }: { id: string; label: string; type?: string; value: string; onChange: (value: string) => void; placeholder: string; autoComplete?: string }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <input id={id} type={type} required value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete ?? (type === "email" ? "email" : "name")} className="w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition duration-200 placeholder:text-[var(--text-faint)] focus:-translate-y-px focus:border-brand-pink focus:ring-4 focus:ring-brand-pink/10 motion-reduce:transform-none motion-reduce:transition-none" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-default)", color: "var(--text-primary)" }} />
    </label>
  );
}

export default function LoginFormPanel({ mode, signupStep, email, password, name, error, loading, t, isDark, showLoginRequired, setEmail, setPassword, setName, switchMode, previousSignupStep, handleLogin, handleSignup, handleGoogleLogin }: LoginFormPanelProps) {
  const { locale, setLocale } = useLocale();
  const isSignup = mode === "signup";
  const nextLabel = locale === "ko" ? "다음" : locale === "ja" ? "次へ" : "NEXT";
  const backLabel = locale === "ko" ? "이전" : locale === "ja" ? "戻る" : "BACK";

  return (
    <main className="relative flex w-full items-center justify-center px-6 py-12 md:w-[46%] md:px-12 lg:px-20">
      <section className="w-full max-w-sm">
        <div className="mb-10">
          <Link href="/" className="relative mb-10 block h-12 w-52 transition-opacity hover:opacity-65">
            <Image src="/images/logo.png" alt="THE MUZE" fill sizes="208px" className="object-contain object-left" style={isDark ? { filter: "invert(1)" } : undefined} priority />
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-semibold tracking-[-0.04em]" style={{ color: "var(--text-primary)" }}>{isSignup ? t.createAccount : t.accountSign}</p>
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{isSignup ? t.descSignup : t.descLogin}</p>
            </div>
            <div className="flex gap-2" aria-label="Language">
              {(["ko", "en", "ja"] as const).map((value) => <button type="button" key={value} onClick={() => setLocale(value)} className="h-7 w-7 rounded-md text-[10px] font-bold transition hover:bg-black/5" style={{ backgroundColor: locale === value ? "var(--bg-subtle)" : "transparent", color: locale === value ? "var(--text-primary)" : "var(--text-faint)" }}>{value.toUpperCase()}</button>)}
            </div>
          </div>
        </div>

        <div className="mb-7 grid grid-cols-2 rounded-xl p-1" style={{ backgroundColor: "var(--bg-subtle)" }}>
          {(["login", "signup"] as const).map((value) => <button type="button" key={value} onClick={() => switchMode(value)} className="rounded-lg py-2.5 text-xs font-semibold transition duration-200" style={{ backgroundColor: mode === value ? "var(--bg-card)" : "transparent", boxShadow: mode === value ? "0 1px 3px rgb(0 0 0 / 0.08)" : "none", color: mode === value ? "var(--text-primary)" : "var(--text-muted)" }}>{value === "login" ? t.signIn : t.register}</button>)}
        </div>

        {isSignup && <div className="mb-7 flex items-center gap-2" aria-label={`Step ${signupStep} of 2`}><span className="h-1.5 flex-1 rounded-full bg-brand-pink" /><span className="h-1.5 flex-1 rounded-full transition-colors duration-300" style={{ backgroundColor: signupStep === 2 ? "var(--color-brand-pink)" : "var(--border-default)" }} /></div>}
        {showLoginRequired && <p role="status" className="mb-6 flex items-center gap-3 rounded-xl border-l-4 px-4 py-3.5 text-sm font-semibold" style={{ backgroundColor: "color-mix(in srgb, var(--color-brand-pink) 10%, var(--bg-card))", borderColor: "var(--color-brand-pink)", color: "var(--text-primary)" }}><span aria-hidden className="grid h-5 w-5 place-items-center rounded-full bg-brand-pink text-[11px] text-black">!</span>{t.loginRequired}</p>}
        {error && <p role="alert" aria-live="polite" className="mb-5 rounded-xl px-4 py-3 text-xs" style={{ backgroundColor: "var(--color-error-subtle)", color: "var(--color-error)" }}>{error}</p>}

        <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-5">
          {(!isSignup || signupStep === 1) && <>
            <Input id="login-email" label={t.email} type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            {isSignup && <Input id="login-name" label={t.name} value={name} onChange={setName} placeholder={t.namePlaceholder} />}
          </>}
          {(!isSignup || signupStep === 2) && <Input id="login-password" label={t.password} type="password" value={password} onChange={setPassword} placeholder={t.passwordPlaceholder} autoComplete={isSignup ? "new-password" : "current-password"} />}
          <button type="submit" disabled={loading} className="w-full rounded-xl py-3.5 text-xs font-bold tracking-widest transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none" style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}>{loading ? t.processing : isSignup && signupStep === 1 ? nextLabel : isSignup ? t.register : t.signIn}</button>
        </form>

        {isSignup && signupStep === 2 && <button type="button" onClick={previousSignupStep} className="mt-4 text-xs font-semibold transition hover:text-brand-pink" style={{ color: "var(--text-muted)" }}>{backLabel}</button>}
        {!isSignup && <GoogleSignInButton loading={loading} label={t.googleSignIn} onClick={handleGoogleLogin} />}

        <p className="mt-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>{isSignup ? t.hasAccount : t.noAccount} <button type="button" onClick={() => switchMode(isSignup ? "login" : "signup")} className="font-semibold text-brand-pink hover:underline">{isSignup ? t.signIn : t.register}</button></p>
      </section>
    </main>
  );
}
