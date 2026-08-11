"use client";

export type AdminLanguage = "ko" | "en" | "ja";

const languages: Array<{ id: AdminLanguage; label: string }> = [
  { id: "ko", label: "KR" },
  { id: "en", label: "EN" },
  { id: "ja", label: "JP" },
];

export default function AdminLanguageTabs({ activeLang, onChange, values, ariaLabel = "작성 언어" }: {
  activeLang: AdminLanguage;
  onChange: (language: AdminLanguage) => void;
  values?: Partial<Record<AdminLanguage, string | null | undefined>>;
  ariaLabel?: string;
}) {
  return <div className="desk-lang-tabs" data-tour-id="editor-language-tabs" aria-label={ariaLabel}>
    {languages.map(({ id, label }) => {
      const complete = Boolean(values?.[id]?.trim());
      return <button key={id} type="button" className={`${activeLang === id ? "is-active" : ""}${complete ? " is-complete" : ""}`.trim()} onClick={() => onChange(id)} aria-pressed={activeLang === id}>{label}</button>;
    })}
  </div>;
}
