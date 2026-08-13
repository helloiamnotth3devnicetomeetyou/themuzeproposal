// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock all external dependencies
vi.mock("next/image", () => ({
  default: () => null,
}));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/core/providers/LocaleContext", () => ({
  useLocale: () => ({
    locale: "ko",
    t: {
      footer: {
        companyName: "더뮤즈엔터테인먼트",
        address: "서울시",
        copyright: "© THE MUZE",
      },
    },
  }),
}));
vi.mock("@/core/providers/ThemeContext", () => ({
  useTheme: () => ({ theme: "dark" }),
}));
vi.mock("@/public/features/settings/useSiteSettings", () => ({
  useSiteSettings: (initial: unknown) => ({ settings: initial }),
}));

import Footer from "./Footer";
import type { SiteSettingsPreviewPayload } from "@/core/preview/types";

const makeSettings = (
  overrides: Partial<SiteSettingsPreviewPayload> = {},
): SiteSettingsPreviewPayload => ({
  company: {
    name_ko: "더뮤즈",
    name_en: "THE MUZE",
    name_ja: "ザ・ミューズ",
    address_ko: "서울시 강남구",
    address_en: "Seoul, Korea",
    address_ja: "ソウル市江南区",
    email: "info@themuze.kr",
  },
  footer: { copyright: "© 2026 THE MUZE" },
  social: [],
  history: [],
  ...overrides,
});

describe("Footer component", () => {
  it("renders footer element with correct id", () => {
    render(<Footer initialSettings={makeSettings()} />);
    expect(document.getElementById("site-footer")).not.toBeNull();
  });

  it("shows company name from settings", () => {
    render(<Footer initialSettings={makeSettings()} />);
    expect(screen.getByText("더뮤즈")).toBeInTheDocument();
  });

  it("shows copyright from settings", () => {
    render(<Footer initialSettings={makeSettings()} />);
    expect(screen.getByText("© 2026 THE MUZE")).toBeInTheDocument();
  });

  it("renders social links when provided", () => {
    const settings = makeSettings({
      social: [
        {
          id: "s1",
          platform: "instagram",
          label: "Instagram",
          url: "https://instagram.com/themuze",
        },
        {
          id: "s2",
          platform: "youtube",
          label: "YouTube",
          url: "https://youtube.com/themuze",
        },
      ],
    });
    render(<Footer initialSettings={settings} />);
    expect(screen.getByRole("link", { name: "Instagram" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "YouTube" })).toBeInTheDocument();
  });

  it("does not render social section when no social links", () => {
    render(<Footer initialSettings={makeSettings({ social: [] })} />);
    expect(screen.queryByRole("link", { name: /instagram/i })).toBeNull();
  });

  it("filters out social links with unsafe URLs", () => {
    const settings = makeSettings({
      social: [
        {
          id: "s1",
          platform: "other",
          label: "Bad",
          url: "javascript:alert(1)",
        },
        {
          id: "s2",
          platform: "instagram",
          label: "IG",
          url: "https://instagram.com/themuze",
        },
      ],
    });
    render(<Footer initialSettings={settings} />);
    const links = screen.getAllByRole("link");
    // only safe link + logo link
    const socialLinks = links.filter(
      (l) => l.getAttribute("target") === "_blank",
    );
    expect(socialLinks.length).toBe(1);
  });

  it("renders the logo link to home", () => {
    render(<Footer initialSettings={makeSettings()} />);
    const homeLink = screen
      .getAllByRole("link")
      .find((l) => l.getAttribute("href") === "/");
    expect(homeLink).toBeTruthy();
  });
});
