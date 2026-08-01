"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  LuArrowRight,
  LuCheck,
  LuCircleAlert,
  LuFileText,
  LuPaperclip,
  LuTrash2,
} from "react-icons/lu";
import CustomSelect from "@/core/components/form/CustomSelect";
import styles from "@/styles/(public)/pages/contact.module.css";

type ContactCategory = "general" | "business";
type FormValues = {
  inquiryType: string;
  companyName: string;
  name: string;
  phone: string;
  email: string;
  message: string;
};

const generalTypes = [
  { value: "account", label: "계정 문의" },
  { value: "notice_event", label: "공지·이벤트 문의" },
  { value: "goods_md", label: "굿즈·MD 문의" },
  { value: "site_error", label: "사이트 오류 신고" },
  { value: "other", label: "기타" },
];

const businessTypes = [
  { value: "brand_collaboration", label: "브랜드 협업" },
  { value: "advertising_sponsorship", label: "광고·협찬 제안" },
  { value: "md_licensing", label: "MD·상품화 제안" },
  { value: "performance_event", label: "공연·행사 섭외" },
  { value: "other_business", label: "기타 비즈니스 제안" },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["pdf", "ppt", "pptx"]);
const EMPTY_ERROR = "";

export default function ContactClient({
  initialName,
  initialEmail,
  businessAssets,
}: {
  initialName: string;
  initialEmail: string;
  initialUserId: string | null;
  businessAssets: { pressKitUrl: string; profilePdfUrl: string };
}) {
  const [category, setCategory] = useState<ContactCategory>("general");
  const [form, setForm] = useState<FormValues>({
    inquiryType: "",
    companyName: "",
    name: initialName,
    phone: "",
    email: initialEmail,
    message: "",
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [error, setError] = useState(EMPTY_ERROR);
  const formRef = useRef<HTMLFormElement>(null);

  const isBusiness = category === "business";
  const typeOptions = isBusiness ? businessTypes : generalTypes;

  const updateField = (field: keyof FormValues) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError(EMPTY_ERROR);
  };

  const changeCategory = (next: ContactCategory) => {
    setCategory(next);
    setForm((current) => ({ ...current, inquiryType: "", companyName: "", message: "" }));
    setAttachment(null);
    setConsented(false);
    setError(EMPTY_ERROR);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    setError(EMPTY_ERROR);
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      setError("PDF 또는 PPT 형식의 파일만 첨부할 수 있습니다.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("첨부 파일은 최대 20MB까지 등록할 수 있습니다.");
      return;
    }
    setAttachment(file);
  };

  const focusFirstInvalid = (id: string) => {
    requestAnimationFrame(() => {
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      (element?.matches("input, textarea, button") ? element : element?.querySelector("button"))
        ?.focus({ preventScroll: true });
    });
  };

  const validate = () => {
    const required = [
      { id: "contact-inquiry-type", missing: !form.inquiryType, message: "문의 유형을 선택해 주세요." },
      { id: "contact-company", missing: isBusiness && !form.companyName.trim(), message: "회사명 또는 소속을 입력해 주세요." },
      { id: "contact-name", missing: !form.name.trim(), message: isBusiness ? "담당자 이름을 입력해 주세요." : "이름을 입력해 주세요." },
      { id: "contact-phone", missing: isBusiness && !form.phone.trim(), message: "연락처를 입력해 주세요." },
      { id: "contact-email", missing: !form.email.trim(), message: "이메일 주소를 입력해 주세요." },
      { id: "contact-message", missing: !form.message.trim(), message: isBusiness ? "제안 내용을 입력해 주세요." : "문의 내용을 입력해 주세요." },
      { id: "contact-consent", missing: !consented, message: "개인정보 수집·이용에 동의해 주세요." },
    ].find((field) => field.missing);

    if (required) {
      setError(required.message);
      focusFirstInvalid(required.id);
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      focusFirstInvalid("contact-email");
      return false;
    }
    return true;
  };

  const submitInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(EMPTY_ERROR);
    if (!validate()) return;

    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.set("category", category);
      payload.set("inquiryType", form.inquiryType);
      payload.set("companyName", isBusiness ? form.companyName.trim() : "");
      payload.set("contactName", form.name.trim());
      payload.set("phone", form.phone.trim());
      payload.set("email", form.email.trim().toLowerCase());
      payload.set("message", form.message.trim());
      payload.set("privacyConsent", "true");
      if (isBusiness && attachment) payload.set("attachment", attachment);

      const response = await fetch("/api/contact-inquiries", {
        method: "POST",
        body: payload,
      });
      const result = await response.json().catch(() => ({})) as { id?: string; code?: string };
      if (!response.ok || !result.id) throw new Error(result.code || "SUBMISSION_FAILED");

      setSubmittedId(result.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "문의 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedId("");
    setForm({
      inquiryType: "",
      companyName: "",
      name: initialName,
      phone: "",
      email: initialEmail,
      message: "",
    });
    setAttachment(null);
    setConsented(false);
    setError(EMPTY_ERROR);
  };

  if (submittedId) {
    return (
      <main className={styles.page}>
        <section className={styles.success} aria-labelledby="contact-success-title">
          <LuCheck aria-hidden="true" />
          <h1 id="contact-success-title">문의가 접수되었습니다.</h1>
          <span>남겨주신 이메일로 순차적으로 답변드리겠습니다.</span>
          <dl>
            <div><dt>접수 번호</dt><dd>{submittedId.slice(0, 8).toUpperCase()}</dd></div>
            <div><dt>문의 구분</dt><dd>{isBusiness ? "Business" : "일반 문의"}</dd></div>
          </dl>
          <button type="button" onClick={resetForm}>
            새 문의 작성하기 <LuArrowRight aria-hidden="true" />
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
              문의 목적에 맞는 창구를 선택해 주세요. 남겨주신 내용을 확인한 뒤 담당자가 답변드립니다.
            </p>
            <nav className={styles.tabs} aria-label="문의 구분">
              <button
                type="button"
                className={!isBusiness ? styles.activeTab : ""}
                aria-current={!isBusiness ? "page" : undefined}
                onClick={() => changeCategory("general")}
              >
                <span>일반 문의</span>
              </button>
              <button
                type="button"
                className={isBusiness ? styles.activeTab : ""}
                aria-current={isBusiness ? "page" : undefined}
                onClick={() => changeCategory("business")}
              >
                <span>Business</span>
              </button>
            </nav>
          </div>
        </header>

        <div className={styles.contentColumn}>
          <header className={styles.formHeader}>
            <h2>{isBusiness ? "협업·광고·제휴 제안" : "무엇을 도와드릴까요?"}</h2>
            <span><i>*</i> 표시는 필수 입력 항목입니다.</span>
          </header>

          {error && (
            <div className={styles.error} role="alert">
              <LuCircleAlert aria-hidden="true" />
              <span>{error}</span>
              <button type="button" onClick={() => setError(EMPTY_ERROR)} aria-label="오류 메시지 닫기">×</button>
            </div>
          )}

          {isBusiness && (businessAssets.pressKitUrl || businessAssets.profilePdfUrl) && (
            <section className={styles.businessDownloads} aria-label="프레스킷 다운로드">
              <h3>프레스킷 다운로드</h3>
              <p>협업 검토에 필요한 공식 자료를 내려받을 수 있습니다.</p>
              <div>
                {businessAssets.pressKitUrl && <a href={businessAssets.pressKitUrl} download>프레스킷 ZIP</a>}
                {businessAssets.profilePdfUrl && <a href={businessAssets.profilePdfUrl} download>프로필 PDF</a>}
              </div>
            </section>
          )}

          <form ref={formRef} className={styles.form} onSubmit={submitInquiry} noValidate>
            <div className={styles.formRow} id="contact-inquiry-type">
              <label>문의 유형 <i>*</i></label>
              <CustomSelect
                className={styles.customSelect}
                ariaLabel={isBusiness ? "제안 유형" : "문의 유형"}
                value={form.inquiryType}
                onChange={(value) => {
                  setForm((current) => ({ ...current, inquiryType: value }));
                  setError(EMPTY_ERROR);
                }}
                options={typeOptions}
                placeholder="선택"
              />
            </div>

            {isBusiness && (
              <div className={styles.formRow}>
                <label htmlFor="contact-company">회사명 / 소속 <i>*</i></label>
                <input id="contact-company" value={form.companyName} onChange={updateField("companyName")} placeholder="회사명 또는 소속을 입력해 주세요." maxLength={120} />
              </div>
            )}

            <div className={styles.formRow}>
              <label htmlFor="contact-name">{isBusiness ? "담당자 이름" : "이름"} <i>*</i></label>
              <input id="contact-name" value={form.name} onChange={updateField("name")} placeholder={isBusiness ? "담당자 성함을 입력해 주세요." : "이름을 입력해 주세요."} maxLength={80} autoComplete="name" />
            </div>

            <div className={styles.formRow}>
              <label htmlFor="contact-phone">연락처 {isBusiness && <i>*</i>}</label>
              <input id="contact-phone" value={form.phone} onChange={updateField("phone")} placeholder={isBusiness ? "연락 가능한 번호를 입력해 주세요." : "연락처를 입력해 주세요. (선택)"} maxLength={40} autoComplete="tel" inputMode="tel" />
            </div>

            <div className={styles.formRow}>
              <label htmlFor="contact-email">이메일 <i>*</i></label>
              <input id="contact-email" value={form.email} onChange={updateField("email")} placeholder="이메일 주소를 입력해 주세요." maxLength={254} autoComplete="email" inputMode="email" />
            </div>

            {isBusiness && (
              <div className={`${styles.formRow} ${styles.alignTop}`}>
                <span className={styles.rowLabel}>제안서 첨부</span>
                <div className={styles.fileArea}>
                  {!attachment ? (
                    <label className={styles.uploadButton}>
                      <LuPaperclip aria-hidden="true" />
                      <span><b>파일을 선택해 주세요.</b><small>PDF, PPT · 최대 20MB</small></span>
                      <em>파일 선택</em>
                      <input type="file" accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={handleFile} />
                    </label>
                  ) : (
                    <div className={styles.fileItem}>
                      <LuFileText aria-hidden="true" />
                      <span><b>{attachment.name}</b><small>{(attachment.size / 1024 / 1024).toFixed(1)}MB</small></span>
                      <button type="button" onClick={() => setAttachment(null)} aria-label={`${attachment.name} 삭제`}><LuTrash2 aria-hidden="true" /></button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={`${styles.formRow} ${styles.alignTop}`}>
              <label htmlFor="contact-message">{isBusiness ? "제안 내용" : "문의 내용"} <i>*</i></label>
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
              <span className={styles.rowLabel}>개인정보 수집·이용 동의 <i>*</i></span>
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
                  <span><LuCheck aria-hidden="true" /></span>
                  개인정보 수집·이용에 동의합니다.
                </label>
              </div>
            </div>

            <div className={styles.submitArea}>
              <button className={styles.submit} type="submit" disabled={submitting}>
                {submitting ? "접수 중..." : "문의하기"}
                {!submitting && <LuArrowRight aria-hidden="true" />}
              </button>
              <p>남겨주신 이메일로 순차적으로 답변드리고 있으며, 문의량에 따라 답변이 지연될 수 있는 점 양해 부탁드립니다.</p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
