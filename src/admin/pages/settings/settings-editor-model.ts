import type { WorkbenchTab } from "@/admin/components/content/ContentWorkbench";
import {
  normalizeSocialLinks,
  type SocialLink,
} from "@/admin/components/content/SocialLinksField";
import {
  DEFAULT_HISTORY,
  type HistoryEntry,
} from "@/core/content/site-content";

export type SettingsTab = "company" | "history" | "footer" | "social" | "admins";
export type HistoryLanguage = "ko" | "en" | "ja";

export type CompanySettings = {
  name_ko: string;
  name_en: string;
  name_ja: string;
  address_ko: string;
  address_en: string;
  address_ja: string;
  email: string;
};

export type FooterSettings = { copyright: string };

export type SettingsDraft = {
  company: CompanySettings;
  history: HistoryEntry[];
  footer: FooterSettings;
  social: SocialLink[];
};

export const EMPTY_COMPANY: CompanySettings = {
  name_ko: "",
  name_en: "",
  name_ja: "",
  address_ko: "",
  address_en: "",
  address_ja: "",
  email: "",
};

export const EMPTY_FOOTER: FooterSettings = { copyright: "" };
export const EMPTY_SOCIAL: SocialLink[] = [];
export const EMPTY_DRAFT: SettingsDraft = {
  company: EMPTY_COMPANY,
  history: DEFAULT_HISTORY,
  footer: EMPTY_FOOTER,
  social: EMPTY_SOCIAL,
};

const baseSettingsTabs: WorkbenchTab<SettingsTab>[] = [
  { id: "company", label: "회사 정보" },
  { id: "history", label: "연혁" },
  { id: "footer", label: "푸터" },
  { id: "social", label: "소셜 채널" },
];

export const settingsTabs: WorkbenchTab<SettingsTab>[] = [
  ...baseSettingsTabs,
  { id: "admins", label: "관리자 계정" },
];

export const normalizeSiteSocial = (value: unknown): SocialLink[] => {
  if (Array.isArray(value)) return normalizeSocialLinks(value);
  if (!value || typeof value !== "object") return [];

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([platform, url], index) => {
      if (typeof url !== "string" || !url.trim()) return [];
      return [
        {
          id: `site-${platform}-${index}`,
          platform: platform === "twitter" ? "x" : platform,
          label: "",
          url,
        },
      ];
    },
  );
};
