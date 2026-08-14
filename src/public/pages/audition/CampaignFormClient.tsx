"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Send } from "lucide-react";
import TurnstileWidget, {
  type TurnstileWidgetHandle,
} from "@/core/components/form/TurnstileWidget";
import {
  fieldLabel,
  type AuditionAnswer,
  type AuditionCampaign,
  type AuditionFormField,
  type AuditionSubmission,
} from "@/core/auditions/types";
import { useLocale } from "@/core/providers/LocaleContext";
import {
  readSessionDraft,
  removeSessionDraft,
  writeSessionDraft,
} from "@/core/browser/session-draft";
import protectStyles from "@/styles/(public)/pages/protect.module.css";
import styles from "@/styles/(public)/pages/audition.module.css";
import CampaignFormFields, {
  type CampaignFormValues,
  type CampaignStoredFile,
} from "./CampaignFormFields";
import { auditionMessages } from "./messages";

type SavedDraft = {
  owner: string;
  values: CampaignFormValues;
  removedFiles: string[];
};

const EMAIL_KEYS = new Set(["email", "applicant_email"]);

function isDraftValue(value: unknown): value is string | string[] {
  return (
    typeof value === "string" ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

function isStoredFile(
  value: AuditionAnswer | undefined,
): value is CampaignStoredFile {
  return (
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.path === "string"
  );
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
  const draftStorageKey = `themuze:audition-draft:${campaign.id}:${initialSubmission?.id || "new"}`;
  const [savedDraft] = useState(() =>
    readSessionDraft<SavedDraft>(draftStorageKey),
  );
  const restoredValues =
    savedDraft?.owner === userEmail ? savedDraft.values : null;
  const [values, setValues] = useState<CampaignFormValues>(() =>
    Object.fromEntries(
      fields.map((field) => {
        const savedValue = restoredValues?.[field.field_key];
        const answer = isDraftValue(savedValue)
          ? savedValue
          : initialAnswers[field.field_key];
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
  const [removedFiles, setRemovedFiles] = useState<Set<string>>(
    () =>
      new Set(
        savedDraft?.owner === userEmail
          ? savedDraft.removedFiles?.filter((key) => typeof key === "string")
          : [],
      ),
  );
  const [draftDirty, setDraftDirty] = useState(Boolean(restoredValues));
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedId, setSavedId] = useState("");
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const setValue = (key: string, value: string | string[]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setDraftDirty(true);
  };

  const existingFile = (field: AuditionFormField) => {
    const answer = initialAnswers[field.field_key];
    return !removedFiles.has(field.field_key) && isStoredFile(answer)
      ? answer
      : null;
  };

  useEffect(() => {
    if (!draftDirty) return;
    writeSessionDraft(draftStorageKey, {
      owner: userEmail,
      values,
      removedFiles: [...removedFiles],
    });
  }, [draftDirty, draftStorageKey, removedFiles, userEmail, values]);

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
    if (initialSubmission) formData.set("submissionId", initialSubmission.id);
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
      removeSessionDraft(draftStorageKey);
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
    <CampaignFormFields
      fields={fields}
      locale={locale}
      messages={m}
      values={values}
      files={files}
      restoredValues={restoredValues}
      error={error}
      setError={setError}
      setValue={setValue}
      existingFile={existingFile}
      setFiles={setFiles}
      setRemovedFiles={setRemovedFiles}
      setDraftDirty={setDraftDirty}
      onReview={openReview}
      reviewLabel={initialSubmission ? m.reviewChanges : m.reviewSubmission}
    />
  );
}
