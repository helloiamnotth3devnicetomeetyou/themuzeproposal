"use client";

import { useEffect, useRef } from "react";
import {
  ArrowRight,
  Check,
  CircleAlert,
  FileText,
  Paperclip,
  Trash2,
} from "lucide-react";
import CustomSelect from "@/core/components/form/CustomSelect";
import TurnstileWidget, {
  type TurnstileWidgetHandle,
} from "@/core/components/form/TurnstileWidget";
import { safeHref } from "@/core/http/safe-href";
import AccountProfileLink from "@/public/components/AccountProfileLink";
import styles from "@/styles/(public)/pages/contact.module.css";
import { useContactForm } from "./useContactForm";

export default function ContactClient({
  isAuthenticated,
  initialName,
  initialEmail,
  initialAvatarUrl,
  initialRemaining,
  businessAssets,
}: {
  isAuthenticated: boolean;
  initialName: string;
  initialEmail: string;
  initialAvatarUrl: string;
  initialRemaining: number;
  businessAssets: { pressKitUrl: string; profilePdfUrl: string };
}) {
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const {
    messages,
    draftRestored,
    form,
    setForm,
    attachment,
    setAttachment,
    consented,
    setConsented,
    submitting,
    submittedId,
    remaining,
    error,
    setError,
    errorFieldId,
    formRef,
    isBusiness,
    typeOptions,
    updateField,
    changeCategory,
    handleFile,
    submitInquiry,
    resetForm,
    setTurnstileToken,
  } = useContactForm({
    initialName,
    initialEmail,
    initialRemaining,
    resetTurnstile: () => turnstileRef.current?.reset(),
  });
  const pressKitHref = safeHref(businessAssets.pressKitUrl);
  const profilePdfHref = safeHref(businessAssets.profilePdfUrl);
  const fieldError = (id: string) =>
    errorFieldId === id
      ? {
          "aria-invalid": true as const,
          "aria-describedby": "contact-error-message",
        }
      : {};
  const successTitleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (submittedId) successTitleRef.current?.focus();
  }, [submittedId]);

  if (submittedId) {
    return (
      <main className={styles.page}>
        <section
          className={styles.success}
          aria-labelledby="contact-success-title"
        >
          <Check aria-hidden="true" />
          <h1 id="contact-success-title" ref={successTitleRef} tabIndex={-1}>
            {messages.success}
          </h1>
          <span>{messages.successNote}</span>
          <dl>
            <div>
              <dt>{messages.receipt}</dt>
              <dd>{submittedId.slice(0, 8).toUpperCase()}</dd>
            </div>
            <div>
              <dt>{messages.category}</dt>
              <dd>{isBusiness ? messages.business : messages.general}</dd>
            </div>
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
            <p className={styles.intro}>{messages.intro}</p>
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
            {isAuthenticated && (
              <AccountProfileLink
                name={initialName}
                email={initialEmail}
                avatarUrl={initialAvatarUrl}
                remaining={remaining}
              />
            )}
          </div>
        </header>

        <div className={styles.contentColumn}>
          <header className={styles.formHeader}>
            <h2>{isBusiness ? messages.businessForm : messages.form}</h2>
            <span>
              <i>*</i> {messages.required}
            </span>
          </header>

          {error && (
            <div
              id="contact-error-message"
              className={styles.error}
              role="alert"
            >
              <CircleAlert aria-hidden="true" />
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError()}
                aria-label={messages.closeErrorLabel}
              >
                ×
              </button>
            </div>
          )}

          {isBusiness && (pressKitHref || profilePdfHref) && (
            <section
              className={styles.businessDownloads}
              aria-label={messages.pressKit.title}
            >
              <h3>{messages.pressKit.title}</h3>
              <p>{messages.pressKit.desc}</p>
              <div>
                {pressKitHref && (
                  <a href={pressKitHref} download>
                    {messages.pressKit.zip}
                  </a>
                )}
                {profilePdfHref && (
                  <a href={profilePdfHref} download>
                    {messages.pressKit.pdf}
                  </a>
                )}
              </div>
            </section>
          )}

          <form
            ref={formRef}
            className={styles.form}
            onSubmit={submitInquiry}
            noValidate
          >
            {draftRestored && <p role="status">{messages.draftRestored}</p>}
            <div className={styles.formRow} id="contact-inquiry-type">
              <label>
                {isBusiness ? messages.proposalType : messages.inquiryType}{" "}
                <i>*</i>
              </label>
              <CustomSelect
                className={styles.customSelect}
                ariaLabel={
                  isBusiness ? messages.proposalType : messages.inquiryType
                }
                value={form.inquiryType}
                onChange={(value) => {
                  setForm((current) => ({ ...current, inquiryType: value }));
                  setError();
                }}
                options={typeOptions}
                placeholder={messages.select}
              />
            </div>

            {isBusiness && (
              <div className={styles.formRow}>
                <label htmlFor="contact-company">
                  {messages.company} <i>*</i>
                </label>
                <input
                  id="contact-company"
                  value={form.companyName}
                  onChange={updateField("companyName")}
                  placeholder={messages.placeholders.company}
                  maxLength={120}
                  {...fieldError("contact-company")}
                />
              </div>
            )}

            <div className={styles.formRow}>
              <label htmlFor="contact-name">
                {isBusiness ? messages.contactName : messages.name} <i>*</i>
              </label>
              <input
                id="contact-name"
                value={form.name}
                onChange={updateField("name")}
                placeholder={
                  isBusiness
                    ? messages.placeholders.nameBusiness
                    : messages.placeholders.nameGeneral
                }
                maxLength={80}
                autoComplete="name"
                {...fieldError("contact-name")}
              />
            </div>

            <div className={styles.formRow}>
              <label htmlFor="contact-phone">
                {messages.phone} {isBusiness && <i>*</i>}
              </label>
              <input
                id="contact-phone"
                value={form.phone}
                onChange={updateField("phone")}
                placeholder={
                  isBusiness
                    ? messages.placeholders.phoneBusiness
                    : messages.placeholders.phoneGeneral
                }
                maxLength={40}
                autoComplete="tel"
                inputMode="tel"
                {...fieldError("contact-phone")}
              />
            </div>

            <div className={styles.formRow}>
              <label htmlFor="contact-email">
                {messages.email} <i>*</i>
              </label>
              <input
                id="contact-email"
                value={form.email}
                onChange={isAuthenticated ? undefined : updateField("email")}
                readOnly={isAuthenticated}
                maxLength={254}
                autoComplete="email"
                inputMode="email"
                placeholder={isAuthenticated ? undefined : "you@example.com"}
                {...fieldError("contact-email")}
              />
            </div>

            {isBusiness && (
              <div className={`${styles.formRow} ${styles.alignTop}`}>
                <span className={styles.rowLabel}>
                  {messages.attachment.label}
                </span>
                <div className={styles.fileArea}>
                  {!attachment ? (
                    <label className={styles.uploadButton}>
                      <Paperclip aria-hidden="true" />
                      <span>
                        <b>{messages.attachment.chooseTitle}</b>
                        <small>{messages.attachment.hint}</small>
                      </span>
                      <em>{messages.attachment.select}</em>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFile}
                      />
                    </label>
                  ) : (
                    <div className={styles.fileItem}>
                      <FileText aria-hidden="true" />
                      <span>
                        <b>{attachment.name}</b>
                        <small>
                          {(attachment.size / 1024 / 1024).toFixed(1)}MB
                        </small>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        aria-label={messages.attachment.remove(attachment.name)}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={`${styles.formRow} ${styles.alignTop}`}>
              <label htmlFor="contact-message">
                {isBusiness ? messages.proposal : messages.message} <i>*</i>
              </label>
              <div className={styles.textareaControl}>
                <textarea
                  id="contact-message"
                  value={form.message}
                  onChange={updateField("message")}
                  placeholder={
                    isBusiness
                      ? messages.placeholders.proposal
                      : messages.placeholders.message
                  }
                  maxLength={5000}
                  rows={8}
                  {...fieldError("contact-message")}
                />
                <span>{form.message.length.toLocaleString()} / 5,000</span>
              </div>
            </div>

            <div className={`${styles.formRow} ${styles.alignTop}`}>
              <span className={styles.rowLabel}>
                {messages.consent} <i>*</i>
              </span>
              <div>
                <div className={styles.termsBox}>
                  <b>{messages.privacy.title}</b>
                  <dl>
                    {messages.privacy.items.map((item) => (
                      <div key={item.term}>
                        <dt>{item.term}</dt>
                        <dd>{item.desc}</dd>
                      </div>
                    ))}
                  </dl>
                  <p>{messages.privacy.note}</p>
                </div>
                <label id="contact-consent" className={styles.consent}>
                  <input
                    type="checkbox"
                    checked={consented}
                    onChange={(event) => {
                      setConsented(event.target.checked);
                      setError();
                    }}
                    {...fieldError("contact-consent")}
                  />
                  <span>
                    <Check aria-hidden="true" />
                  </span>
                  {messages.privacy.consentLabel}
                </label>
              </div>
            </div>

            <div id="contact-turnstile" className={styles.formRow}>
              <TurnstileWidget
                ref={turnstileRef}
                onToken={(token) => setTurnstileToken(token ?? "")}
                action="contact_inquiry"
              />
            </div>

            <div className={styles.submitArea}>
              <button
                className={styles.submit}
                type="submit"
                disabled={submitting}
              >
                {submitting ? messages.submitting : messages.submit}
                {!submitting && <ArrowRight aria-hidden="true" />}
              </button>
              <p>{messages.submitNote}</p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
