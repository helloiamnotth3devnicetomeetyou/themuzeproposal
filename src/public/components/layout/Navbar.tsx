"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/core/providers/LocaleContext";
import { localizeText } from "@/core/i18n/localized";
import { useTheme } from "@/core/providers/ThemeContext";
import { ARTISTS_CHANGED_EVENT } from "@/core/utils/artist-events";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import type { ArtistNavigationItem } from "./navbar-types";
import styles from "@/styles/(public)/components/layout/Navbar.module.css";

export default function Navbar({ initialArtists = [] }: { initialArtists?: ArtistNavigationItem[] }) {
  const { locale, t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [artists, setArtists] = useState<ArtistNavigationItem[]>(initialArtists || []);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const [mobileOpenArtist, setMobileOpenArtist] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  useEffect(() => { const onScroll = () => setIsScrolled(window.scrollY > 50); onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
  useEffect(() => { void (async () => { const { getUser, isAdmin: checkIsAdmin } = await import("@/core/auth/auth"); const user = await getUser(); setIsLoggedIn(Boolean(user)); setIsAdmin(user ? await checkIsAdmin() : false); })(); }, [pathname]);
  useEffect(() => { let active = true; const load = async () => { const { supabase } = await import("@/core/supabase/client"); const { data } = await supabase.from("artists").select("id, slug, name, eng_name, name_ko, name_en, name_ja, logo_url").eq("is_active", true).order("name", { ascending: true }); if (active && data) setArtists(data); }; if (!initialArtists?.length) void load(); window.addEventListener(ARTISTS_CHANGED_EVENT, load); return () => { active = false; window.removeEventListener(ARTISTS_CHANGED_EVENT, load); }; }, [initialArtists?.length]);
  useEffect(() => { if (!isMobileMenuOpen) return; const previousOverflow = document.body.style.overflow; const backgroundNodes = Array.from(document.querySelectorAll<HTMLElement>(".locale-shell > :not(header)")); const previousStates = backgroundNodes.map((node) => ({ node, inert: node.inert, ariaHidden: node.getAttribute("aria-hidden") })); document.body.style.overflow = "hidden"; backgroundNodes.forEach((node) => { node.inert = true; node.setAttribute("aria-hidden", "true"); }); const focusFirst = requestAnimationFrame(() => mobileMenuRef.current?.querySelector<HTMLElement>("a, button")?.focus()); const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); setIsMobileMenuOpen(false); requestAnimationFrame(() => menuButtonRef.current?.focus()); return; } if (event.key !== "Tab") return; const focusable = [menuButtonRef.current, ...Array.from(mobileMenuRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [])].filter((item): item is HTMLElement => Boolean(item)); if (!focusable.length) return; if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus(); } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); } }; window.addEventListener("keydown", onKeyDown); return () => { cancelAnimationFrame(focusFirst); document.body.style.overflow = previousOverflow; previousStates.forEach(({ node, inert, ariaHidden }) => { node.inert = inert; if (ariaHidden === null) node.removeAttribute("aria-hidden"); else node.setAttribute("aria-hidden", ariaHidden); }); window.removeEventListener("keydown", onKeyDown); }; }, [isMobileMenuOpen]);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const scrolled = isScrolled || pathname !== "/" || isMobileMenuOpen;
  const localizedArtists = artists.map((artist) => ({
    ...artist,
    name: localizeText({
      ko: artist.name_ko || artist.name,
      en: artist.name_en || artist.eng_name,
      ja: artist.name_ja,
    }, locale, artist.name),
  }));
  const shared = { artists: localizedArtists, pathname, isAdmin, isLoggedIn, isDark, t, onToggleTheme: toggleTheme };
  return <header className={`${pathname.startsWith("/admin") ? styles.headerAdmin : styles.header} ${scrolled ? styles.headerScrolled : styles.headerTransparent}`}><div className={`${styles.container} ${isScrolled || pathname !== "/" ? styles.containerScrolled : ""}`}><DesktopNav {...shared} expandedArtist={expandedArtist} setExpandedArtist={setExpandedArtist} /><MobileNav {...shared} menuButtonRef={menuButtonRef} mobileMenuRef={mobileMenuRef} isOpen={isMobileMenuOpen} onToggle={() => setIsMobileMenuOpen((open) => !open)} onClose={closeMobileMenu} mobileOpenArtist={mobileOpenArtist} setMobileOpenArtist={setMobileOpenArtist} /></div></header>;
}
