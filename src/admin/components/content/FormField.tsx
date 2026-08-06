"use client";

import { useState } from "react";
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
  required = false
}: FormFieldProps) {
  const [activeLang, setActiveLang] = useState<"ko" | "en" | "ja">("ko");

  return (
    <div className="desk-translatable-field">
      <div className="desk-translatable-heading">
        <label>{label}{required && <span>*</span>}</label>
        <div className="desk-lang-tabs" aria-label={`${label} 언어`}>
          <button 
            type="button"
            onClick={() => setActiveLang("ko")}
            className={activeLang === "ko" ? "is-active" : ""}
          >
            KR
          </button>
          <button 
            type="button"
            onClick={() => setActiveLang("ja")}
            className={activeLang === "ja" ? "is-active" : ""}
          >
            JP
          </button>
          <button 
            type="button"
            onClick={() => setActiveLang("en")}
            className={activeLang === "en" ? "is-active" : ""}
          >
            EN
          </button>
        </div>
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
            <textarea required={required && activeLang === "ko"} value={valueKo} onChange={e => onChangeKo(e.target.value)} className={`admin-input w-full ${activeLang !== "ko" ? "hidden" : ""}`} rows={4} />
            <textarea value={valueEn} onChange={e => onChangeEn(e.target.value)} className={`admin-input w-full ${activeLang !== "en" ? "hidden" : ""}`} rows={4} />
            <textarea value={valueJa} onChange={e => onChangeJa(e.target.value)} className={`admin-input w-full ${activeLang !== "ja" ? "hidden" : ""}`} rows={4} />
          </>
        ) : (
          <>
            <input type={type} required={required && activeLang === "ko"} value={valueKo} onChange={e => onChangeKo(e.target.value)} className={`admin-input w-full ${activeLang !== "ko" ? "hidden" : ""}`} />
            <input type={type} value={valueEn} onChange={e => onChangeEn(e.target.value)} className={`admin-input w-full ${activeLang !== "en" ? "hidden" : ""}`} />
            <input type={type} value={valueJa} onChange={e => onChangeJa(e.target.value)} className={`admin-input w-full ${activeLang !== "ja" ? "hidden" : ""}`} />
          </>
        )}
      </div>
    </div>
  );
}
