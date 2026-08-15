"use client";

import {
  ArrowLeft,
  BrainCircuit,
  ExternalLink,
  FileImage,
  Link,
  Paperclip,
} from "lucide-react";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import { AdminToast } from "@/admin/components/feedback/AdminFeedback";
import { safeHref } from "@/core/http/safe-href";
import styles from "@/styles/(admin)/pages/protect/protect-admin.module.css";
import {
  type ProtectReport,
  type ReportStatus,
  severityClass,
  severityLabel,
} from "./protect-types";

type StatusOption = { value: ReportStatus; label: string };

type ProtectReportDetailProps = {
  viewing: ProtectReport;
  avatarUrl?: string;
  readerName: string | null;
  readerAvatarUrl?: string;
  signedUrls: Record<string, string>;
  error: string;
  toast: string;
  undoStatus: ReportStatus | null;
  note: string;
  saving: boolean;
  statuses: StatusOption[];
  reportTypeLabels: Record<string, string>;
  statusLabel: (status: string) => string;
  statusClass: (status: string) => string;
  formatDate: (value: string, detail?: boolean) => string;
  isImage: (name: string) => boolean;
  onBack: () => void;
  onClearError: () => void;
  onUndoStatus: () => void;
  onNoteChange: (value: string) => void;
  onSaveNote: () => void;
  onChangeStatus: (status: ReportStatus) => void;
};

export default function ProtectReportDetail({
  viewing,
  avatarUrl,
  readerName,
  readerAvatarUrl,
  signedUrls,
  error,
  toast,
  undoStatus,
  note,
  saving,
  statuses,
  reportTypeLabels,
  statusLabel,
  statusClass,
  formatDate,
  isImage,
  onBack,
  onClearError,
  onUndoStatus,
  onNoteChange,
  onSaveNote,
  onChangeStatus,
}: ProtectReportDetailProps) {
  return (
    <div className={`${styles.page} ${styles.detailPage}`}>
      <AdminToast
        message={toast}
        actionLabel={undoStatus ? "되돌리기" : undefined}
        onAction={undoStatus ? () => void onUndoStatus() : undefined}
      />
      <button type="button" className={styles.back} onClick={onBack}>
        <ArrowLeft aria-hidden="true" /> 접수 목록
      </button>
      {error && (
        <div className={styles.error} role="alert">
          <b>!</b>
          <span>{error}</span>
          <button type="button" onClick={onClearError}>
            닫기
          </button>
        </div>
      )}

      <article className={styles.detailCard} data-tour-id="protect-workspace">
        <header className={styles.detailHeader}>
          <span className={styles.detailIcon}>
            {avatarUrl ? (
              <AdminAssetImage
                src={avatarUrl}
                alt="제보자 아바타"
                sizes="56px"
              />
            ) : (
              <b aria-hidden="true">
                {(viewing.reporter_email?.[0] || "A").toUpperCase()}
              </b>
            )}
          </span>
          <div>
            <p>{reportTypeLabels[viewing.report_type] || "기타"}</p>
            <h1>{viewing.title}</h1>
            <small>
              {formatDate(viewing.created_at, true)} 접수 ·{" "}
              {viewing.id.slice(0, 8).toUpperCase()}
            </small>
          </div>
          <span className={`${styles.status} ${statusClass(viewing.status)}`}>
            <i />
            {statusLabel(viewing.status)}
          </span>
        </header>

        <div className={styles.readMeta}>
          <span
            className={`${styles.severity} ${
              styles[
                severityClass(
                  viewing.ai_classified_at ? viewing.severity : "pending",
                )
              ]
            }`}
          >
            <BrainCircuit aria-hidden="true" />
            {viewing.ai_classified_at
              ? `AI 우선순위 · ${severityLabel(viewing.severity)}`
              : "AI 분류 대기 중"}
          </span>
          <span className={styles.readerInfo}>
            {readerAvatarUrl && viewing.read_at ? (
              <AdminAssetImage src={readerAvatarUrl} alt="" sizes="22px" />
            ) : null}
            {viewing.read_at
              ? `${readerName || "관리자가 열람함"} · ${formatDate(viewing.read_at, true)}`
              : "아직 열람하지 않음"}
          </span>
        </div>

        <div className={styles.detailBody}>
          <section>
            <div className={styles.sectionHeading}>
              <span>REPORT</span>
              <h2>제보 내용</h2>
            </div>
            <p className={styles.reportContent}>{viewing.content}</p>
          </section>

          <section>
            <div className={styles.sectionHeading}>
              <span>SOURCE</span>
              <h2>게시물 정보</h2>
            </div>
            <dl className={styles.infoGrid}>
              <div>
                <dt>보호 대상</dt>
                <dd>{viewing.artists?.name || "-"}</dd>
              </div>
              <div>
                <dt>플랫폼</dt>
                <dd>{viewing.platform}</dd>
              </div>
              <div>
                <dt>게시 일자</dt>
                <dd>{formatDate(viewing.posted_at)}</dd>
              </div>
              <div>
                <dt>게시물 작성자</dt>
                <dd>{viewing.author_name}</dd>
              </div>
              <div>
                <dt>게시물 IP</dt>
                <dd>{viewing.post_ip || "미입력"}</dd>
              </div>
              <div>
                <dt>제보 계정</dt>
                <dd>{viewing.reporter_email || "확인 불가"}</dd>
              </div>
            </dl>
            <a
              className={styles.sourceLink}
              data-tour-id="protect-source"
              href={safeHref(viewing.post_url)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Link aria-hidden="true" />
              <span>
                <b>원문 게시물 열기</b>
                <small>{viewing.post_url}</small>
              </span>
              <ExternalLink aria-hidden="true" />
            </a>
          </section>

          <section>
            <div className={styles.sectionHeading}>
              <span>AI TRIAGE</span>
              <h2>우선순위 분류</h2>
            </div>
            <dl className={styles.infoGrid}>
              <div>
                <dt>심각도</dt>
                <dd>
                  {viewing.ai_classified_at
                    ? severityLabel(viewing.severity)
                    : "미분류"}
                </dd>
              </div>
              <div>
                <dt>분류 시각</dt>
                <dd>
                  {viewing.ai_classified_at
                    ? formatDate(viewing.ai_classified_at, true)
                    : "처리 대기 중"}
                </dd>
              </div>
            </dl>
            {viewing.ai_reasoning && (
              <p className={styles.reportContent}>{viewing.ai_reasoning}</p>
            )}
          </section>

          <section data-tour-id="protect-evidence">
            <div className={styles.sectionHeading}>
              <span>EVIDENCE</span>
              <h2>첨부 자료</h2>
            </div>
            <div className={styles.evidenceGrid}>
              {viewing.protect_report_attachments.map(
                ({ file_path, file_name }) => {
                  const url = signedUrls[file_path];
                  return (
                    <a
                      key={file_path}
                      className={styles.evidenceCard}
                      href={url || undefined}
                      target="_blank"
                      rel="noreferrer"
                      aria-disabled={!url}
                    >
                      <span className={styles.evidencePreview}>
                        {url && isImage(file_name) ? (
                          <AdminAssetImage src={url} alt="" sizes="96px" />
                        ) : isImage(file_name) ? (
                          <FileImage aria-hidden="true" />
                        ) : (
                          <Paperclip aria-hidden="true" />
                        )}
                      </span>
                      <span>
                        <b>{file_name}</b>
                        <small>
                          {url ? "새 창에서 원본 열기" : "보안 링크 생성 중…"}
                        </small>
                      </span>
                      <ExternalLink aria-hidden="true" />
                    </a>
                  );
                },
              )}
            </div>
          </section>

          <section data-tour-id="protect-memo">
            <div className={styles.sectionHeading}>
              <span>INTERNAL</span>
              <h2>관리자 메모</h2>
            </div>
            <textarea
              className={styles.adminNote}
              rows={5}
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="검토 내용과 후속 조치를 기록해 주세요."
            />
            <div className={styles.noteActions}>
              <span>관리자만 볼 수 있는 내부 기록입니다.</span>
              <button
                type="button"
                disabled={saving || note === (viewing.admin_note || "")}
                onClick={onSaveNote}
              >
                메모 저장
              </button>
            </div>
          </section>
        </div>

        <footer className={styles.statusBar} data-tour-id="protect-status">
          <div>
            <span>STATUS</span>
            <b>처리 상태 변경</b>
            <small>상태와 관리자 메모는 즉시 반영됩니다.</small>
          </div>
          <div>
            {statuses.map((status) => (
              <button
                key={status.value}
                type="button"
                disabled={saving}
                className={viewing.status === status.value ? styles.active : ""}
                onClick={() => void onChangeStatus(status.value)}
              >
                {status.label}
              </button>
            ))}
          </div>
        </footer>
      </article>
    </div>
  );
}
