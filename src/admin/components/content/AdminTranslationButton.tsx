"use client";

import { useEffect, useRef, useState } from "react";
import { Languages } from "lucide-react";
import { z } from "zod";

export type AdminDraftTranslationField = {
  key: string;
  label: string;
  format: "plain" | "richtext";
  ko: string;
  en: string;
  ja: string;
};

export type AdminDraftTranslations = Record<
  string,
  Partial<Record<"en" | "ja", string>>
>;

const responseSchema = z.object({
  translations: z.array(
    z.object({
      key: z.string(),
      en: z.string().nullable(),
      ja: z.string().nullable(),
    }),
  ),
});

const errorMessage = (status: number) =>
  status === 413
    ? "한 번에 번역할 수 있는 원고 길이를 초과했습니다."
    : status === 401 || status === 403
      ? "관리자 인증을 확인해 주세요."
      : "자동 번역에 실패했습니다. 잠시 후 다시 시도해 주세요.";

export default function AdminTranslationButton({
  documentKind,
  fields,
  onApply,
  onError,
  onSuccess,
}: {
  documentKind: "artist" | "member" | "album" | "notice" | "schedule";
  fields: AdminDraftTranslationField[];
  onApply: (translations: AdminDraftTranslations) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}) {
  const [translating, setTranslating] = useState(false);
  const fieldsRef = useRef(fields);
  useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);
  const pending = fields
    .filter((field) => field.ko.trim())
    .map((field) => ({
      ...field,
      targetLocales: [
        ...(!field.en.trim() ? (["en"] as const) : []),
        ...(!field.ja.trim() ? (["ja"] as const) : []),
      ],
    }))
    .filter((field) => field.targetLocales.length);

  const translate = async () => {
    if (!pending.length || translating) return;
    setTranslating(true);
    onError("");
    const snapshot = pending.map(
      ({ key, label, format, ko, targetLocales }) => ({
        key,
        label,
        format,
        source: ko,
        targetLocales,
      }),
    );
    try {
      const response = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ documentKind, fields: snapshot }),
      });
      if (!response.ok) throw new Error(errorMessage(response.status));
      const parsed = responseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error(errorMessage(503));

      const current = new Map(
        fieldsRef.current.map((field) => [field.key, field]),
      );
      if (
        snapshot.some((field) => current.get(field.key)?.ko !== field.source)
      ) {
        throw new Error(
          "번역 중 한국어 원문이 변경되어 결과를 적용하지 않았습니다.",
        );
      }

      const result = new Map(
        parsed.data.translations.map((item) => [item.key, item]),
      );
      const next: AdminDraftTranslations = {};
      for (const requested of snapshot) {
        const translated = result.get(requested.key);
        const live = current.get(requested.key);
        if (!translated || !live) throw new Error(errorMessage(503));
        for (const locale of requested.targetLocales) {
          const value = translated[locale];
          if (!value?.trim()) throw new Error(errorMessage(503));
          if (!live[locale].trim()) {
            next[requested.key] = { ...next[requested.key], [locale]: value };
          }
        }
      }
      if (!Object.keys(next).length) {
        onSuccess("이미 입력된 번역은 그대로 유지했습니다.");
        return;
      }
      onApply(next);
      onSuccess("빈 EN·JP 필드에 번역 초안을 채웠습니다.");
    } catch (error) {
      onError(error instanceof Error ? error.message : errorMessage(503));
    } finally {
      setTranslating(false);
    }
  };

  return (
    <button
      type="button"
      className="admin-btn admin-btn-secondary"
      disabled={!pending.length || translating}
      onClick={() => void translate()}
      title={
        pending.length
          ? "비어 있는 EN·JP 번역 생성"
          : "번역할 빈 EN·JP 필드가 없습니다"
      }
    >
      <Languages aria-hidden="true" />
      {translating ? "번역 중" : "EN·JP 자동 번역"}
    </button>
  );
}
