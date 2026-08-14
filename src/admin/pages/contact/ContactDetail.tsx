"use client";

import {
  ArrowLeft,
  BriefcaseBusiness,
  ExternalLink,
  Mail,
  MessageSquareText,
  Paperclip,
} from "lucide-react";
import { AdminToast } from "@/admin/components/feedback/AdminFeedback";
import type { ContactInquiry, ContactStatus } from "./useContactInquiries";
import {
  formatBytes,
  formatDate,
  statuses,
  statusClass,
  statusLabel,
  typeLabels,
} from "./contact-utils";
import base from "@/styles/(admin)/pages/protect/protect-admin.module.css";
import styles from "@/styles/(admin)/pages/contact/contact-admin.module.css";

export type ContactUndo = {
  id: string;
  previous: ContactStatus;
};

type ContactDetailProps = {
  viewing: ContactInquiry;
  note: string;
  attachmentUrl: string;
  saving: boolean;
  error: string;
  toast: string;
  undo: ContactUndo | null;
  onBack: () => void;
  onClearError: () => void;
  onUndo: () => void;
  onChangeStatus: (status: ContactStatus) => void;
  onNoteChange: (value: string) => void;
  onSaveNote: () => void;
};

export default function ContactDetail({
  viewing,
  note,
  attachmentUrl,
  saving,
  error,
  toast,
  undo,
  onBack,
  onClearError,
  onUndo,
  onChangeStatus,
  onNoteChange,
  onSaveNote,
}: ContactDetailProps) {
  const isBusiness = viewing.category === "business";

  return (
    <div className={`${base.page} ${base.detailPage} ${styles.fullPage}`}>
      <AdminToast
        message={toast}
        actionLabel={undo ? "되돌리기" : undefined}
        onAction={undo ? onUndo : undefined}
      />
      <button
        type="button"
        className={`${base.back} ${styles.fullWidth}`}
        onClick={onBack}
      >
        <ArrowLeft aria-hidden="true" /> 문의 목록
      </button>
      {error && (
        <div className={`${base.error} ${styles.fullWidth}`} role="alert">
          <b>!</b>
          <span>{error}</span>
          <button type="button" onClick={onClearError}>
            닫기
          </button>
        </div>
      )}

      <article
        className={`${base.detailCard} ${styles.fullWidth}`}
        data-tour-id="contact-workspace"
      >
        <header className={base.detailHeader}>
          <span className={base.detailIcon}>
            {isBusiness ? (
              <BriefcaseBusiness aria-hidden="true" />
            ) : (
              <MessageSquareText aria-hidden="true" />
            )}
          </span>
          <div>
            <p>{typeLabels[viewing.inquiry_type] || "기타 문의"}</p>
            <h1>{viewing.company_name || viewing.contact_name}님의 문의</h1>
            <small>
              {formatDate(viewing.created_at, true)} 접수 ·{" "}
              {viewing.id.slice(0, 8).toUpperCase()}
            </small>
          </div>
          <span className={`${base.status} ${statusClass(viewing.status)}`}>
            <i />
            {statusLabel(viewing.status)}
          </span>
        </header>

        <div className={base.detailBody}>
          <section>
            <div className={base.sectionHeading}>
              <span>MESSAGE</span>
              <h2>{isBusiness ? "제안 내용" : "문의 내용"}</h2>
            </div>
            <p className={base.reportContent}>{viewing.message}</p>
          </section>

          <section>
            <div className={base.sectionHeading}>
              <span>CONTACT</span>
              <h2>문의자 정보</h2>
            </div>
            <dl className={base.infoGrid}>
              <div>
                <dt>{isBusiness ? "담당자" : "이름"}</dt>
                <dd>{viewing.contact_name}</dd>
              </div>
              <div>
                <dt>문의 유형</dt>
                <dd>
                  {typeLabels[viewing.inquiry_type] || viewing.inquiry_type}
                </dd>
              </div>
              {isBusiness && (
                <div>
                  <dt>회사명 / 소속</dt>
                  <dd>{viewing.company_name || "-"}</dd>
                </div>
              )}
              <div>
                <dt>연락처</dt>
                <dd>{viewing.phone || "미입력"}</dd>
              </div>
              <div>
                <dt>로그인 제출</dt>
                <dd>{viewing.user_id ? "로그인 계정" : "비회원"}</dd>
              </div>
            </dl>
            <a className={base.sourceLink} href={`mailto:${viewing.email}`}>
              <Mail aria-hidden="true" />
              <span>
                <b>이메일로 답변하기</b>
                <small>{viewing.email}</small>
              </span>
              <ExternalLink aria-hidden="true" />
            </a>
            <div className={styles.answerRecord}>
              <span>
                {viewing.answered_at
                  ? `${formatDate(viewing.answered_at, true)} 답변 완료 기록`
                  : "메일 발송 후 답변 완료를 별도로 기록하세요."}
              </span>
              <button
                type="button"
                disabled={saving || viewing.status === "answered"}
                onClick={() => onChangeStatus("answered")}
              >
                답변 완료로 기록
              </button>
            </div>
          </section>

          {isBusiness && (
            <section>
              <div className={base.sectionHeading}>
                <span>PROPOSAL</span>
                <h2>제안서 첨부</h2>
              </div>
              {viewing.attachment_path ? (
                <div className={base.evidenceGrid}>
                  <a
                    className={base.evidenceCard}
                    href={attachmentUrl || undefined}
                    target="_blank"
                    rel="noreferrer"
                    aria-disabled={!attachmentUrl}
                  >
                    <span className={base.evidencePreview}>
                      <Paperclip aria-hidden="true" />
                    </span>
                    <span>
                      <b>{viewing.attachment_name || "첨부 파일"}</b>
                      <small>
                        {attachmentUrl
                          ? `${formatBytes(viewing.attachment_size)} · 새 창에서 열기`
                          : "보안 링크 생성 중..."}
                      </small>
                    </span>
                    <ExternalLink aria-hidden="true" />
                  </a>
                </div>
              ) : (
                <p className={styles.noAttachment}>첨부된 제안서가 없습니다.</p>
              )}
            </section>
          )}

          {!isBusiness && (
            <section>
              <div className={base.sectionHeading}>
                <span>SUBMISSION</span>
                <h2>접수 정보</h2>
              </div>
              <dl className={base.infoGrid}>
                <div>
                  <dt>접수일</dt>
                  <dd>{formatDate(viewing.created_at, true)}</dd>
                </div>
                <div>
                  <dt>접수 번호</dt>
                  <dd>{viewing.id.slice(0, 8).toUpperCase()}</dd>
                </div>
                <div>
                  <dt>접수 경로</dt>
                  <dd>{viewing.user_id ? "로그인 계정" : "비회원"}</dd>
                </div>
                <div>
                  <dt>개인정보 동의</dt>
                  <dd>동의 완료</dd>
                </div>
              </dl>
            </section>
          )}

          <section data-tour-id="contact-memo">
            <div className={base.sectionHeading}>
              <span>INTERNAL</span>
              <h2>관리자 메모</h2>
            </div>
            <textarea
              className={base.adminNote}
              rows={5}
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="검토 내용과 후속 조치를 기록해 주세요."
            />
            <div className={base.noteActions}>
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

        <footer className={base.statusBar} data-tour-id="contact-status">
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
                className={viewing.status === status.value ? base.active : ""}
                onClick={() => onChangeStatus(status.value)}
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
