import type { SiteSettingsPreviewPayload } from "@/core/preview/types";
import { DEFAULT_HISTORY, normalizeHistory } from "@/core/content/site-content";
import { detectSocialPlatform } from "@/core/content/social-icons";
import {
  DEFAULT_LOGIN_SLIDES,
  normalizeLoginSlides,
} from "@/core/content/login-slides";

export const EMPTY_SETTINGS: SiteSettingsPreviewPayload = {
  loginSlides: DEFAULT_LOGIN_SLIDES,
  company: {
    name_ko: "",
    name_en: "",
    name_ja: "",
    address_ko: "",
    address_en: "",
    address_ja: "",
    email: "",
  },
  history: DEFAULT_HISTORY,
  footer: { copyright: "" },
  social: [],
};

const normalizeSocial = (
  value: unknown,
): SiteSettingsPreviewPayload["social"] => {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Record<string, unknown>;
      const url = typeof candidate.url === "string" ? candidate.url.trim() : "";
      if (!url) return [];
      return [
        {
          id:
            typeof candidate.id === "string"
              ? candidate.id
              : `site-social-${index}`,
          platform:
            detectSocialPlatform(url) !== "other"
              ? detectSocialPlatform(url)
              : typeof candidate.platform === "string"
                ? candidate.platform
                : "other",
          label: typeof candidate.label === "string" ? candidate.label : "",
          url,
        },
      ];
    });
  }

  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>).flatMap(
    ([platform, url], index) =>
      typeof url === "string" && url.trim()
        ? [{ id: `site-social-${index}`, platform, label: "", url: url.trim() }]
        : [],
  );
};

const stringFields = (
  value: unknown,
  keys: readonly string[],
): Record<string, string> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const candidate = value as Record<string, unknown>;
  return keys.reduce<Record<string, string>>((result, key) => {
    if (typeof candidate[key] === "string") result[key] = candidate[key];
    return result;
  }, {});
};

export function normalizeSiteSettings(
  rows: Array<{ key: string; value: unknown }> | null | undefined,
): SiteSettingsPreviewPayload {
  const next = structuredClone(EMPTY_SETTINGS);

  rows?.forEach((item) => {
    if (item.key === "login_slides")
      next.loginSlides = normalizeLoginSlides(item.value);
    if (
      item.key === "company" &&
      item.value &&
      typeof item.value === "object"
    ) {
      next.company = {
        ...next.company,
        ...stringFields(item.value, Object.keys(next.company)),
      };
    }
    if (item.key === "history") next.history = normalizeHistory(item.value);
    if (item.key === "footer" && item.value && typeof item.value === "object") {
      next.footer = {
        ...next.footer,
        ...stringFields(item.value, Object.keys(next.footer)),
      };
    }
    if (item.key === "social") next.social = normalizeSocial(item.value);
  });

  return next;
}
