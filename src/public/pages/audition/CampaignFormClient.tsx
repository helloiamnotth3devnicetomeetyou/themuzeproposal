"use client";

import { useRef, useState } from "react";
import { Check, CircleAlert, Send, Trash2, Upload } from "lucide-react";
import CustomSelect from "@/core/components/form/CustomSelect";
import TurnstileWidget, {
  type TurnstileWidgetHandle,
} from "@/core/components/form/TurnstileWidget";
import {
  auditionTextareaRows,
  fieldLabel,
  type AuditionAnswer,
  type AuditionCampaign,
  type AuditionFormField,
  type AuditionSubmission,
} from "@/core/auditions/types";
import { useLocale } from "@/core/providers/LocaleContext";
import protectStyles from "@/styles/(public)/pages/protect.module.css";
import styles from "@/styles/(public)/pages/audition.module.css";
import { auditionMessages } from "./messages";

type Values = Record<string, string | string[]>;
type StoredFile = Extract<AuditionAnswer, { path: string }>;
const EMAIL_KEYS = new Set(["email", "applicant_email"]);
const ALL_FILE_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,video/mp4,audio/mpeg,application/pdf";

function isStoredFile(value: AuditionAnswer | undefined): value is StoredFile {
  return (
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.path === "string"
  );
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)}KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function CampaignFormClient({
  campaign,
  fields,
  initialSubmission,
  userEmail,
  onSaved,
  onViewMine,
}: {
  campaign: AuditionCampaign;
  fields: AuditionFormField[];
  initialSubmission: AuditionSubmission | null;
  userEmail: string;
  onSaved: (submission: AuditionSubmission, remaining: number) => void;
  onViewMine: () => void;
}) {
  const { locale } = useLocale();
  const m = auditionMessages[locale];
  const initialAnswers = initialSubmission?.answers ?? {};
  const [values, setValues] = useState<Values>(() =>
    Object.fromEntries(
      fields.map((field) => {
        const answer = initialAnswers[field.field_key];
        return [
          field.field_key,
          typeof answer === "string" || Array.isArray(answer)
            ? answer
            : EMAIL_KEYS.has(field.field_key)
              ? userEmail
              : "",
        ];
      }),
    ),
  );
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [removedFiles, setRemovedFiles] = useState<Set<string>>(new Set());
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedId, setSavedId] = useState("");
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const submissionIdRef = useRef(initialSubmission?.id ?? "");
  const setValue = (key: string, value: string | string[]) =>
    setValues((current) => ({ ...current, [key]: value }));
  const existingFile = (field: AuditionFormField) => {
    const answer = initialAnswers[field.field_key];
    return !removedFiles.has(field.field_key) && isStoredFile(answer)
      ? answer
      : null;
  };

  const validate = () => {
    for (const field of fields) {
      const value =
        field.field_type === "file"
          ? files[field.field_key] || existingFile(field)
          : values[field.field_key];
      const label = fieldLabel(field, locale);
      if (field.required && (!value || (Array.isArray(value) && !value.length)))
        return m.required(label);
      if (
        EMAIL_KEYS.has(field.field_key) &&
        typeof value === "string" &&
        (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || value.length > 254)
      )
        return m.invalidEmail(label);
      if (field.field_type === "consent" && value !== "true")
        return m.consent(label);
      if (
        typeof value === "string" &&
        field.max_length &&
        value.length > field.max_length
      )
        return m.tooLong(label, field.max_length);
      if (
        field.field_type === "file" &&
        value instanceof File &&
        value.size > (field.max_file_size_mb ?? 20) * 1024 * 1024
      )
        return m.fileTooLarge(label);
    }
    return "";
  };

  const openReview = () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setReviewing(true);
  };
  const submit = async () => {
    if (!turnstileToken) {
      setError(m.captchaRequired);
      return;
    }
    setSubmitting(true);
    setError("");
    const formData = new FormData();
    formData.set("campaignId", campaign.id);
    formData.set("turnstileToken", turnstileToken);
    const submissionId =
      initialSubmission?.id || submissionIdRef.current || crypto.randomUUID();
    submissionIdRef.current = submissionId;
    formData.set("submissionId", submissionId);
    for (const field of fields) {
      const key = `answers[${field.field_key}]`;
      const file = files[field.field_key];
      const value = values[field.field_key];
      if (file) formData.set(key, file);
      else if (field.field_type === "file" && existingFile(field))
        formData.set(`keepFiles[${field.field_key}]`, "true");
      else if (Array.isArray(value))
        value.forEach((item) => formData.append(key, item));
      else formData.set(key, value ?? "");
    }
    try {
      const response = await fetch("/api/audition/submit", {
        method: "POST",
        body: formData,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(m.errors[body.code] || m.submitFailed);
      onSaved(
        body.submission as AuditionSubmission,
        Number(body.remaining) || 0,
      );
      setSavedId(body.submission.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : m.submitFailed);
      setReviewing(false);
      setTurnstileToken("");
      turnstileRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  };

  if (savedId)
    return (
      <section className={styles.inlineSuccess}>
        <Check aria-hidden="true" />
        <h2>{initialSubmission ? m.updated : m.saved}</h2>
        <p>
          {m.receipt} {savedId.slice(0, 8).toUpperCase()}
        </p>
        <button type="button" onClick={onViewMine}>
          {m.viewMine}
        </button>
      </section>
    );

  if (reviewing)
    return (
      <section className={styles.reviewCard}>
        <h2>{m.review}</h2>
        <p>{initialSubmission ? m.reviewUpdate : m.reviewNew}</p>
        <dl>
          {fields.map((field) => {
            const file = files[field.field_key] || existingFile(field);
            const value =
              field.field_type === "file"
                ? file?.name
                : values[field.field_key];
            return (
              <div key={field.id}>
                <dt>{fieldLabel(field, locale)}</dt>
                <dd>
                  {Array.isArray(value) ? value.join(", ") : value || "-"}
                </dd>
              </div>
            );
          })}
        </dl>
        <div className={protectStyles.formRow}>
          <TurnstileWidget
            ref={turnstileRef}
            onToken={(token) => {
              setTurnstileToken(token ?? "");
              if (token) setError("");
            }}
            action="audition_submission"
          />
        </div>
        <div className={styles.formActions}>
          <button type="button" onClick={() => setReviewing(false)}>
            {m.revise}
          </button>
          <button
            type="button"
            disabled={submitting || !turnstileToken}
            onClick={() => void submit()}
          >
            <Send aria-hidden="true" />
            {submitting
              ? m.saving
              : initialSubmission
                ? m.saveUpdate
                : m.finalSubmit}
          </button>
        </div>
      </section>
    );

  return (
    <>
      <section className={protectStyles.form}>
        {error && (
          <div className={protectStyles.error} role="alert">
            <CircleAlert aria-hidden="true" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label={m.closeError}
            >
              ×
            </button>
          </div>
        )}
        {fields.map((field) => {
          const id = `audition-${field.id}`;
          const label = fieldLabel(field, locale);
          const value = values[field.field_key];
          const selectedFile = files[field.field_key];
          const savedFile = existingFile(field);
          return (
            <div
              className={`${protectStyles.formRow} ${field.field_type === "long_text" || field.field_type === "file" ? protectStyles.alignTop : ""}`}
              key={field.id}
            >
              <label className={protectStyles.rowLabel} htmlFor={id}>
                {label}
                {field.required && <i> *</i>}
              </label>
              {(field.field_type === "short_text" ||
                field.field_type === "long_text") && (
                <div className={protectStyles.controlWithMeta}>
                  {field.field_type === "long_text" ? (
                    <textarea
                      className={styles.sizedTextarea}
                      id={id}
                      rows={auditionTextareaRows(field.max_length)}
                      maxLength={field.max_length ?? 5000}
                      value={String(value ?? "")}
                      onChange={(event) =>
                        setValue(field.field_key, event.target.value)
                      }
                    />
                  ) : (
                    <input
                      id={id}
                      type={EMAIL_KEYS.has(field.field_key) ? "email" : "text"}
                      readOnly={EMAIL_KEYS.has(field.field_key)}
                      maxLength={field.max_length ?? 255}
                      value={String(value ?? "")}
                      onChange={(event) =>
                        setValue(field.field_key, event.target.value)
                      }
                    />
                  )}
                  <span>
                    {String(value ?? "").length} /{" "}
                    {field.max_length ??
                      (field.field_type === "long_text" ? 5000 : 255)}
                  </span>
                </div>
              )}
              {field.field_type === "select" && (
                <div className={protectStyles.selectControl}>
                  <CustomSelect
                    className={protectStyles.customSelect}
                    value={String(value ?? "")}
                    ariaLabel={label}
                    placeholder={m.select}
                    options={field.options.map((option) => ({
                      value: option,
                      label: option,
                    }))}
                    onChange={(next) => setValue(field.field_key, next)}
                  />
                </div>
              )}
              {field.field_type === "date" && (
                <input
                  id={id}
                  type="date"
                  value={String(value ?? "")}
                  onChange={(event) =>
                    setValue(field.field_key, event.target.value)
                  }
                />
              )}
              {(field.field_type === "radio" ||
                field.field_type === "checkbox") && (
                <div className={styles.choiceList}>
                  {field.options.map((option) => {
                    const checked =
                      field.field_type === "checkbox"
                        ? (value as string[] | undefined)?.includes(option)
                        : value === option;
                    return (
                      <label
                        key={option}
                        className={checked ? styles.isChecked : ""}
                      >
                        <input
                          type={field.field_type}
                          name={field.field_key}
                          checked={Boolean(checked)}
                          onChange={(event) =>
                            field.field_type === "checkbox"
                              ? setValue(
                                  field.field_key,
                                  event.target.checked
                                    ? [...((value as string[]) || []), option]
                                    : ((value as string[]) || []).filter(
                                        (item) => item !== option,
                                      ),
                                )
                              : setValue(field.field_key, option)
                          }
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {field.field_type === "file" && (
                <div className={protectStyles.fileUploadArea}>
                  <label className={protectStyles.uploadButton}>
                    <Upload aria-hidden="true" />
                    <span>
                      <b>
                        {selectedFile || savedFile
                          ? m.replaceFile
                          : m.chooseFile}
                      </b>
                      <small>{m.maxFile(field.max_file_size_mb ?? 20)}</small>
                    </span>
                    <input
                      id={id}
                      type="file"
                      accept={
                        field.accepted_file_types.join(",") || ALL_FILE_TYPES
                      }
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setFiles((current) => ({
                          ...current,
                          [field.field_key]: file,
                        }));
                        if (file)
                          setRemovedFiles((current) => {
                            const next = new Set(current);
                            next.delete(field.field_key);
                            return next;
                          });
                      }}
                    />
                  </label>
                  {(selectedFile || savedFile) && (
                    <div className={protectStyles.fileList}>
                      <div className={protectStyles.fileItem}>
                        <span>
                          {selectedFile?.name || savedFile?.name}
                          <small>
                            {selectedFile
                              ? formatBytes(selectedFile.size)
                              : m.existingFile}
                          </small>
                        </span>
                        <button
                          type="button"
                          aria-label={m.removeFile}
                          onClick={() => {
                            setFiles((current) => ({
                              ...current,
                              [field.field_key]: null,
                            }));
                            setRemovedFiles((current) =>
                              new Set(current).add(field.field_key),
                            );
                          }}
                        >
                          <Trash2 aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {field.field_type === "consent" && (
                <label className={protectStyles.confirm}>
                  <input
                    id={id}
                    type="checkbox"
                    checked={value === "true"}
                    onChange={(event) =>
                      setValue(
                        field.field_key,
                        event.target.checked ? "true" : "false",
                      )
                    }
                  />
                  <span>
                    <Check aria-hidden="true" />
                  </span>
                  {field.help_text || label}
                </label>
              )}
              {field.help_text && field.field_type !== "consent" && (
                <small className={styles.fieldHelp}>{field.help_text}</small>
              )}
            </div>
          );
        })}
        <button
          className={protectStyles.submit}
          type="button"
          onClick={openReview}
        >
          {initialSubmission ? m.reviewChanges : m.reviewSubmission}
        </button>
      </section>
    </>
  );
}
