import type { Locale } from "@/core/i18n/localized";

const COPY: Record<Locale, { hours: (n: number) => string; minutes: (n: number) => string }> = {
  ko: {
    hours: (n) => `${n}시간 후 다시 시도할 수 있습니다.`,
    minutes: (n) => `${n}분 후 다시 시도할 수 있습니다.`,
  },
  en: {
    hours: (n) => `You can try again in ${n} hour${n === 1 ? "" : "s"}.`,
    minutes: (n) => `You can try again in ${n} minute${n === 1 ? "" : "s"}.`,
  },
  ja: {
    hours: (n) => `${n}時間後に再試行できます。`,
    minutes: (n) => `${n}分後に再試行できます。`,
  },
};

/** retryAfterSeconds >= 1 hour shows hours, otherwise minutes (both rounded up). */
export function formatRetryAfterCountdown(
  retryAfterSeconds: number,
  locale: Locale,
) {
  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds <= 0)
    return "";
  const copy = COPY[locale];
  if (retryAfterSeconds >= 3600)
    return copy.hours(Math.ceil(retryAfterSeconds / 3600));
  return copy.minutes(Math.max(1, Math.ceil(retryAfterSeconds / 60)));
}
