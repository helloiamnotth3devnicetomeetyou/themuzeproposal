"use client";

import { Check, CircleAlert, Trash2, Upload } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import CustomSelect from "@/core/components/form/CustomSelect";
import {
  auditionTextareaRows,
  fieldLabel,
  type AuditionFormField,
} from "@/core/auditions/types";
import protectStyles from "@/styles/(public)/pages/protect.module.css";
import styles from "@/styles/(public)/pages/audition.module.css";
import { auditionMessages } from "./messages";

export type CampaignFormValues = Record<string, string | string[]>;
export type CampaignStoredFile = {
  path: string;
  name: string;
  size: number;
  mimeType: string;
};
type Messages = (typeof auditionMessages)["ko"];

const EMAIL_KEYS = new Set(["email", "applicant_email"]);
const ALL_FILE_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,video/mp4,audio/mpeg,application/pdf";

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)}KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function CampaignFormFields({
  fields,
  locale,
  messages,
  values,
  files,
  restoredValues,
  error,
  setError,
  setValue,
  existingFile,
  setFiles,
  setRemovedFiles,
  setDraftDirty,
  onReview,
  reviewLabel,
}: {
  fields: AuditionFormField[];
  locale: string;
  messages: Messages;
  values: CampaignFormValues;
  files: Record<string, File | null>;
  restoredValues: CampaignFormValues | null;
  error: string;
  setError: (value: string) => void;
  setValue: (key: string, value: string | string[]) => void;
  existingFile: (field: AuditionFormField) => CampaignStoredFile | null;
  setFiles: Dispatch<SetStateAction<Record<string, File | null>>>;
  setRemovedFiles: Dispatch<SetStateAction<Set<string>>>;
  setDraftDirty: (value: boolean) => void;
  onReview: () => void;
  reviewLabel: string;
}) {
  return (
    <section className={protectStyles.form}>
      {restoredValues && <p role="status">{messages.draftRestored}</p>}
      {error && (
        <div className={protectStyles.error} role="alert">
          <CircleAlert aria-hidden="true" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label={messages.closeError}
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
                  placeholder={messages.select}
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
                        ? messages.replaceFile
                        : messages.chooseFile}
                    </b>
                    <small>
                      {messages.maxFile(field.max_file_size_mb ?? 20)}
                    </small>
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
                      if (file) setDraftDirty(true);
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
                            : messages.existingFile}
                        </small>
                      </span>
                      <button
                        type="button"
                        aria-label={messages.removeFile}
                        onClick={() => {
                          setFiles((current) => ({
                            ...current,
                            [field.field_key]: null,
                          }));
                          setRemovedFiles((current) =>
                            new Set(current).add(field.field_key),
                          );
                          setDraftDirty(true);
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
        onClick={onReview}
      >
        {reviewLabel}
      </button>
    </section>
  );
}
