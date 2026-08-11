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
  const [authReady, setAuthReady] = useState(false);
  const [accountAvatarUrl, setAccountAvatarUrl] = useState<string | null>(null);
  const [accountInitial, setAccountInitial] = useState("A");
  const [accountName, setAccountName] = useState("관리자");
  const [artists, setArtists] = useState<ArtistNavigationItem[]>(initialArtists || []);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const [mobileOpenArtist, setMobileOpenArtist] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  useEffect(() => { const onScroll = () => setIsScrolled(window.scrollY > 50); onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
  useEffect(() => {
    let active = true;
    const loadAccount = async () => {
      setAuthReady(false);
      const { supabase } = await import("@/core/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!active) return;
      setIsLoggedIn(Boolean(user));
      setAccountAvatarUrl(null);
      const fallbackName = user?.user_metadata?.name?.trim() || user?.email?.split("@")[0] || "관리자";
      setAccountName(fallbackName);
      setAccountInitial((fallbackName[0] || "A").toUpperCase());
      if (!user) {
        setIsAdmin(false);
        setAuthReady(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role,name,avatar_asset_id")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      setIsAdmin(profile?.role === "super_admin" || profile?.role === "editor");
      const profileName = profile?.name?.trim() || fallbackName;
      setAccountName(profileName);
      setAccountInitial((profileName[0] || "A").toUpperCase());
      const avatarAssetId = profile?.avatar_asset_id;
      const avatarResult = avatarAssetId
        ? await supabase.from("avatar_assets").select("image_path").eq("id", avatarAssetId).eq("is_active", true).maybeSingle()
        : null;
      if (!active) return;
      if (avatarResult?.data?.image_path) {
        setAccountAvatarUrl(supabase.storage.from("artist-assets").getPublicUrl(avatarResult.data.image_path).data.publicUrl);
      }
      setAuthReady(true);
    };
    void loadAccount();
    window.addEventListener("account-avatar-changed", loadAccount);
    window.addEventListener("account-profile-changed", loadAccount);
    return () => { active = false; window.removeEventListener("account-avatar-changed", loadAccount); window.removeEventListener("account-profile-changed", loadAccount); };
  }, []);
  useEffect(() => { let active = true; const load = async () => { const { supabase } = await import("@/core/supabase/client"); const { data } = await supabase.from("artists").select("id, slug, name, eng_name, name_ko, name_en, name_ja, logo_url").eq("is_active", true).order("name", { ascending: true }); if (active && data) setArtists(data); }; if (!initialArtists?.length) void load(); window.addEventListener(ARTISTS_CHANGED_EVENT, load); return () => { active = false; window.removeEventListener(ARTISTS_CHANGED_EVENT, load); }; }, [initialArtists?.length]);
  useEffect(() => { if (!isMobileMenuOpen) return; const previousOverflow = document.body.style.overflow; const backgroundNodes = Array.from(document.querySelectorAll<HTMLElement>(".locale-shell > :not(header)")); const previousStates = backgroundNodes.map((node) => ({ node, inert: node.inert, ariaHidden: node.getAttribute("aria-hidden") })); document.body.style.overflow = "hidden"; backgroundNodes.forEach((node) => { node.inert = true; node.setAttribute("aria-hidden", "true"); }); const focusFirst = requestAnimationFrame(() => mobileMenuRef.current?.focus()); const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); setIsMobileMenuOpen(false); requestAnimationFrame(() => menuButtonRef.current?.focus()); return; } if (event.key !== "Tab") return; const focusable = [menuButtonRef.current, ...Array.from(mobileMenuRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [])].filter((item): item is HTMLElement => Boolean(item)); if (!focusable.length) return; if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus(); } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); } }; window.addEventListener("keydown", onKeyDown); return () => { cancelAnimationFrame(focusFirst); document.body.style.overflow = previousOverflow; previousStates.forEach(({ node, inert, ariaHidden }) => { node.inert = inert; if (ariaHidden === null) node.removeAttribute("aria-hidden"); else node.setAttribute("aria-hidden", ariaHidden); }); window.removeEventListener("keydown", onKeyDown); }; }, [isMobileMenuOpen]);
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
  const shared = { artists: localizedArtists, pathname, isAdmin, isLoggedIn, authReady, accountAvatarUrl, accountInitial, accountName, isDark, t, onToggleTheme: toggleTheme };
  return <header className={`${pathname.startsWith("/admin") ? styles.headerAdmin : styles.header} ${scrolled ? styles.headerScrolled : styles.headerTransparent}`}><div className={`${styles.container} ${isScrolled || pathname !== "/" ? styles.containerScrolled : ""}`}><DesktopNav {...shared} expandedArtist={expandedArtist} setExpandedArtist={setExpandedArtist} /><MobileNav {...shared} menuButtonRef={menuButtonRef} mobileMenuRef={mobileMenuRef} isOpen={isMobileMenuOpen} onToggle={() => setIsMobileMenuOpen((open) => !open)} onClose={closeMobileMenu} mobileOpenArtist={mobileOpenArtist} setMobileOpenArtist={setMobileOpenArtist} /></div></header>;
}
