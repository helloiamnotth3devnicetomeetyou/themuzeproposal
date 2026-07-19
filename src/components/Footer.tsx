"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "../app/context/LocaleContext";
import { useTheme } from "../app/context/ThemeContext";

export default function Footer() {
  const { t } = useLocale();
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
          <Link href="/" className="relative w-36 h-8 block">
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
          <div className="flex gap-4">
            {["instagram", "youtube", "twitter", "tiktok"].map((sns) => (
              <a
                key={sns}
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:text-brand-pink hover:border-brand-pink"
                style={{
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-muted)",
                }}
              >
                <span className="text-xs capitalize font-semibold">{sns.slice(0, 2)}</span>
              </a>
            ))}
          </div>
          <div className="flex gap-6 text-xs" style={{ color: "var(--text-faint)" }}>
            <Link href="#" className="hover:text-brand-pink transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-brand-pink transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
