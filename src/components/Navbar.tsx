"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuMoon, LuSun } from "react-icons/lu";
import { useLocale } from "../app/context/LocaleContext";
import { useTheme } from "../app/context/ThemeContext";
import { Locale } from "../app/translations";
import { supabase } from "@/lib/supabase";
import { ARTISTS_CHANGED_EVENT } from "@/lib/artist-events";

type ArtistNavigationItem = {
  id: string;
  slug: string;
  name: string;
};

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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { getSession, isAdmin: checkIsAdmin } = await import("@/lib/auth");
      const session = await getSession();
      setIsLoggedIn(Boolean(session));
      setIsAdmin(session ? await checkIsAdmin() : false);
    };
    void checkAuth();
  }, [pathname]);

  useEffect(() => {
    let active = true;
    const loadArtists = async () => {
      const { data } = await supabase.from("artists").select("id, slug, name").order("name", { ascending: true });
      if (active && data) setArtists(data);
    };
    void loadArtists();
    const refreshArtists = () => void loadArtists();
    window.addEventListener(ARTISTS_CHANGED_EVENT, refreshArtists);
    return () => {
      active = false;
      window.removeEventListener(ARTISTS_CHANGED_EVENT, refreshArtists);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileMenuOpen]);

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `text-sm font-semibold tracking-widest transition-colors duration-300 relative group ${isActive ? "text-brand-pink" : "hover:text-brand-pink"}`;
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const mobileLinkClass = (path: string) => `block border-b py-4 text-[17px] font-semibold tracking-[0.08em] transition-colors ${pathname === path ? "text-brand-pink" : "hover:text-brand-pink"}`;
  const isAtHome = pathname === "/";

  return (
      <header
        style={
          isScrolled || !isAtHome || isMobileMenuOpen
            ? { backgroundColor: "var(--nav-bg-scrolled)", backdropFilter: "blur(12px)" }
            : { background: "var(--nav-bg-gradient)" }
        }
        className={`${isAdminRoute ? "relative shrink-0" : "fixed top-0 left-0 right-0"} z-50 py-4 transition-all duration-500 ${isScrolled || !isAtHome ? "md:py-4" : "md:py-6"}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <Link href="/" onClick={closeMobileMenu} className="relative block h-10 w-36 transition-transform duration-300 hover:scale-105 md:w-40">
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

          <nav className="hidden items-center gap-10 md:flex" style={{ color: "var(--text-secondary)" }}>
            <Link href="/about" className={getLinkClass("/about")}>
              {t.nav.about}
              <span className="absolute bottom-[-6px] left-0 h-[2px] w-0 bg-brand-pink transition-all duration-300 group-hover:w-full" />
            </Link>
            {artists.map((artist) => (
              <div key={artist.id} className="relative" onMouseEnter={() => setExpandedArtist(artist.slug)} onMouseLeave={() => setExpandedArtist(null)}>
                <button
                  type="button"
                  onFocus={() => setExpandedArtist(artist.slug)}
                  className={`text-sm font-semibold tracking-widest transition-colors duration-300 ${expandedArtist === artist.slug || pathname.startsWith(`/${artist.slug}/`) ? "text-brand-pink" : "hover:text-brand-pink"}`}
                  aria-expanded={expandedArtist === artist.slug}
                >
                  {artist.name}
                </button>
                <div className={`absolute left-1/2 top-full z-50 w-44 -translate-x-1/2 pt-4 transition-all duration-200 ${expandedArtist === artist.slug ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}>
                  <div className="rounded-xl border p-2 shadow-xl" style={{ backgroundColor: "var(--nav-bg-scrolled)", borderColor: "var(--border-default)", backdropFilter: "blur(16px)" }}>
                    <Link href={`/${artist.slug}/artist`} className="block rounded-lg px-3 py-2.5 text-xs font-bold tracking-widest hover:bg-white/10 hover:text-brand-pink">ABOUT</Link>
                    <Link href={`/${artist.slug}/discography`} className="block rounded-lg px-3 py-2.5 text-xs font-bold tracking-widest hover:bg-white/10 hover:text-brand-pink">DISCOGRAPHY</Link>
                    <Link href={`/${artist.slug}/schedule`} className="block rounded-lg px-3 py-2.5 text-xs font-bold tracking-widest hover:bg-white/10 hover:text-brand-pink">SCHEDULE</Link>
                    <Link href={`/${artist.slug}/notice`} className="block rounded-lg px-3 py-2.5 text-xs font-bold tracking-widest hover:bg-white/10 hover:text-brand-pink">NOTICE</Link>
                  </div>
                </div>
              </div>
            ))}
            <Link href="/notice" className={getLinkClass("/notice")}>
              {t.nav.notice}
              <span className="absolute bottom-[-6px] left-0 h-[2px] w-0 bg-brand-pink transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/protect" className={getLinkClass("/protect")}>
              PROTECT
              <span className="absolute bottom-[-6px] left-0 h-[2px] w-0 bg-brand-pink transition-all duration-300 group-hover:w-full" />
            </Link>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <div className="flex rounded-full p-1" style={{ backgroundColor: "var(--lang-pill-bg)", border: "1px solid var(--lang-pill-border)" }}>
              {(["ko", "en", "ja"] as Locale[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLocale(lang)}
                  aria-pressed={locale === lang}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all duration-300 ${locale === lang ? "bg-brand-pink text-black shadow-md" : "hover:text-brand-pink"}`}
                  style={locale !== lang ? { color: "var(--lang-inactive-text)" } : {}}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
              className="rounded-full p-2 transition-all duration-300 hover:scale-110 hover:text-brand-pink"
              style={{ backgroundColor: "var(--lang-pill-bg)", border: "1px solid var(--lang-pill-border)", color: "var(--text-muted)" }}
            >
              {isDark ? <LuSun size={16} aria-hidden="true" /> : <LuMoon size={16} aria-hidden="true" />}
            </button>

            {isAdmin && (
              <Link href="/admin" className="rounded-full px-4 py-2 text-xs font-black tracking-widest transition-all duration-300 hover:scale-105" style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}>
                ADMIN
              </Link>
            )}

            <Link
              href={isLoggedIn ? "/account" : "/login"}
              className={`${isLoggedIn ? "bg-brand-pink text-black" : "bg-brand-green text-white"} rounded-full border border-white/10 px-5 py-2 text-xs font-bold transition-all duration-300 hover:scale-105`}
            >
              {isLoggedIn ? "ACCOUNT" : "LOGIN"}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            className="grid size-11 place-items-center md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-pink"
            style={{ color: "var(--text-primary)" }}
          >
            <span className="sr-only">{isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}</span>
            <span className="relative block h-4 w-6" aria-hidden="true">
              <span className={`absolute left-0 top-1/2 h-px w-6 bg-current transition-transform duration-200 ${isMobileMenuOpen ? "rotate-45" : "-translate-y-1.5"}`} />
              <span className={`absolute left-0 top-1/2 h-px bg-current transition-all duration-200 ${isMobileMenuOpen ? "w-6 -rotate-45" : "w-4 translate-y-1.5"}`} />
            </span>
          </button>
        </div>

        {isMobileMenuOpen && (
          <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="전체 메뉴" className="absolute inset-x-0 top-full h-[calc(100dvh-72px)] overflow-y-auto border-t md:hidden" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
            <div className="flex min-h-full flex-col px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-5">
              <nav aria-label="모바일 주 메뉴" style={{ color: "var(--text-primary)" }}>
                <Link href="/about" onClick={closeMobileMenu} className={mobileLinkClass("/about")} style={{ borderColor: "var(--border-default)" }}>{t.nav.about}</Link>
                {artists.map((artist) => (
                  <div key={artist.id} className="border-b py-4" style={{ borderColor: "var(--border-default)" }}>
                    <p className="mb-3 text-[11px] font-bold tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>{artist.name}</p>
                    <div className="flex flex-col gap-3 pl-3 text-[15px] font-semibold tracking-[0.06em]">
                      <Link href={`/${artist.slug}/artist`} onClick={closeMobileMenu} className={pathname === `/${artist.slug}/artist` ? "text-brand-pink" : ""}>ABOUT</Link>
                      <Link href={`/${artist.slug}/discography`} onClick={closeMobileMenu} className={pathname === `/${artist.slug}/discography` ? "text-brand-pink" : ""}>DISCOGRAPHY</Link>
                      <Link href={`/${artist.slug}/schedule`} onClick={closeMobileMenu} className={pathname === `/${artist.slug}/schedule` ? "text-brand-pink" : ""}>SCHEDULE</Link>
                      <Link href={`/${artist.slug}/notice`} onClick={closeMobileMenu} className={pathname === `/${artist.slug}/notice` ? "text-brand-pink" : ""}>NOTICE</Link>
                    </div>
                  </div>
                ))}
                <Link href="/notice" onClick={closeMobileMenu} className={mobileLinkClass("/notice")} style={{ borderColor: "var(--border-default)" }}>{t.nav.notice}</Link>
                <Link href="/protect" onClick={closeMobileMenu} className={mobileLinkClass("/protect")} style={{ borderColor: "var(--border-default)" }}>PROTECT</Link>
              </nav>

              <div className="mt-auto flex items-center justify-between border-t pt-5" style={{ borderColor: "var(--border-default)" }}>
                <div className="flex gap-5">
                  {(["ko", "en", "ja"] as Locale[]).map((lang) => (
                    <button key={lang} type="button" onClick={() => setLocale(lang)} aria-pressed={locale === lang} className={`text-[11px] font-bold tracking-wider ${locale === lang ? "text-brand-pink" : ""}`}>{lang.toUpperCase()}</button>
                  ))}
                </div>
                <Link href={isLoggedIn ? "/account" : "/login"} onClick={closeMobileMenu} className="text-[11px] font-bold tracking-[0.12em]">{isLoggedIn ? "ACCOUNT" : "LOGIN"}</Link>
              </div>
            </div>
          </div>
        )}
      </header>
  );
}
