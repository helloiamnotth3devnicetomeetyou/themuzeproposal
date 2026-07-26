import Image from "next/image";
import Link from "next/link";
import { LuChevronDown, LuLogIn, LuMoon, LuSun, LuUser } from "react-icons/lu";
import LanguageSwitcher from "./LanguageSwitcher";
import type { ArtistNavigationItem, NavTranslations } from "./navbar-types";
import styles from "@/styles/(public)/components/layout/Navbar.module.css";

type Props = {
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
  mobileMenuRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  artists: ArtistNavigationItem[];
  pathname: string;
  isAdmin: boolean;
  isLoggedIn: boolean;
  isDark: boolean;
  t: NavTranslations;
  mobileOpenArtist: string | null;
  setMobileOpenArtist: (slug: string | null) => void;
  onToggleTheme: () => void;
};

const links = (slug: string) => [
  { href: `/${slug}/artist`, label: "ABOUT" },
  { href: `/${slug}/discography`, label: "DISCOGRAPHY" },
  { href: `/${slug}/schedule`, label: "SCHEDULE" },
  { href: `/${slug}/notice`, label: "NOTICE" },
];

export default function MobileNav({
  menuButtonRef, mobileMenuRef, isOpen, onToggle, onClose, artists, pathname,
  isAdmin, isLoggedIn, isDark, t, mobileOpenArtist, setMobileOpenArtist, onToggleTheme,
}: Props) {
  const mobileLinkClass = (path: string) =>
    `flex min-h-14 items-center border-b border-[var(--border-default)] font-display text-[15px] font-bold tracking-[0.08em] transition-colors ${pathname === path ? "text-brand-pink" : "hover:text-brand-pink"}`;

  return <div className="flex w-full items-center md:hidden">
    <Link href="/" onClick={onClose} className="relative block size-10 shrink-0">
      <Image src="/images/iconlogo.png" alt="THE MUZE" fill sizes="40px" priority className={`${styles.logoImage} ${isDark ? styles.logoDark : ""}`} />
    </Link>
    <div className="ml-auto flex items-center gap-2">
      {isOpen && <>
        <LanguageSwitcher />
        <button type="button" onClick={onToggleTheme} aria-label={isDark ? t.common.lightMode : t.common.darkMode} className={styles.themeToggleBtn}>
          <div className={`${styles.themeToggleThumb} ${isDark ? styles.themeToggleThumbDark : ""}`}>{isDark ? <LuMoon size={13} /> : <LuSun size={13} />}</div>
          <div className={styles.themeToggleIcons}><LuSun size={12} className={!isDark ? "opacity-0" : "opacity-60"} /><LuMoon size={12} className={isDark ? "opacity-0" : "opacity-60"} /></div>
        </button>
        <Link href={isLoggedIn ? "/account" : "/login"} onClick={onClose} className={`${styles.accountBtn} ${isLoggedIn ? styles.accountBtnLoggedIn : styles.accountBtnLoggedOut}`} title={isLoggedIn ? "ACCOUNT" : "LOGIN"}>
          {isLoggedIn ? <LuUser className={styles.accountBtnIcon} /> : <LuLogIn className={styles.accountBtnIcon} />}
        </Link>
      </>}
      <button ref={menuButtonRef} type="button" onClick={onToggle} aria-label={isOpen ? t.common.closeMenu : t.common.openMenu} aria-expanded={isOpen} aria-controls="mobile-menu" className="grid size-9 place-items-center text-[var(--text-primary)]">
        <span className="relative block h-4 w-5" aria-hidden="true">
          <span className={`absolute left-0 top-1/2 h-px w-5 bg-current transition-transform duration-base ${isOpen ? "rotate-45" : "-translate-y-1.5"}`} />
          <span className={`absolute left-0 top-1/2 h-px bg-current transition-all duration-base ${isOpen ? "w-5 -rotate-45" : "w-3 translate-y-1.5"}`} />
        </span>
      </button>
    </div>
    {isOpen && <div ref={mobileMenuRef} id="mobile-menu" role="dialog" tabIndex={-1} aria-modal="true" aria-label={t.common.mobileMenu} className={styles.mobileMenu}>
      <div className="flex min-h-full flex-col px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-5">
        <nav aria-label={t.common.mainMenu} className="text-[var(--text-primary)]">
          <Link href="/about" onClick={onClose} className={mobileLinkClass("/about")}>{t.nav.about}</Link>
          {(artists || []).map((artist) => {
            const open = mobileOpenArtist === artist.slug;
            return <div key={artist.id} className={styles.mobileArtistAccordion}>
              <button type="button" onClick={() => setMobileOpenArtist(open ? null : artist.slug)} className={styles.mobileArtistTrigger}>
                <span className="inline-flex items-center gap-2">
                  <span className={styles.artistLogoBadge}>
                    {artist.logo_url ? <Image src={artist.logo_url} alt="" width={16} height={16} unoptimized={/\.svg(?:$|\?)/i.test(artist.logo_url)} className={/\.svg(?:$|\?)/i.test(artist.logo_url) ? "is-theme-svg" : undefined} /> : <i />}
                  </span>
                  {artist.name}
                </span>
                <LuChevronDown className={`${styles.mobileArtistChevron} ${open ? styles.mobileArtistChevronOpen : ""}`} />
              </button>
              {open && <div className={styles.mobileArtistSublist}>
                {links(artist.slug).map(({ href, label }) => <Link key={href} href={href} onClick={onClose} className={`flex min-h-10 items-center font-display text-xs font-bold tracking-[0.1em] transition-colors hover:text-brand-pink ${pathname === href ? "text-brand-pink" : "text-[var(--text-secondary)]"}`}>{label}</Link>)}
              </div>}
            </div>;
          })}
          <Link href="/notice" onClick={onClose} className={mobileLinkClass("/notice")}>{t.nav.notice}</Link>
          <Link href="/protect" onClick={onClose} className={mobileLinkClass("/protect")}>PROTECT</Link>
          {isAdmin && <Link href="/admin" onClick={onClose} className={mobileLinkClass("/admin")}>ADMIN</Link>}
        </nav>
      </div>
    </div>}
  </div>;
}
