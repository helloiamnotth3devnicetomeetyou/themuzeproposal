import type { WorkbenchTab } from "@/admin/components/content/ContentWorkbench";
import {
  normalizeSocialLinks,
  type SocialLink,
} from "@/admin/components/content/SocialLinksField";
import {
  DEFAULT_HISTORY,
  normalizeHistory,
  type HistoryEntry,
} from "@/core/content/site-content";

export type SettingsTab =
  | "company"
  | "history"
  | "footer"
  | "social"
  | "business"
  | "avatars"
  | "admins";
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
export type BusinessAssets = { pressKitUrl: string; profilePdfUrl: string };

export type SettingsDraft = {
  company: CompanySettings;
  history: HistoryEntry[];
  footer: FooterSettings;
  social: SocialLink[];
  business: BusinessAssets;
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
export const EMPTY_BUSINESS: BusinessAssets = {
  pressKitUrl: "",
  profilePdfUrl: "",
};
export const EMPTY_DRAFT: SettingsDraft = {
  company: EMPTY_COMPANY,
  history: DEFAULT_HISTORY,
  footer: EMPTY_FOOTER,
  social: EMPTY_SOCIAL,
  business: EMPTY_BUSINESS,
};

const baseSettingsTabs: WorkbenchTab<SettingsTab>[] = [
  { id: "company", label: "회사 정보" },
  { id: "history", label: "연혁" },
  { id: "footer", label: "푸터" },
  { id: "social", label: "소셜 채널" },
  { id: "business", label: "비즈니스 자료" },
  { id: "avatars", label: "사용자 아바타" },
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

export function parseSettingsRows(
  rows: Array<{ key: string; value: unknown }> | null,
) {
  let company = EMPTY_COMPANY;
  let history = DEFAULT_HISTORY;
  let footer = EMPTY_FOOTER;
  let social = EMPTY_SOCIAL;
  let business = EMPTY_BUSINESS;
  rows?.forEach((item) => {
    if (item.key === "company")
      company = {
        ...EMPTY_COMPANY,
        ...(item.value as Partial<CompanySettings>),
      };
    if (item.key === "history") history = normalizeHistory(item.value);
    if (item.key === "footer")
      footer = { ...EMPTY_FOOTER, ...(item.value as Partial<FooterSettings>) };
    if (item.key === "social") social = normalizeSiteSocial(item.value);
    if (
      item.key === "business_assets" &&
      item.value &&
      typeof item.value === "object"
    )
      business = {
        ...EMPTY_BUSINESS,
        ...(item.value as Partial<BusinessAssets>),
      };
  });
  return { company, history, footer, social, business };
}
