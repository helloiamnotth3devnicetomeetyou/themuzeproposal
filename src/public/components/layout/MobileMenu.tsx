"use client";

import Image from "next/image";
import Link from "next/link";
import { LuChevronDown } from "react-icons/lu";
import styles from "@/styles/(public)/components/layout/Navbar.module.css";

type ArtistNavigationItem = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
};

interface MobileMenuProps {
  mobileMenuRef: React.RefObject<HTMLDivElement | null>;
  closeMobileMenu: () => void;
  mobileLinkClass: (path: string) => string;
  artists: ArtistNavigationItem[];
  mobileOpenArtist: string | null;
  setMobileOpenArtist: React.Dispatch<React.SetStateAction<string | null>>;
  pathname: string;
  isAdmin: boolean;
  t: { nav: { about: string; notice: string } };
}

export default function MobileMenu({
  mobileMenuRef,
  closeMobileMenu,
  mobileLinkClass,
  artists,
  mobileOpenArtist,
  setMobileOpenArtist,
  pathname,
  isAdmin,
  t,
}: MobileMenuProps) {
  return (
    <div
      ref={mobileMenuRef}
      id="mobile-menu"
      role="dialog"
      tabIndex={-1}
      aria-modal="true"
      aria-label="전체 메뉴"
      className={styles.mobileMenu}
    >
      <div className="flex min-h-full flex-col px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-5">
        <nav aria-label="모바일 주 메뉴" className="text-[var(--text-primary)]">
          <Link href="/about" onClick={closeMobileMenu} className={mobileLinkClass("/about")}>
            {t.nav.about}
          </Link>

          {artists.map((artist) => {
            const isOpen = mobileOpenArtist === artist.slug;
            return (
              <div key={artist.id} className={styles.mobileArtistAccordion}>
                <button
                  type="button"
                  onClick={() => setMobileOpenArtist(isOpen ? null : artist.slug)}
                  className={styles.mobileArtistTrigger}
                >
                  <span className="inline-flex items-center gap-2">
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
                  </span>
                  <LuChevronDown
                    className={`${styles.mobileArtistChevron} ${
                      isOpen ? styles.mobileArtistChevronOpen : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className={styles.mobileArtistSublist}>
                    {[
                      { href: `/${artist.slug}/artist`, label: "ABOUT" },
                      { href: `/${artist.slug}/discography`, label: "DISCOGRAPHY" },
                      { href: `/${artist.slug}/schedule`, label: "SCHEDULE" },
                      { href: `/${artist.slug}/notice`, label: "NOTICE" },
                    ].map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={closeMobileMenu}
                        className={`flex min-h-10 items-center font-display text-xs font-bold tracking-[0.1em] transition-colors hover:text-brand-pink ${
                          pathname === href ? "text-brand-pink" : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <Link href="/notice" onClick={closeMobileMenu} className={mobileLinkClass("/notice")}>
            {t.nav.notice}
          </Link>
          <Link href="/protect" onClick={closeMobileMenu} className={mobileLinkClass("/protect")}>
            PROTECT
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={closeMobileMenu} className={mobileLinkClass("/admin")}>
              ADMIN
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
