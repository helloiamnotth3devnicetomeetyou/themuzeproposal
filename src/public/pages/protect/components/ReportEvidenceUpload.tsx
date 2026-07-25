import type { ChangeEvent } from "react";
import { LuTrash2, LuUpload } from "react-icons/lu";
import styles from "@/styles/(public)/pages/protect.module.css";

type Props = { fileSlots: Array<File | null>; files: File[]; onAddFiles: (event: ChangeEvent<HTMLInputElement>) => void; onRemoveFile: (slot: number) => void };

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)}KB` : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function ReportEvidenceUpload({ fileSlots, files, onAddFiles, onRemoveFile }: Props) {
  return <div className={`${styles.formRow} ${styles.alignTop}`}>
    <span className={styles.rowLabel}>첨부 자료 <i>*</i></span>
    <div className={styles.fileUploadArea}>
      <label className={styles.uploadButton}>
        <LuUpload aria-hidden="true" />
        <span><b>파일 올리기</b><small>JPG, PNG, WEBP, GIF, PDF · 파일당 50MB 이하 · 최대 3개</small></span>
        <em>{files.length} / 3</em>
        <input id="evidenceFiles" type="file" multiple disabled={files.length >= 3} accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={onAddFiles} />
      </label>
      {files.length > 0 && <div className={styles.fileList}>{fileSlots.map((file, index) => file && <div className={styles.fileItem} key={`${file.name}-${file.lastModified}`}><span>{file.name}<small>{formatBytes(file.size)}</small></span><button type="button" onClick={() => onRemoveFile(index)} aria-label={`${file.name} 삭제`}><LuTrash2 aria-hidden="true" /></button></div>)}</div>}
    </div>
  </div>;
}
