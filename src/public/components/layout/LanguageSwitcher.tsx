"use client";

import { useLocale, type Locale } from "@/core/providers/LocaleContext";
import CustomSelect, { type CustomSelectOption } from "@/core/components/form/CustomSelect";

const languageOptions: CustomSelectOption[] = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
];

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div style={{ width: "105px" }}>
      <CustomSelect
        value={locale}
        options={languageOptions}
        onChange={(val) => setLocale(val as Locale)}
        ariaLabel={t.common.language}
        variant="pill"
      />
    </div>
  );
}
