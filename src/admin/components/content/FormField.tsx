"use client";

import { useId, useState } from "react";
import RichTextEditor from "./RichTextEditor";

interface FormFieldProps {
  label: string;
  type?: "text" | "textarea" | "richtext" | "number" | "url" | "date";
  valueKo: string;
  valueEn: string;
  valueJa: string;
  onChangeKo: (val: string) => void;
  onChangeEn: (val: string) => void;
  onChangeJa: (val: string) => void;
  required?: boolean;
  activeLang?: "ko" | "en" | "ja";
  showLanguageTabs?: boolean;
}

export default function FormField({ 
  label, 
  type = "text", 
  valueKo, 
  valueEn, 
  valueJa,
  onChangeKo,
  onChangeEn,
  onChangeJa,
  required = false,
  activeLang: controlledActiveLang,
  showLanguageTabs = true,
}: FormFieldProps) {
  const [localActiveLang, setLocalActiveLang] = useState<"ko" | "en" | "ja">("ko");
  const activeLang = controlledActiveLang ?? localActiveLang;
  const fieldId = useId();
  const activeId = `${fieldId}-${activeLang}`;
  const languageTabs = [
    { id: "ko" as const, label: "KR", name: "한국어", value: valueKo },
    { id: "ja" as const, label: "JP", name: "일본어", value: valueJa },
    { id: "en" as const, label: "EN", name: "영어", value: valueEn },
  ];

  return (
    <div className="desk-translatable-field">
      <div className="desk-translatable-heading">
        <label htmlFor={activeId}>{label}{required && <span>*</span>}</label>
        {showLanguageTabs && <div className="desk-lang-tabs" aria-label={`${label} 언어`}>
          {languageTabs.map((language) => {
            const complete = Boolean(language.value.trim());
            return <button
              key={language.id}
              type="button"
              onClick={() => setLocalActiveLang(language.id)}
              className={`${activeLang === language.id ? "is-active" : ""}${complete ? " is-complete" : ""}`.trim()}
              aria-pressed={activeLang === language.id}
              aria-label={`${language.name}${complete ? " 작성됨" : " 미작성"}`}
            >{language.label}</button>;
          })}
        </div>}
      </div>

      <div className="desk-translatable-control">
        {type === "richtext" ? (
          <RichTextEditor
            key={activeLang}
            label={activeLang === "ko" ? "한국어" : activeLang === "en" ? "영어" : "일본어"}
            value={activeLang === "ko" ? valueKo : activeLang === "en" ? valueEn : valueJa}
            onChange={activeLang === "ko" ? onChangeKo : activeLang === "en" ? onChangeEn : onChangeJa}
            placeholder={`${label}를 입력하세요.`}
            required={required && activeLang === "ko"}
          />
        ) : type === "textarea" ? (
          <>
            <textarea id={`${fieldId}-ko`} required={required && activeLang === "ko"} value={valueKo} onChange={e => onChangeKo(e.target.value)} className={`admin-input w-full ${activeLang !== "ko" ? "hidden" : ""}`} rows={4} />
            <textarea id={`${fieldId}-en`} value={valueEn} onChange={e => onChangeEn(e.target.value)} className={`admin-input w-full ${activeLang !== "en" ? "hidden" : ""}`} rows={4} />
            <textarea id={`${fieldId}-ja`} value={valueJa} onChange={e => onChangeJa(e.target.value)} className={`admin-input w-full ${activeLang !== "ja" ? "hidden" : ""}`} rows={4} />
          </>
        ) : (
          <>
            <input id={`${fieldId}-ko`} type={type} required={required && activeLang === "ko"} value={valueKo} onChange={e => onChangeKo(e.target.value)} className={`admin-input w-full ${activeLang !== "ko" ? "hidden" : ""}`} />
            <input id={`${fieldId}-en`} type={type} value={valueEn} onChange={e => onChangeEn(e.target.value)} className={`admin-input w-full ${activeLang !== "en" ? "hidden" : ""}`} />
            <input id={`${fieldId}-ja`} type={type} value={valueJa} onChange={e => onChangeJa(e.target.value)} className={`admin-input w-full ${activeLang !== "ja" ? "hidden" : ""}`} />
          </>
        )}
      </div>
    </div>
  );
}
