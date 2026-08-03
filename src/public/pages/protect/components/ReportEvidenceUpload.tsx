import type { ChangeEvent } from "react";
import { Trash2, Upload } from "lucide-react";
import { useLocale } from "@/core/providers/LocaleContext";
import styles from "@/styles/(public)/pages/protect.module.css";

type Props = { fileSlots: Array<File | null>; files: File[]; onAddFiles: (event: ChangeEvent<HTMLInputElement>) => void; onRemoveFile: (slot: number) => void };

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)}KB` : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function ReportEvidenceUpload({ fileSlots, files, onAddFiles, onRemoveFile }: Props) {
  const { t } = useLocale();
  return <div className={`${styles.formRow} ${styles.alignTop}`}>
    <span className={styles.rowLabel}>{t.protect.fields.evidence} <i>*</i></span>
    <div className={styles.fileUploadArea}>
      <label className={styles.uploadButton}>
        <Upload aria-hidden="true" />
        <span><b>{t.protect.upload}</b><small>{t.protect.uploadHint}</small></span>
        <em>{files.length} / 3</em>
        <input id="evidenceFiles" type="file" multiple disabled={files.length >= 3} accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={onAddFiles} />
      </label>
      {files.length > 0 && <div className={styles.fileList}>{fileSlots.map((file, index) => file && <div className={styles.fileItem} key={`${file.name}-${file.lastModified}`}><span>{file.name}<small>{formatBytes(file.size)}</small></span><button type="button" onClick={() => onRemoveFile(index)} aria-label={t.protect.removeFile(file.name)}><Trash2 aria-hidden="true" /></button></div>)}</div>}
    </div>
  </div>;
}
