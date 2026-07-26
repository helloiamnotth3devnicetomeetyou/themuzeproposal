"use client";

import type { ChangeEventHandler } from "react";
import { LuCheck } from "react-icons/lu";
import CustomSelect from "@/core/components/form/CustomSelect";
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

const reportTypes = [
  { value: "defamation", label: "명예훼손·허위사실" },
  { value: "harassment", label: "악성 댓글·비방" },
  { value: "impersonation", label: "사칭·계정 도용" },
  { value: "copyright", label: "저작권·콘텐츠 침해" },
  { value: "privacy", label: "개인정보 노출" },
  { value: "other", label: "기타" },
];

const platforms = ["Instagram", "X (Twitter)", "YouTube", "TikTok", "Facebook", "커뮤니티·게시판", "기타"];

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
  return (
    <>
      <div className={styles.formRow}>
        <span className={styles.rowLabel}>아티스트 <i>*</i></span>
        <div id="artist" className={styles.selectControl}>
          <CustomSelect className={styles.customSelect} ariaLabel="아티스트" value={form.artistId} onChange={updateSelect("artistId")} placeholder="아티스트를 선택해 주세요" options={artists.map((artist) => ({ value: artist.id, label: artist.name }))} />
        </div>
      </div>
      <div className={styles.formRow}>
        <span className={styles.rowLabel}>신고 유형 <i>*</i></span>
        <div id="reportType" className={styles.selectControl}>
          <CustomSelect className={styles.customSelect} ariaLabel="신고 유형" value={form.reportType} onChange={updateSelect("reportType")} placeholder="신고 유형을 선택해 주세요" options={reportTypes} />
        </div>
      </div>
      <div className={styles.formRow}>
        <label htmlFor="title">제목 <i>*</i></label>
        <div className={styles.controlWithMeta}>
          <input id="title" required maxLength={120} value={form.title} onChange={updateField("title")} placeholder="신고 주요 내용을 입력해 주세요" />
          <span>{form.title.length} / 120</span>
        </div>
      </div>
      <div className={`${styles.formRow} ${styles.alignTop}`}>
        <label htmlFor="content">신고 내용 <i>*</i></label>
        <div className={styles.controlWithMeta}>
          <textarea id="content" required rows={6} maxLength={5000} value={form.content} onChange={updateField("content")} placeholder="침해 내용과 발생 경위를 자세히 입력해 주세요" />
          <span>{form.content.length} / 5,000</span>
        </div>
      </div>
      <div className={styles.formRow}>
        <span className={styles.rowLabel}>게시 플랫폼 <i>*</i></span>
        <div id="platform" className={styles.selectControl}>
          <CustomSelect className={styles.customSelect} ariaLabel="게시 플랫폼" value={form.platform} onChange={updateSelect("platform")} placeholder="신고할 게시물이 업로드된 플랫폼을 선택해 주세요" options={platforms.map((platform) => ({ value: platform, label: platform }))} />
        </div>
      </div>
      <div className={styles.formRow}><label htmlFor="postUrl">게시물 URL <i>*</i></label><input id="postUrl" type="url" inputMode="url" required value={form.postUrl} onChange={updateField("postUrl")} placeholder="신고할 게시물의 URL을 입력해 주세요" /></div>
      <div className={styles.formRow}><label htmlFor="postedAt">게시 일자 <i>*</i></label><input id="postedAt" type="date" required max={new Date().toISOString().slice(0, 10)} value={form.postedAt} onChange={updateField("postedAt")} /></div>
      <div className={styles.formRow}><label htmlFor="authorName">게시물 작성자 <i>*</i></label><input id="authorName" required maxLength={120} value={form.authorName} onChange={updateField("authorName")} placeholder="게시물 작성자의 ID 또는 닉네임을 입력해 주세요" /></div>
      <div className={styles.formRow}><label htmlFor="postIp">게시물 IP 주소</label><input id="postIp" maxLength={64} value={form.postIp} onChange={updateField("postIp")} placeholder="확인된 IP 주소가 있다면 입력해 주세요 (선택)" /></div>
      <ReportEvidenceUpload fileSlots={fileSlots} files={files} onAddFiles={addFiles} onRemoveFile={removeFile} />
      <p className={styles.guide}>캡처 날짜, 게시물 내용, URL, 작성자 정보가 보이도록 저장해 주세요.<br />내용이 길다면 순서를 알 수 있도록 여러 장으로 첨부해 주세요.</p>
      <label className={styles.confirm}>
        <input id="reportConfirmation" type="checkbox" checked={confirmed} onChange={(event) => onConfirmedChange(event.target.checked)} />
        <span><LuCheck aria-hidden="true" /></span>
        본 신고 내용이 허위나 조작 없이 사실에 근거해 작성되었음을 확인합니다.
      </label>
      {missingFields.length > 0 && <div className={styles.validationSummary} role="alert"><b>입력하지 않은 항목</b><p>{missingFields.join(" · ")}</p></div>}
      <p className={styles.submitHint}>내용을 확인한 뒤 등록 버튼을 1.5초 동안 길게 눌러주세요.</p>
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
        {submitting ? "안전하게 전송하는 중…" : holdingSubmit ? "계속 누르세요…" : "1.5초 길게 눌러 등록"}
      </button>
    </>
  );
}
