"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/core/providers/LocaleContext";
import { useTheme } from "@/core/providers/ThemeContext";
import { detectSocialPlatform, SOCIAL_ICONS, SOCIAL_LABELS } from "@/core/content/social-icons";
import { useSiteSettings } from "@/public/features/settings/useSiteSettings";
import type { SiteSettingsPreviewPayload } from "@/core/preview/types";

const isSafeExternalUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export default function Footer({ initialSettings }: { initialSettings: SiteSettingsPreviewPayload }) {
  const { t, locale } = useLocale();
  const { theme } = useTheme();
  const { settings } = useSiteSettings(initialSettings);
  const isDark = theme === "dark";
  const companyName = settings.company[`name_${locale}`] || settings.company.name_en || settings.company.name_ko || t.footer.companyName;
  const address = settings.company[`address_${locale}`] || settings.company.address_en || settings.company.address_ko || t.footer.address;
  const copyright = settings.footer.copyright || t.footer.copyright;
  const socialLinks = settings.social.filter((item) => isSafeExternalUrl(item.url));

  return (
    <footer
      id="site-footer"
      className="py-16 mt-auto"
      style={{
        backgroundColor: "var(--footer-bg)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left: Info */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
          <Link href="/" className="relative block h-11 w-36">
            <Image
              src="/images/logo.png"
              alt="THE MUZE Logo"
              fill
              sizes="144px"
              className="object-contain transition-all duration-slow"
              style={isDark ? { filter: "invert(1)" } : {}}
            />
          </Link>
          <div className="text-xs leading-relaxed font-light mt-2" style={{ color: "var(--text-faint)" }}>
            <p className="font-semibold" style={{ color: "var(--text-muted)" }}>{companyName}</p>
            <p className="mt-1">{address}</p>
            <p className="mt-2">{copyright}</p>
          </div>
        </div>

        {/* Right: SNS Social Icons */}
        <div className="flex flex-col items-center md:items-end gap-6">
          {socialLinks.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 md:justify-end">
              {socialLinks.map((item) => {
                const platform = detectSocialPlatform(item.url) !== "other" ? detectSocialPlatform(item.url) : item.platform;
                const SocialIcon = SOCIAL_ICONS[platform] || Link;
                const accessibleLabel = item.label || SOCIAL_LABELS[platform] || "Official link";
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={accessibleLabel}
                    title={accessibleLabel}
                    className="flex size-11 items-center justify-center rounded-full transition-all duration-slow hover:-translate-y-0.5 hover:text-brand-pink hover:border-brand-pink active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-pink motion-reduce:transform-none motion-reduce:transition-none"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <SocialIcon className="h-4 w-4" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </footer>
  );
}
