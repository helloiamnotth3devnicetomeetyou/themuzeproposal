"use client";

import { ArrowRight, Check, CircleAlert, FileText, Paperclip, Trash2 } from "lucide-react";
import CustomSelect from "@/core/components/form/CustomSelect";
import { safeHref } from "@/core/http/safe-href";
import AccountProfileLink from "@/public/components/AccountProfileLink";
import styles from "@/styles/(public)/pages/contact.module.css";
import { EMPTY_ERROR } from "./contact-model";
import { useContactForm } from "./useContactForm";

export default function ContactClient({
  initialName,
  initialEmail,
  initialAvatarUrl,
  initialRemaining,
  businessAssets,
}: {
  initialName: string;
  initialEmail: string;
  initialAvatarUrl: string;
  initialRemaining: number;
  businessAssets: { pressKitUrl: string; profilePdfUrl: string };
}) {
  const {
    messages, form, setForm, attachment, setAttachment, consented, setConsented, submitting, submittedId,
    remaining, error, setError, formRef, isBusiness, typeOptions, updateField, changeCategory, handleFile, submitInquiry,
    resetForm,
  } = useContactForm({ initialName, initialEmail, initialRemaining });
  const pressKitHref = safeHref(businessAssets.pressKitUrl);
  const profilePdfHref = safeHref(businessAssets.profilePdfUrl);

  if (submittedId) {
    return (
      <main className={styles.page}>
        <section className={styles.success} aria-labelledby="contact-success-title">
          <Check aria-hidden="true" />
          <h1 id="contact-success-title">{messages.success}</h1>
          <span>남겨주신 이메일로 순차적으로 답변드리겠습니다.</span>
          <dl>
            <div><dt>{messages.receipt}</dt><dd>{submittedId.slice(0, 8).toUpperCase()}</dd></div>
            <div><dt>{messages.category}</dt><dd>{isBusiness ? messages.business : messages.general}</dd></div>
          </dl>
          <button type="button" onClick={resetForm}>
            {messages.again} <ArrowRight aria-hidden="true" />
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerSticky}>
            <h1>CONTACT</h1>
            <p className={styles.intro}>
              {messages.intro}
            </p>
            <nav className={styles.tabs} aria-label={messages.category}>
              <button
                type="button"
                className={!isBusiness ? styles.activeTab : ""}
                aria-current={!isBusiness ? "page" : undefined}
                onClick={() => changeCategory("general")}
              >
                <span>{messages.general}</span>
              </button>
              <button
                type="button"
                className={isBusiness ? styles.activeTab : ""}
                aria-current={isBusiness ? "page" : undefined}
                onClick={() => changeCategory("business")}
              >
                <span>{messages.business}</span>
              </button>
            </nav>
            <AccountProfileLink name={initialName} email={initialEmail} avatarUrl={initialAvatarUrl} remaining={remaining} />
          </div>
        </header>

        <div className={styles.contentColumn}>
          <header className={styles.formHeader}>
            <h2>{isBusiness ? messages.businessForm : messages.form}</h2>
            <span><i>*</i> {messages.required}</span>
          </header>

          {error && (
            <div className={styles.error} role="alert">
              <CircleAlert aria-hidden="true" />
              <span>{error}</span>
              <button type="button" onClick={() => setError(EMPTY_ERROR)} aria-label="오류 메시지 닫기">×</button>
            </div>
          )}

          {isBusiness && (pressKitHref || profilePdfHref) && (
            <section className={styles.businessDownloads} aria-label="프레스킷 다운로드">
              <h3>프레스킷 다운로드</h3>
              <p>협업 검토에 필요한 공식 자료를 내려받을 수 있습니다.</p>
              <div>
                {pressKitHref && <a href={pressKitHref} download>프레스킷 ZIP</a>}
                {profilePdfHref && <a href={profilePdfHref} download>프로필 PDF</a>}
              </div>
            </section>
          )}

          <form ref={formRef} className={styles.form} onSubmit={submitInquiry} noValidate>
            <div className={styles.formRow} id="contact-inquiry-type">
              <label>{isBusiness ? messages.proposalType : messages.inquiryType} <i>*</i></label>
              <CustomSelect
                className={styles.customSelect}
                ariaLabel={isBusiness ? messages.proposalType : messages.inquiryType}
                value={form.inquiryType}
                onChange={(value) => {
                  setForm((current) => ({ ...current, inquiryType: value }));
                  setError(EMPTY_ERROR);
                }}
                options={typeOptions}
                placeholder={messages.select}
              />
            </div>

            {isBusiness && (
              <div className={styles.formRow}>
                <label htmlFor="contact-company">{messages.company} <i>*</i></label>
                <input id="contact-company" value={form.companyName} onChange={updateField("companyName")} placeholder="회사명 또는 소속을 입력해 주세요." maxLength={120} />
              </div>
            )}

            <div className={styles.formRow}>
              <label htmlFor="contact-name">{isBusiness ? messages.contactName : messages.name} <i>*</i></label>
              <input id="contact-name" value={form.name} onChange={updateField("name")} placeholder={isBusiness ? "담당자 성함을 입력해 주세요." : "이름을 입력해 주세요."} maxLength={80} autoComplete="name" />
            </div>

            <div className={styles.formRow}>
              <label htmlFor="contact-phone">{messages.phone} {isBusiness && <i>*</i>}</label>
              <input id="contact-phone" value={form.phone} onChange={updateField("phone")} placeholder={isBusiness ? "연락 가능한 번호를 입력해 주세요." : "연락처를 입력해 주세요. (선택)"} maxLength={40} autoComplete="tel" inputMode="tel" />
            </div>

            <div className={styles.formRow}>
              <label htmlFor="contact-email">{messages.email} <i>*</i></label>
              <input id="contact-email" value={form.email} readOnly maxLength={254} autoComplete="email" inputMode="email" />
            </div>

            {isBusiness && (
              <div className={`${styles.formRow} ${styles.alignTop}`}>
                <span className={styles.rowLabel}>제안서 첨부</span>
                <div className={styles.fileArea}>
                  {!attachment ? (
                    <label className={styles.uploadButton}>
                      <Paperclip aria-hidden="true" />
                      <span><b>파일을 선택해 주세요.</b><small>PDF · 최대 5MB</small></span>
                      <em>파일 선택</em>
                      <input type="file" accept=".pdf,application/pdf" onChange={handleFile} />
                    </label>
                  ) : (
                    <div className={styles.fileItem}>
                      <FileText aria-hidden="true" />
                      <span><b>{attachment.name}</b><small>{(attachment.size / 1024 / 1024).toFixed(1)}MB</small></span>
                      <button type="button" onClick={() => setAttachment(null)} aria-label={`${attachment.name} 삭제`}><Trash2 aria-hidden="true" /></button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={`${styles.formRow} ${styles.alignTop}`}>
              <label htmlFor="contact-message">{isBusiness ? messages.proposal : messages.message} <i>*</i></label>
              <div className={styles.textareaControl}>
                <textarea
                  id="contact-message"
                  value={form.message}
                  onChange={updateField("message")}
                  placeholder={isBusiness
                    ? "제안하시는 내용과 원하시는 협업 방향을 구체적으로 남겨주시면 검토에 큰 도움이 됩니다."
                    : "문의하실 내용을 자세히 남겨주시면 더 빠르고 정확한 답변을 드릴 수 있습니다."}
                  maxLength={5000}
                  rows={8}
                />
                <span>{form.message.length.toLocaleString()} / 5,000</span>
              </div>
            </div>

            <div className={`${styles.formRow} ${styles.alignTop}`}>
              <span className={styles.rowLabel}>{messages.consent} <i>*</i></span>
              <div>
                <div className={styles.termsBox}>
                  <b>개인정보 수집 및 이용 안내</b>
                  <dl>
                    <div><dt>수집 항목</dt><dd>이름, 이메일, 연락처, 회사명·소속(비즈니스 문의 시), 문의 내용</dd></div>
                    <div><dt>이용 목적</dt><dd>문의 접수, 본인 확인, 문의 내용 검토 및 답변</dd></div>
                    <div><dt>보유 기간</dt><dd>문의 처리 완료 후 3년 또는 관계 법령에서 정한 기간</dd></div>
                  </dl>
                  <p>동의를 거부할 수 있으나, 필수 정보 수집에 동의하지 않으면 문의 접수가 어렵습니다.</p>
                </div>
                <label id="contact-consent" className={styles.consent}>
                  <input type="checkbox" checked={consented} onChange={(event) => { setConsented(event.target.checked); setError(EMPTY_ERROR); }} />
                  <span><Check aria-hidden="true" /></span>
                  개인정보 수집·이용에 동의합니다.
                </label>
              </div>
            </div>

            <div className={styles.submitArea}>
              <button className={styles.submit} type="submit" disabled={submitting}>
                {submitting ? messages.submitting : messages.submit}
                {!submitting && <ArrowRight aria-hidden="true" />}
              </button>
              <p>남겨주신 이메일로 순차적으로 답변드리고 있으며, 문의량에 따라 답변이 지연될 수 있는 점 양해 부탁드립니다.</p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
