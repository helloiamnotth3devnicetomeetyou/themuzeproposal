"use client";

import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Paperclip, Send, Trash2 } from "lucide-react";
import CustomSelect from "@/core/components/form/CustomSelect";
import type {
  AuditionField,
  AuditionSession,
} from "@/admin/pages/auditions/audition-editor-model";
import styles from "@/styles/(public)/pages/audition.module.css";

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const formatBytes = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Split schema into pages by page_break ────────────────────────────────────

type Page = { title?: string; fields: AuditionField[] };

function splitPages(schema: AuditionField[]): Page[] {
  const pages: Page[] = [];
  let current: AuditionField[] = [];
  let nextTitle: string | undefined;

  for (const field of schema) {
    if (field.type === "page_break") {
      pages.push({ title: nextTitle, fields: current });
      current = [];
      nextTitle = field.pageTitle || undefined;
    } else {
      current.push(field);
    }
  }
  pages.push({ title: nextTitle, fields: current });

  // Remove empty pages
  return pages.filter((p) => p.fields.length > 0);
}

// ─── Dynamic field renderer ────────────────────────────────────────────────────

function DynamicField({
  field,
  value,
  onChange,
  fileRefs,
}: {
  field: AuditionField;
  value: string | string[];
  onChange: (val: string | string[]) => void;
  fileRefs: React.MutableRefObject<Map<string, HTMLInputElement>>;
}) {
  const id = useId();
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [fileError, setFileError] = useState("");

  const strValue = typeof value === "string" ? value : "";
  const arrValue = Array.isArray(value) ? value : [];

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError("");
    if (file.size > MAX_FILE_BYTES) {
      setFileError("파일 크기는 50 MB 이하여야 합니다.");
      e.target.value = "";
      return;
    }
    const acceptSetting = field.accept ?? "image/*,application/pdf";
    const acceptedTypes = acceptSetting.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

    const isMatch = acceptedTypes.some((type) => {
      if (type.endsWith("/*")) {
        const prefix = type.slice(0, -1); // e.g. "image/"
        return file.type.toLowerCase().startsWith(prefix);
      }
      return file.type.toLowerCase() === type;
    });

    if (!isMatch) {
      setFileError("허용된 파일 형식이 아닙니다.");
      e.target.value = "";
      return;
    }
    setFileInfo({ name: file.name, size: file.size });
    onChange(file.name);
  };

  const removeFile = () => {
    const input = fileRefs.current.get(field.id);
    if (input) input.value = "";
    setFileInfo(null);
    setFileError("");
    onChange("");
  };

  if (field.type === "textarea") {
    return (
      <textarea
        id={id}
        className={styles.fieldTextarea}
        value={strValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        rows={5}
      />
    );
  }

  if (field.type === "select") {
    const options = (field.options ?? []).map((o) => ({ value: o, label: o }));
    return (
      <CustomSelect
        ariaLabel={field.label}
        value={strValue}
        onChange={(v) => onChange(v)}
        options={[{ value: "", label: "선택하세요" }, ...options]}
        placeholder="선택하세요"
      />
    );
  }

  if (field.type === "radio") {
    return (
      <div className={styles.fieldRadioGroup} role="radiogroup" aria-label={field.label}>
        {(field.options ?? []).map((opt) => {
          const checked = strValue === opt;
          return (
            <label
              key={opt}
              className={`${styles.fieldRadioLabel} ${checked ? styles["is-checked"] : ""}`}
            >
              <input
                type="radio"
                name={id}
                value={opt}
                checked={checked}
                onChange={() => onChange(opt)}
                required={field.required && !strValue}
              />
              <span className={styles.fieldOptionIndicator} />
              <span>{opt}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <div className={styles.fieldCheckGroup}>
        {(field.options ?? []).map((opt) => {
          const checked = arrValue.includes(opt);
          return (
            <label
              key={opt}
              className={`${styles.fieldCheckLabel} ${checked ? styles["is-checked"] : ""}`}
            >
              <input
                type="checkbox"
                value={opt}
                checked={checked}
                onChange={(e) => {
                  if (e.target.checked) onChange([...arrValue, opt]);
                  else onChange(arrValue.filter((v) => v !== opt));
                }}
              />
              <span className={styles.fieldOptionIndicator} />
              <span>{opt}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <input
        id={id}
        type="date"
        className={styles.fieldInput}
        value={strValue}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
      />
    );
  }

  if (field.type === "file") {
    return (
      <div className={styles.fieldFileWrap}>
        <input
          ref={(el) => {
            if (el) fileRefs.current.set(field.id, el);
            else fileRefs.current.delete(field.id);
          }}
          id={id}
          type="file"
          className={styles.fieldFileInput}
          accept={field.accept ?? "image/*,application/pdf"}
          required={field.required && !fileInfo}
          onChange={handleFile}
        />
        {fileInfo ? (
          <div className={styles.fieldFileChosen}>
            <Paperclip aria-hidden="true" />
            <div>
              <b>{fileInfo.name}</b>
              <small>{formatBytes(fileInfo.size)}</small>
            </div>
            <button type="button" className={styles.fieldFileRemove} onClick={removeFile}>
              <Trash2 aria-hidden="true" /><span className="sr-only">파일 제거</span>
            </button>
          </div>
        ) : (
          <label htmlFor={id} className={styles.fieldFileTrigger}>
            <Paperclip aria-hidden="true" />
            <span>파일 선택 (이미지 또는 PDF, 최대 50 MB)</span>
          </label>
        )}
        {fileError && <p className={styles.fieldFileError}>{fileError}</p>}
      </div>
    );
  }

  // default: text
  return (
    <input
      id={id}
      type="text"
      className={styles.fieldInput}
      value={strValue}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      required={field.required}
    />
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

type Answers = Record<string, string | string[]>;

export default function AuditionFormClient({
  session,
  userEmail,
}: {
  session: AuditionSession;
  userEmail: string;
}) {
  const categories = session.categories;

  const [selectedCategory, setSelectedCategory] = useState(
    categories.length === 1 ? categories[0] : "",
  );
  const [categoryConfirmed, setCategoryConfirmed] = useState(categories.length <= 1);

  // Determine which schema to use
  const schema =
    selectedCategory && session.category_forms?.[selectedCategory]?.length
      ? session.category_forms[selectedCategory]
      : session.form_schema;

  const pages = splitPages(schema);
  const totalPages = Math.max(pages.length, 1);

  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() => {
    const init: Answers = {};
    for (const f of schema) {
      init[f.id] = f.type === "checkbox" ? [] : "";
    }
    return init;
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const fileRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const setAnswer = (fieldId: string, val: string | string[]) =>
    setAnswers((prev) => ({ ...prev, [fieldId]: val }));

  const currentPage = pages[pageIndex] ?? { fields: [] };
  const isLastPage = pageIndex === totalPages - 1;

  // Validate current page required fields
  const currentPageValid = currentPage.fields
    .filter((f) => f.required)
    .every((f) => {
      const val = answers[f.id];
      if (Array.isArray(val)) return val.length > 0;
      return typeof val === "string" && val.trim() !== "";
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.set("auditionId", session.id);
      if (selectedCategory) fd.set("category", selectedCategory);

      for (const page of pages) {
        for (const field of page.fields) {
          const val = answers[field.id];
          if (field.type === "file") {
            const input = fileRefs.current.get(field.id);
            const file = input?.files?.[0];
            if (file) fd.set(`answers[${field.id}]`, file, file.name);
          } else if (field.type === "checkbox" && Array.isArray(val)) {
            for (const v of val) fd.append(`answers[${field.id}]`, v);
          } else {
            fd.set(`answers[${field.id}]`, typeof val === "string" ? val : "");
          }
        }
      }

      const res = await fetch("/api/audition/submit", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({})) as { id?: string; code?: string };

      if (!res.ok) {
        const messages: Record<string, string> = {
          ALREADY_SUBMITTED: "이미 이번 오디션에 지원서를 제출하셨습니다.",
          AUDITION_NOT_FOUND: "현재 접수 중인 오디션이 없습니다.",
          AUDITION_CLOSED: "오디션 접수 기간이 종료되었습니다.",
          RATE_LIMITED: "일시적으로 제출이 제한되었습니다. 잠시 후 다시 시도해주세요.",
          REQUIRED_FIELD_MISSING: "필수 항목을 모두 입력해주세요.",
          FILE_TOO_LARGE: "첨부 파일 크기가 50 MB를 초과합니다.",
          INVALID_FILE: "허용되지 않는 파일 형식입니다.",
        };
        throw new Error(messages[data.code ?? ""] ?? "지원서 제출에 실패했습니다. 다시 시도해주세요.");
      }

      setSubmittedId(data.id ?? "done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submittedId) {
    return (
      <div className={styles.successScreen}>
        <div className={styles.successIcon}><Check aria-hidden="true" /></div>
        <h2>지원서가 접수되었습니다</h2>
        <p>검토 결과는 추후 안내 드리겠습니다.<br />지원해주셔서 감사합니다.</p>
        <p className={styles.successEmail}>{userEmail}으로 접수 내역이 전송됩니다.</p>
      </div>
    );
  }

  // ── Category selection step ─────────────────────────────────────────────────
  if (categories.length > 1 && !categoryConfirmed) {
    return (
      <div className={styles.form}>
        <div className={styles.formGroup}>
          <p className={styles.fieldLabel}>
            지원 분과를 선택해주세요<span className={styles.required} aria-hidden="true"> *</span>
          </p>
          <div className={styles.categoryGrid}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`${styles.categoryChip} ${selectedCategory === cat ? styles.categoryChipActive : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.pageNav}>
          <span />
          <button
            type="button"
            className={styles.pageNavNext}
            disabled={!selectedCategory}
            onClick={() => {
              if (selectedCategory) {
                setCategoryConfirmed(true);
                setPageIndex(0);
                // Re-init answers for the chosen schema
                const chosenSchema =
                  session.category_forms?.[selectedCategory]?.length
                    ? session.category_forms[selectedCategory]
                    : session.form_schema;
                const init: Answers = {};
                for (const f of chosenSchema) {
                  init[f.id] = f.type === "checkbox" ? [] : "";
                }
                setAnswers(init);
              }
            }}
          >
            다음 <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────────────
  return (
    <form ref={formRef} onSubmit={(e) => void handleSubmit(e)} noValidate className={styles.form}>
      {error && (
        <div className={styles.errorBanner} role="alert">
          <CircleAlert aria-hidden="true" />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="닫기">×</button>
        </div>
      )}

      {/* Page progress (only when multiple pages) */}
      {totalPages > 1 && (
        <div className={styles.pageProgress}>
          <div className={styles.pageProgressBar}>
            <div
              className={styles.pageProgressFill}
              style={{ width: `${((pageIndex + 1) / totalPages) * 100}%` }}
            />
          </div>
          <div className={styles.pageProgressLabel}>
            <span>{currentPage.title ?? `${pageIndex + 1}단계`}</span>
            <span>{pageIndex + 1} / {totalPages}</span>
          </div>
        </div>
      )}

      {/* Page title */}
      {totalPages > 1 && currentPage.title && (
        <h2 className={styles.pageTitle}>{currentPage.title}</h2>
      )}

      {/* Fields for current page */}
      {currentPage.fields.map((field) => (
        <div key={field.id} className={styles.formGroup}>
          <label className={styles.fieldLabel}>
            {field.label}
            {field.required && <span className={styles.required} aria-hidden="true"> *</span>}
          </label>
          <DynamicField
            field={field}
            value={answers[field.id] ?? (field.type === "checkbox" ? [] : "")}
            onChange={(val) => setAnswer(field.id, val)}
            fileRefs={fileRefs}
          />
        </div>
      ))}

      {/* Navigation */}
      {totalPages > 1 ? (
        <div className={styles.pageNav}>
          <button
            type="button"
            className={styles.pageNavBack}
            onClick={() => {
              if (pageIndex === 0 && categories.length > 1) {
                setCategoryConfirmed(false);
              } else {
                setPageIndex((i) => Math.max(0, i - 1));
              }
            }}
          >
            <ArrowLeft aria-hidden="true" />
            {pageIndex === 0 && categories.length > 1 ? "분과 변경" : "이전"}
          </button>

          {isLastPage ? (
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || !currentPageValid}
            >
              {submitting ? "제출 중…" : <><Send aria-hidden="true" />지원서 제출</>}
            </button>
          ) : (
            <button
              type="button"
              className={styles.pageNavNext}
              disabled={!currentPageValid}
              onClick={() => setPageIndex((i) => Math.min(totalPages - 1, i + 1))}
            >
              다음 <ArrowRight aria-hidden="true" />
            </button>
          )}
        </div>
      ) : (
        <div className={styles.formFooter}>
          <p className={styles.formNote}>
            접수 이메일: <b>{userEmail}</b>
          </p>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting || (categories.length > 1 && !selectedCategory)}
          >
            {submitting ? "제출 중…" : <><Send aria-hidden="true" />지원서 제출</>}
          </button>
        </div>
      )}
    </form>
  );
}
