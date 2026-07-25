"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuMoon, LuSun, LuUser, LuLogIn, LuChevronDown } from "react-icons/lu";
import { useLocale } from "../app/context/LocaleContext";
import { useTheme } from "../app/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { ARTISTS_CHANGED_EVENT } from "@/lib/artist-events";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";
import styles from "./Navbar.module.css";

type ArtistNavigationItem = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
};

export default function Navbar() {
  const { t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [artists, setArtists] = useState<ArtistNavigationItem[]>([]);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const [mobileOpenArtist, setMobileOpenArtist] = useState<string | null>(null);
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
      const { getUser, isAdmin: checkIsAdmin } = await import("@/lib/auth");
      const user = await getUser();
      setIsLoggedIn(Boolean(user));
      setIsAdmin(user ? await checkIsAdmin() : false);
    };
    void checkAuth();
  }, [pathname]);

  useEffect(() => {
    let active = true;
    const loadArtists = async () => {
      const { data } = await supabase.from("artists").select("id, slug, name, logo_url").order("name", { ascending: true });
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
    const backgroundNodes = Array.from(document.querySelectorAll<HTMLElement>(".locale-shell > :not(header)"));
    const previousStates = backgroundNodes.map((node) => ({
      node,
      inert: node.inert,
      ariaHidden: node.getAttribute("aria-hidden"),
    }));

    document.body.style.overflow = "hidden";
    backgroundNodes.forEach((node) => {
      node.inert = true;
      node.setAttribute("aria-hidden", "true");
    });

    const focusFirstItem = requestAnimationFrame(() => {
      mobileMenuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMobileMenuOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = [
        menuButtonRef.current,
        ...Array.from(mobileMenuRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []),
      ].filter((item): item is HTMLElement => Boolean(item));
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFirstItem);
      document.body.style.overflow = previousOverflow;
      previousStates.forEach(({ node, inert, ariaHidden }) => {
        node.inert = inert;
        if (ariaHidden === null) node.removeAttribute("aria-hidden");
        else node.setAttribute("aria-hidden", ariaHidden);
      });
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const isActive = (path: string) => pathname === path;
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const isAtHome = pathname === "/";
  const isScrolledOrNotHome = isScrolled || !isAtHome || isMobileMenuOpen;

  /* ─── helper class generators ────────────────────────────────────────── */
  const navLinkClass = (path: string) =>
    `${styles.navLink} ${isActive(path) ? styles.navLinkActive : ""}`;

  const mobileLinkClass = (path: string) =>
    `flex min-h-14 items-center border-b border-[var(--border-default)] font-display text-[15px] font-bold tracking-[0.08em] transition-colors ${
      isActive(path) ? "text-brand-pink" : "hover:text-brand-pink"
    }`;

  return (
    <header
      className={`${isAdminRoute ? styles.headerAdmin : styles.header} ${
        isScrolledOrNotHome ? styles.headerScrolled : styles.headerTransparent
      }`}
    >
      <div
        className={`${styles.container} ${
          isScrolled || !isAtHome ? styles.containerScrolled : ""
        }`}
      >
        {/* ── Logo ──────────────────────────────────────────────────── */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="relative block h-10 w-36 shrink-0 transition-opacity duration-200 hover:opacity-75 md:w-40"
        >
          <Image
            src="/images/logo.png"
            alt="THE MUZE Logo"
            fill
            sizes="160px"
            className={`${styles.logoImage} ${isDark ? styles.logoDark : ""}`}
            priority
          />
        </Link>

        {/* ── Desktop nav ───────────────────────────────────────────── */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/about" className={navLinkClass("/about")}>
            {t.nav.about}
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
                className={`${styles.navLink} ${
                  expandedArtist === artist.slug || pathname.startsWith(`/${artist.slug}/`)
                    ? styles.navLinkActive
                    : ""
                }`}
                aria-expanded={expandedArtist === artist.slug}
              >
                <span className={styles.artistLogoBadge}>
                  {artist.logo_url ? (
                    <Image
                      src={artist.logo_url}
                      alt=""
                      width={16}
                      height={16}
                      unoptimized={/\.svg(?:$|\?)/i.test(artist.logo_url)}
                      className={/\.svg(?:$|\?)/i.test(artist.logo_url) ? "is-theme-svg" : undefined}
                    />
                  ) : (
                    <i />
                  )}
                </span>
                {artist.name}
              </button>

              {/* Dropdown */}
              <div
                className={`absolute left-1/2 top-full z-50 w-44 -translate-x-1/2 pt-2 transition-all duration-200 ${
                  expandedArtist === artist.slug
                    ? "visible translate-y-0 opacity-100"
                    : "invisible -translate-y-1 opacity-0"
                }`}
              >
                <div className={styles.dropdownCard}>
                  {[
                    { href: `/${artist.slug}/artist`, label: "ABOUT" },
                    { href: `/${artist.slug}/discography`, label: "DISCOGRAPHY" },
                    { href: `/${artist.slug}/schedule`, label: "SCHEDULE" },
                    { href: `/${artist.slug}/notice`, label: "NOTICE" },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`${styles.dropdownItem} ${
                        pathname === href ? styles.dropdownItemActive : ""
                      }`}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <Link href="/notice" className={navLinkClass("/notice")}>
            {t.nav.notice}
          </Link>
          <Link href="/protect" className={navLinkClass("/protect")}>
            PROTECT
          </Link>
          {isAdmin && (
            <Link href="/admin" className={navLinkClass("/admin")}>
              ADMIN
            </Link>
          )}
        </nav>

        {/* ── Desktop right utilities ───────────────────────────────── */}
        <div className={styles.utilityGroup}>
          <LanguageSwitcher />

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
            className={styles.themeToggleBtn}
          >
            <div
              className={`${styles.themeToggleThumb} ${
                isDark ? styles.themeToggleThumbDark : ""
              }`}
            >
              {isDark ? <LuMoon size={13} /> : <LuSun size={13} />}
            </div>
            <div className={styles.themeToggleIcons}>
              <LuSun size={12} className={!isDark ? "opacity-0" : "opacity-60 transition-opacity duration-300"} />
              <LuMoon size={12} className={isDark ? "opacity-0" : "opacity-60 transition-opacity duration-300"} />
            </div>
          </button>

          {/* Account / Login — styled pill button with Lucide Icons */}
          <Link
            href={isLoggedIn ? "/account" : "/login"}
            className={`${styles.accountBtn} ${
              isLoggedIn ? styles.accountBtnLoggedIn : styles.accountBtnLoggedOut
            }`}
          >
            {isLoggedIn ? (
              <>
                <LuUser className={styles.accountBtnIcon} />
                <span>ACCOUNT</span>
              </>
            ) : (
              <>
                <LuLogIn className={styles.accountBtnIcon} />
                <span>LOGIN</span>
              </>
            )}
          </Link>
        </div>

        {/* ── Mobile right utilities & hamburger ────────────────────── */}
        <div className="flex items-center gap-2 md:hidden">
          {isMobileMenuOpen && (
            <>
              <LanguageSwitcher />

              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
                className={styles.themeToggleBtn}
              >
                <div
                  className={`${styles.themeToggleThumb} ${
                    isDark ? styles.themeToggleThumbDark : ""
                  }`}
                >
                  {isDark ? <LuMoon size={13} /> : <LuSun size={13} />}
                </div>
                <div className={styles.themeToggleIcons}>
                  <LuSun size={12} className={!isDark ? "opacity-0" : "opacity-60"} />
                  <LuMoon size={12} className={isDark ? "opacity-0" : "opacity-60"} />
                </div>
              </button>

              {/* Account / Login */}
              <Link
                href={isLoggedIn ? "/account" : "/login"}
                onClick={closeMobileMenu}
                className={`${styles.accountBtn} ${
                  isLoggedIn ? styles.accountBtnLoggedIn : styles.accountBtnLoggedOut
                }`}
                title={isLoggedIn ? "ACCOUNT" : "LOGIN"}
              >
                {isLoggedIn ? (
                  <LuUser className={styles.accountBtnIcon} />
                ) : (
                  <LuLogIn className={styles.accountBtnIcon} />
                )}
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            className="grid size-9 place-items-center text-[var(--text-primary)]"
          >
            <span className="sr-only">{isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}</span>
            <span className="relative block h-4 w-5" aria-hidden="true">
              <span
                className={`absolute left-0 top-1/2 h-px w-5 bg-current transition-transform duration-200 ${
                  isMobileMenuOpen ? "rotate-45" : "-translate-y-1.5"
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 h-px bg-current transition-all duration-200 ${
                  isMobileMenuOpen ? "w-5 -rotate-45" : "w-3 translate-y-1.5"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* ── Mobile menu ───────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <MobileMenu
          mobileMenuRef={mobileMenuRef}
          closeMobileMenu={closeMobileMenu}
          mobileLinkClass={mobileLinkClass}
          artists={artists}
          mobileOpenArtist={mobileOpenArtist}
          setMobileOpenArtist={setMobileOpenArtist}
          pathname={pathname}
          isAdmin={isAdmin}
          t={t}
        />
      )}
    </header>
  );
}
