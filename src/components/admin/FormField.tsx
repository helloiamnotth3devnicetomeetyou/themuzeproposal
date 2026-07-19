"use client";

import { useState } from "react";

interface FormFieldProps {
  label: string;
  type?: "text" | "textarea" | "number" | "url" | "date";
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase text-gray-400">{label}</label>
        <div className="flex gap-1 bg-white/5 p-1 rounded-md">
          <button 
            type="button"
            onClick={() => setActiveLang("ko")}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${activeLang === "ko" ? "bg-brand-pink text-black" : "text-gray-400 hover:text-white"}`}
          >
            KO
          </button>
          <button 
            type="button"
            onClick={() => setActiveLang("en")}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${activeLang === "en" ? "bg-brand-pink text-black" : "text-gray-400 hover:text-white"}`}
          >
            EN
          </button>
          <button 
            type="button"
            onClick={() => setActiveLang("ja")}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${activeLang === "ja" ? "bg-brand-pink text-black" : "text-gray-400 hover:text-white"}`}
          >
            JA
          </button>
        </div>
      </div>

      <div className="relative">
        {type === "textarea" ? (
          <>
            <textarea required={required && activeLang === "ko"} value={valueKo} onChange={e => onChangeKo(e.target.value)} className={`admin-input w-full ${activeLang !== "ko" ? "hidden" : ""}`} rows={4} />
            <textarea required={required && activeLang === "en"} value={valueEn} onChange={e => onChangeEn(e.target.value)} className={`admin-input w-full ${activeLang !== "en" ? "hidden" : ""}`} rows={4} />
            <textarea required={required && activeLang === "ja"} value={valueJa} onChange={e => onChangeJa(e.target.value)} className={`admin-input w-full ${activeLang !== "ja" ? "hidden" : ""}`} rows={4} />
          </>
        ) : (
          <>
            <input type={type} required={required && activeLang === "ko"} value={valueKo} onChange={e => onChangeKo(e.target.value)} className={`admin-input w-full ${activeLang !== "ko" ? "hidden" : ""}`} />
            <input type={type} required={required && activeLang === "en"} value={valueEn} onChange={e => onChangeEn(e.target.value)} className={`admin-input w-full ${activeLang !== "en" ? "hidden" : ""}`} />
            <input type={type} required={required && activeLang === "ja"} value={valueJa} onChange={e => onChangeJa(e.target.value)} className={`admin-input w-full ${activeLang !== "ja" ? "hidden" : ""}`} />
          </>
        )}
      </div>
    </div>
  );
}
