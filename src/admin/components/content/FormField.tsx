"use client";

import { useId } from "react";
import RichTextEditor from "./RichTextEditor";
import type { AdminLanguage } from "./AdminLanguageTabs";

interface FormFieldProps {
  label: string;
  type?: "text" | "textarea" | "richtext" | "number" | "url" | "date";
  valueKo: string;
  valueEn: string;
  valueJa: string;
  onChangeKo: (value: string) => void;
  onChangeEn: (value: string) => void;
  onChangeJa: (value: string) => void;
  required?: boolean;
  activeLang?: AdminLanguage;
  /** @deprecated language selection is now screen-level */
  showLanguageTabs?: boolean;
  error?: string;
}

export default function FormField({ label, type = "text", valueKo, valueEn, valueJa, onChangeKo, onChangeEn, onChangeJa, required = false, activeLang = "ko", error }: FormFieldProps) {
  const fieldId = useId();
  const value = activeLang === "ko" ? valueKo : activeLang === "en" ? valueEn : valueJa;
  const onChange = activeLang === "ko" ? onChangeKo : activeLang === "en" ? onChangeEn : onChangeJa;
  const requiredHere = required && activeLang === "ko";
  const input = type === "textarea"
    ? <textarea id={fieldId} required={requiredHere} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : undefined} className="admin-input w-full" rows={4} />
    : <input id={fieldId} type={type} required={requiredHere} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : undefined} className="admin-input w-full" />;

  return <div className="desk-translatable-field">
    <div className="desk-translatable-heading"><label htmlFor={fieldId}>{label}{required && <span>*</span>}</label></div>
    <div className="desk-translatable-control">
      {type === "richtext" ? <RichTextEditor key={activeLang} id={fieldId} errorId={error ? `${fieldId}-error` : undefined} invalid={Boolean(error)} label={activeLang === "ko" ? "한국어" : activeLang === "en" ? "영어" : "일본어"} value={value} onChange={onChange} placeholder={`${label}을 입력하세요`} required={requiredHere} /> : input}
      {error && <p id={`${fieldId}-error`} className="admin-field-error" role="alert">{error}</p>}
    </div>
  </div>;
}
