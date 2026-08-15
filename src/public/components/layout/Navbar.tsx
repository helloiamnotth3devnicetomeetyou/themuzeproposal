"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/core/providers/LocaleContext";
import { localizeText } from "@/core/i18n/localized";
import { useTheme } from "@/core/providers/ThemeContext";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import GlobalPlayer from "@/public/features/player/GlobalPlayer";
import type { ArtistNavigationItem, NavigationAccount } from "./navbar-types";
import styles from "@/styles/(public)/components/layout/Navbar.module.css";

export default function Navbar({
  initialArtists,
  initialAccount,
}: {
  initialArtists: ArtistNavigationItem[];
  initialAccount: NavigationAccount;
}) {
  const { locale, t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const [mobileOpenArtist, setMobileOpenArtist] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileNav, setIsMobileNav] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";
  const isDiscography = /^\/[^/]+\/discography\/?$/.test(pathname);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1279px)");
    const sync = () => {
      const mobile = media.matches;
      setIsMobileNav(mobile);
      if (!mobile) setIsMobileMenuOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    const refreshAccount = () => router.refresh();
    window.addEventListener("account-avatar-changed", refreshAccount);
    window.addEventListener("account-profile-changed", refreshAccount);
    return () => {
      window.removeEventListener("account-avatar-changed", refreshAccount);
      window.removeEventListener("account-profile-changed", refreshAccount);
    };
  }, [router]);
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const backgroundNodes = Array.from(
      document.querySelectorAll<HTMLElement>(".locale-shell > :not(header)"),
    );
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
    const focusFirst = requestAnimationFrame(() =>
      mobileMenuRef.current?.focus(),
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMobileMenuOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [
        menuButtonRef.current,
        ...Array.from(
          mobileMenuRef.current?.querySelectorAll<HTMLElement>(
            "a[href], button:not([disabled])",
          ) ?? [],
        ),
      ].filter((item): item is HTMLElement => Boolean(item));
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable.at(-1)?.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === focusable.at(-1)
      ) {
        event.preventDefault();
        focusable[0].focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusFirst);
      document.body.style.overflow = previousOverflow;
      previousStates.forEach(({ node, inert, ariaHidden }) => {
        node.inert = inert;
        if (ariaHidden === null) node.removeAttribute("aria-hidden");
        else node.setAttribute("aria-hidden", ariaHidden);
      });
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileMenuOpen]);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const scrolled = isScrolled || pathname !== "/" || isMobileMenuOpen;
  const localizedArtists = initialArtists.map((artist) => ({
    ...artist,
    name: localizeText(
      {
        ko: artist.name_ko || artist.name,
        en: artist.name_en || artist.eng_name,
        ja: artist.name_ja,
      },
      locale,
      artist.name,
    ),
  }));
  const shared = {
    artists: localizedArtists,
    pathname,
    isAdmin: initialAccount.isAdmin,
    isLoggedIn: initialAccount.isLoggedIn,
    authReady: true,
    accountAvatarUrl: initialAccount.avatarUrl,
    accountInitial: initialAccount.initial,
    accountName: initialAccount.name,
    isDark,
    t,
    onToggleTheme: toggleTheme,
  };
  return (
    <header
      className={`${pathname.startsWith("/admin") ? styles.headerAdmin : styles.header} ${scrolled ? styles.headerScrolled : styles.headerTransparent}`}
    >
      <div
        className={`${styles.container} ${isScrolled || pathname !== "/" ? styles.containerScrolled : ""}`}
      >
        {isMobileNav ? (
          <MobileNav
            {...shared}
            menuButtonRef={menuButtonRef}
            mobileMenuRef={mobileMenuRef}
            isOpen={isMobileMenuOpen}
            onToggle={() => setIsMobileMenuOpen((open) => !open)}
            onClose={closeMobileMenu}
            mobileOpenArtist={mobileOpenArtist}
            setMobileOpenArtist={setMobileOpenArtist}
            player={isDiscography ? null : <GlobalPlayer />}
          />
        ) : (
          <DesktopNav
            {...shared}
            expandedArtist={expandedArtist}
            setExpandedArtist={setExpandedArtist}
            player={isDiscography ? null : <GlobalPlayer />}
          />
        )}
      </div>
    </header>
  );
}
