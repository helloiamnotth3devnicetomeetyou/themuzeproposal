"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LuLink } from "react-icons/lu";
import { useLocale } from "@/core/providers/LocaleContext";
import { useTheme } from "@/core/providers/ThemeContext";
import { SOCIAL_ICONS, SOCIAL_LABELS } from "@/core/content/social-icons";
import { supabase } from "@/core/supabase/client";

type SiteSocialLink = {
  id: string;
  platform: string;
  label: string;
  url: string;
};

const isSafeExternalUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const normalizeSiteSocialLinks = (value: unknown): SiteSocialLink[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Partial<SiteSocialLink>;
      const url = typeof candidate.url === "string" ? candidate.url.trim() : "";
      if (!isSafeExternalUrl(url)) return [];

      const platform = typeof candidate.platform === "string" && candidate.platform
        ? candidate.platform.toLowerCase()
        : "other";
      return [{
        id: typeof candidate.id === "string" && candidate.id ? candidate.id : `footer-social-${index}`,
        platform: platform === "twitter" ? "x" : platform,
        label: typeof candidate.label === "string" ? candidate.label.trim() : "",
        url,
      }];
    });
  }

  // Keep compatibility with the original { instagram, youtube, ... } setting.
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([platform, rawUrl], index) => {
      const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
      if (!isSafeExternalUrl(url)) return [];
      return [{
        id: `footer-social-${platform}-${index}`,
        platform: platform === "twitter" ? "x" : platform.toLowerCase(),
        label: "",
        url,
      }];
    });
  }

  return [];
};

export default function Footer() {
  const { t } = useLocale();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [socialLinks, setSocialLinks] = useState<SiteSocialLink[]>([]);

  useEffect(() => {
    let active = true;

    const fetchSocialLinks = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "social")
        .maybeSingle();

      if (active && !error) setSocialLinks(normalizeSiteSocialLinks(data?.value));
    };

    void fetchSocialLinks();
    return () => { active = false; };
  }, []);

  return (
    <footer
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
              className="object-contain transition-all duration-300"
              style={isDark ? { filter: "invert(1)" } : {}}
            />
          </Link>
          <div className="text-xs leading-relaxed font-light mt-2" style={{ color: "var(--text-faint)" }}>
            <p className="font-semibold" style={{ color: "var(--text-muted)" }}>{t.footer.companyName}</p>
            <p className="mt-1">{t.footer.address}</p>
            <p className="mt-2">{t.footer.copyright}</p>
          </div>
        </div>

        {/* Right: SNS Social Icons */}
        <div className="flex flex-col items-center md:items-end gap-6">
          {socialLinks.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 md:justify-end">
              {socialLinks.map((item) => {
                const SocialIcon = SOCIAL_ICONS[item.platform] || LuLink;
                const accessibleLabel = item.label || SOCIAL_LABELS[item.platform] || "Official link";
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={accessibleLabel}
                    title={accessibleLabel}
                    className="flex size-11 items-center justify-center rounded-full transition-all duration-300 hover:text-brand-pink hover:border-brand-pink"
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
