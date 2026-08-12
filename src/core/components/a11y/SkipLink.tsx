"use client";

import { useLocale } from "@/core/providers/LocaleContext";

export default function SkipLink() {
  const { t } = useLocale();
  return (
    <a href="#main-content" className="skip-link">
      {t.common.skipToContent}
    </a>
  );
}
