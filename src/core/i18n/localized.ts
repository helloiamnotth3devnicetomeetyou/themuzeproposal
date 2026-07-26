export const LOCALES = ["ko", "en", "ja"] as const;

export type Locale = (typeof LOCALES)[number];

export type LocalizedText = Partial<Record<Locale, string | null | undefined>>;

export const localeTags: Record<Locale, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function localizeText(
  value: LocalizedText,
  locale: Locale,
  canonical = "",
) {
  const order = [locale, "ko", "en", "ja"] as const;
  for (const candidate of new Set<Locale>(order)) {
    const text = value[candidate]?.trim();
    if (text) return text;
  }
  return canonical.trim();
}

export function localizedFields(
  value: {
    ko?: string | null;
    en?: string | null;
    ja?: string | null;
  },
): LocalizedText {
  return { ko: value.ko, en: value.en, ja: value.ja };
}
