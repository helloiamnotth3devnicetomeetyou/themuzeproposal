"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "../app/context/LocaleContext";
import { useTheme } from "../app/context/ThemeContext";
import { Locale } from "../app/translations";
import { getUserProfile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type ArtistNavigationItem = {
  id: string;
  slug: string;
  name: string;
};

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Navbar() {
  const { locale, setLocale, t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [artists, setArtists] = useState<ArtistNavigationItem[]>([]);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const pathname = usePathname();
  const isDark = theme === "dark";
  const isAdminRoute = pathname.startsWith("/admin");

  // Scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { getSession, isAdmin: checkIsAdmin } = await import("@/lib/auth");
      const session = await getSession();
      setIsLoggedIn(!!session);
      if (session) {
        const admin = await checkIsAdmin();
        setIsAdmin(admin);
      } else {
        setIsAdmin(false);
      }
    };
    checkAuth();
  }, [pathname]);

  useEffect(() => {
    const loadArtists = async () => {
      const { data } = await supabase
        .from("artists")
        .select("id, slug, name")
        .order("name", { ascending: true });
      if (data) setArtists(data);
    };
    void loadArtists();
  }, []);

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `text-sm font-semibold tracking-widest transition-colors duration-300 relative group ${isActive ? "text-brand-pink" : "hover:text-brand-pink"
      }`;
  };

  const isAtHome = pathname === "/";

  return (
    <header
      style={
        isScrolled || !isAtHome
          ? { backgroundColor: "var(--nav-bg-scrolled)", backdropFilter: "blur(12px)" }
          : { background: "var(--nav-bg-gradient)" }
      }
      className={`${isAdminRoute ? "relative shrink-0" : "fixed top-0 left-0 right-0"} z-50 transition-all duration-500 ${isScrolled || !isAtHome ? "py-4" : "py-6"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="relative w-40 h-10 block transition-transform duration-300 hover:scale-105">
          <Image
            src="/images/logo.png"
            alt="THE MUZE Logo"
            fill
            sizes="160px"
            className="object-contain transition-all duration-300"
            style={isDark ? { filter: "invert(1)" } : {}}
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-10"
          style={{ color: "var(--text-secondary)" }}
        >
          <Link href="/about" className={getLinkClass("/about")}>
            {t.nav.about}
            <span className="absolute bottom-[-6px] left-0 w-0 h-[2px] bg-brand-pink transition-all duration-300 group-hover:w-full" />
          </Link>
          {artists.map((artist) => (
            <div
              key={artist.id}
              className="relative"
              onMouseEnter={() => setExpandedArtist(artist.slug)}
              onMouseLeave={() => setExpandedArtist(null)}
            >
              <button
                type="button"
                onFocus={() => setExpandedArtist(artist.slug)}
                className={`text-sm font-semibold tracking-widest transition-colors duration-300 ${expandedArtist === artist.slug || pathname?.startsWith(`/${artist.slug}/`) ? "text-brand-pink" : "hover:text-brand-pink"
                  }`}
                aria-expanded={expandedArtist === artist.slug}
              >
                {artist.name}
              </button>
              <div className={`absolute left-1/2 top-full z-50 w-44 -translate-x-1/2 pt-4 transition-all duration-200 ${expandedArtist === artist.slug ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}>
                <div className="rounded-xl border p-2 shadow-xl" style={{ backgroundColor: "var(--nav-bg-scrolled)", borderColor: "var(--border-default)", backdropFilter: "blur(16px)" }}>
                  <Link href={`/${artist.slug}/artist`} className="block rounded-lg px-3 py-2.5 text-xs font-bold tracking-widest hover:bg-white/10 hover:text-brand-pink">ABOUT</Link>
                  <Link href={`/${artist.slug}/discography`} className="block rounded-lg px-3 py-2.5 text-xs font-bold tracking-widest hover:bg-white/10 hover:text-brand-pink">DISCOGRAPHY</Link>
                  <Link href={`/${artist.slug}/notice`} className="block rounded-lg px-3 py-2.5 text-xs font-bold tracking-widest hover:bg-white/10 hover:text-brand-pink">NOTICE</Link>
                </div>
              </div>
            </div>
          ))}
          <Link href="/notice" className={getLinkClass("/notice")}>
            {t.nav.notice}
            <span className="absolute bottom-[-6px] left-0 w-0 h-[2px] bg-brand-pink transition-all duration-300 group-hover:w-full" />
          </Link>
        </nav>

        {/* Right Controls */}
        <div className="hidden md:flex items-center gap-4">
          {/* Language Selector */}
          <div
            className="flex p-1 rounded-full"
            style={{
              backgroundColor: "var(--lang-pill-bg)",
              border: "1px solid var(--lang-pill-border)",
            }}
          >
            {(["ko", "en", "ja"] as Locale[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang)}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-300 ${locale === lang
                    ? "bg-brand-pink text-black shadow-md"
                    : "hover:text-brand-pink"
                  }`}
                style={locale !== lang ? { color: "var(--lang-inactive-text)" } : {}}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-full transition-all duration-300 hover:scale-110 hover:text-brand-pink"
            style={{
              backgroundColor: "var(--lang-pill-bg)",
              border: "1px solid var(--lang-pill-border)",
              color: "var(--text-muted)",
            }}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {isAdmin && (
            <Link
              href="/admin"
              className="px-4 py-2 rounded-full text-xs font-black tracking-widest transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
            >
              STUDIO ↗
            </Link>
          )}

          {/* Login / Logout CTA */}
          {isLoggedIn ? (
            <button
              onClick={async () => {
                const { signOut } = await import("@/lib/auth");
                await signOut();
                setIsLoggedIn(false);
                setIsAdmin(false);
                window.location.reload();
              }}
              className="bg-brand-pink hover:bg-brand-pink/80 text-black px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 hover:scale-105 border border-white/10"
            >
              LOGOUT
            </button>
          ) : (
            <Link
              href="/login"
              className="bg-brand-green hover:bg-brand-green/80 text-white px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 hover:scale-105 border border-white/10"
            >
              LOGIN
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden focus:outline-none"
          style={{ color: "var(--text-primary)" }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden absolute top-full left-0 right-0 backdrop-blur-lg border-b py-6 px-6 flex flex-col gap-6"
          style={{
            backgroundColor: "var(--mobile-menu-bg)",
            borderColor: "var(--border-default)",
          }}
        >
          <nav className="flex flex-col gap-4" style={{ color: "var(--text-primary)" }}>
            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold hover:text-brand-pink transition-colors">
              {t.nav.about}
            </Link>
            {artists.map((artist) => (
              <div key={artist.id} className="flex flex-col gap-2">
                <p className="text-lg font-semibold tracking-wider">{artist.name}</p>
                <div className="ml-3 flex flex-col gap-2 border-l pl-4" style={{ borderColor: "var(--border-default)" }}>
                  {[
                    { href: `/${artist.slug}/artist`, label: "ABOUT" },
                    { href: `/${artist.slug}/discography`, label: "DISCOGRAPHY" },
                    { href: `/${artist.slug}/notice`, label: "NOTICE" },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-semibold tracking-wider hover:text-brand-pink transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Link href="/notice" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold tracking-wider hover:text-brand-pink transition-colors">
              {t.nav.notice}
            </Link>
          </nav>

          <div className="h-[1px] my-2" style={{ backgroundColor: "var(--border-default)" }} />

          <div className="flex justify-between items-center">
            <div
              className="flex p-1 rounded-full"
              style={{
                backgroundColor: "var(--lang-pill-bg)",
                border: "1px solid var(--lang-pill-border)",
              }}
            >
              {(["ko", "en", "ja"] as Locale[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLocale(lang);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-full ${locale === lang ? "bg-brand-pink text-black" : ""
                    }`}
                  style={locale !== lang ? { color: "var(--lang-inactive-text)" } : {}}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2 rounded-full transition-all duration-300 hover:text-brand-pink"
                style={{
                  backgroundColor: "var(--lang-pill-bg)",
                  border: "1px solid var(--lang-pill-border)",
                  color: "var(--text-muted)",
                }}
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-black tracking-widest"
                  style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
                >
                  STUDIO ↗
                </Link>
              )}

              {isLoggedIn ? (
                <button
                  onClick={async () => {
                    const { signOut } = await import("@/lib/auth");
                    await signOut();
                    setIsLoggedIn(false);
                    setIsAdmin(false);
                    setIsMobileMenuOpen(false);
                    window.location.reload();
                  }}
                  className="bg-brand-pink text-black px-5 py-2 rounded-full text-xs font-bold"
                >
                  LOGOUT
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-brand-green text-white px-5 py-2 rounded-full text-xs font-bold"
                >
                  LOGIN
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
