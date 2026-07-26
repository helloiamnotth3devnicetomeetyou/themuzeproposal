"use client";

import type { ChangeEventHandler } from "react";
import { LuCheck } from "react-icons/lu";
import CustomSelect from "@/core/components/form/CustomSelect";
import { useLocale } from "@/core/providers/LocaleContext";
import type { Artist } from "../ProtectClient";
import ReportEvidenceUpload from "./ReportEvidenceUpload";
import styles from "@/styles/(public)/pages/protect.module.css";

export type ReportFormValues = {
  artistId: string;
  reportType: string;
  title: string;
  content: string;
  platform: string;
  postUrl: string;
  postedAt: string;
  authorName: string;
  postIp: string;
};

type Props = {
  artists: Artist[];
  form: ReportFormValues;
  fileSlots: Array<File | null>;
  files: File[];
  confirmed: boolean;
  missingFields: string[];
  holdingSubmit: boolean;
  submitting: boolean;
  updateField: (field: keyof ReportFormValues) => ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  updateSelect: (field: keyof ReportFormValues) => (value: string) => void;
  addFiles: ChangeEventHandler<HTMLInputElement>;
  removeFile: (slot: number) => void;
  onConfirmedChange: (confirmed: boolean) => void;
  startSubmitHold: () => void;
  cancelSubmitHold: () => void;
};

export default function ReportFormFields({
  artists,
  form,
  fileSlots,
  files,
  confirmed,
  missingFields,
  holdingSubmit,
  submitting,
  updateField,
  updateSelect,
  addFiles,
  removeFile,
  onConfirmedChange,
  startSubmitHold,
  cancelSubmitHold,
}: Props) {
  const { t } = useLocale();
  const fields = t.protect.fields;
  const placeholders = t.protect.placeholders;
  return (
    <>
      <div className={styles.formRow}>
        <span className={styles.rowLabel}>{fields.artist} <i>*</i></span>
        <div id="artist" className={styles.selectControl}>
          <CustomSelect className={styles.customSelect} ariaLabel={fields.artist} value={form.artistId} onChange={updateSelect("artistId")} placeholder={placeholders.artist} options={artists.map((artist) => ({ value: artist.id, label: artist.name }))} />
        </div>
      </div>
      <div className={styles.formRow}>
        <span className={styles.rowLabel}>{fields.reportType} <i>*</i></span>
        <div id="reportType" className={styles.selectControl}>
          <CustomSelect className={styles.customSelect} ariaLabel={fields.reportType} value={form.reportType} onChange={updateSelect("reportType")} placeholder={placeholders.reportType} options={t.protect.reportTypes} />
        </div>
      </div>
      <div className={styles.formRow}>
        <label htmlFor="title">{fields.title} <i>*</i></label>
        <div className={styles.controlWithMeta}>
          <input id="title" required maxLength={120} value={form.title} onChange={updateField("title")} placeholder={placeholders.title} />
          <span>{form.title.length} / 120</span>
        </div>
      </div>
      <div className={`${styles.formRow} ${styles.alignTop}`}>
        <label htmlFor="content">{fields.content} <i>*</i></label>
        <div className={styles.controlWithMeta}>
          <textarea id="content" required rows={6} maxLength={5000} value={form.content} onChange={updateField("content")} placeholder={placeholders.content} />
          <span>{form.content.length} / 5,000</span>
        </div>
      </div>
      <div className={styles.formRow}>
        <span className={styles.rowLabel}>{fields.platform} <i>*</i></span>
        <div id="platform" className={styles.selectControl}>
          <CustomSelect className={styles.customSelect} ariaLabel={fields.platform} value={form.platform} onChange={updateSelect("platform")} placeholder={placeholders.platform} options={t.protect.platforms} />
        </div>
      </div>
      <div className={styles.formRow}><label htmlFor="postUrl">{fields.postUrl} <i>*</i></label><input id="postUrl" type="url" inputMode="url" required value={form.postUrl} onChange={updateField("postUrl")} placeholder={placeholders.postUrl} /></div>
      <div className={styles.formRow}><label htmlFor="postedAt">{fields.postedAt} <i>*</i></label><input id="postedAt" type="date" required max={new Date().toISOString().slice(0, 10)} value={form.postedAt} onChange={updateField("postedAt")} /></div>
      <div className={styles.formRow}><label htmlFor="authorName">{fields.authorName} <i>*</i></label><input id="authorName" required maxLength={120} value={form.authorName} onChange={updateField("authorName")} placeholder={placeholders.authorName} /></div>
      <div className={styles.formRow}><label htmlFor="postIp">{fields.postIp}</label><input id="postIp" maxLength={64} value={form.postIp} onChange={updateField("postIp")} placeholder={placeholders.postIp} /></div>
      <ReportEvidenceUpload fileSlots={fileSlots} files={files} onAddFiles={addFiles} onRemoveFile={removeFile} />
      <p className={styles.guide}>{t.protect.evidenceGuide}</p>
      <label className={styles.confirm}>
        <input id="reportConfirmation" type="checkbox" checked={confirmed} onChange={(event) => onConfirmedChange(event.target.checked)} />
        <span><LuCheck aria-hidden="true" /></span>
        {t.protect.confirmation}
      </label>
      {missingFields.length > 0 && <div className={styles.validationSummary} role="alert"><b>{t.protect.missingTitle}</b><p>{missingFields.join(" · ")}</p></div>}
      <p className={styles.submitHint}>{t.protect.holdHint}</p>
      <button
        className={`${styles.submit} ${holdingSubmit ? styles.holding : ""}`}
        type="button"
        disabled={submitting}
        onPointerDown={(event) => { if (event.button !== 0) return; event.currentTarget.focus(); startSubmitHold(); }}
        onPointerUp={cancelSubmitHold}
        onPointerCancel={cancelSubmitHold}
        onPointerLeave={cancelSubmitHold}
        onKeyDown={(event) => { if ((event.key === " " || event.key === "Enter") && !event.repeat) { event.preventDefault(); startSubmitHold(); } }}
        onKeyUp={(event) => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); cancelSubmitHold(); } }}
        onBlur={cancelSubmitHold}
        onContextMenu={(event) => event.preventDefault()}
      >
        {submitting ? t.protect.submitting : holdingSubmit ? t.protect.keepHolding : t.protect.submit}
      </button>
    </>
  );
}
