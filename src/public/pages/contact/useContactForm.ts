"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useLocale } from "@/core/providers/LocaleContext";
import { ALLOWED_EXTENSIONS, EMPTY_ERROR, MAX_FILE_SIZE, businessTypes, contactCopy, generalTypes, inquiryLabels, type ContactCategory, type FormValues } from "./contact-model";

export function useContactForm({ initialName, initialEmail, initialRemaining }: { initialName: string; initialEmail: string; initialRemaining: number }) {
  const { locale } = useLocale();
  const messages = contactCopy[locale];
  const [category, setCategory] = useState<ContactCategory>("general");
  const [form, setForm] = useState<FormValues>({ inquiryType: "", companyName: "", name: initialName, phone: "", email: initialEmail, message: "" });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [remaining, setRemaining] = useState(initialRemaining);
  const [error, setError] = useState(EMPTY_ERROR);
  const formRef = useRef<HTMLFormElement>(null);
  const isBusiness = category === "business";
  const typeOptions = (isBusiness ? businessTypes : generalTypes).map((option) => ({
    ...option,
    label: locale === "ko" ? option.label : inquiryLabels[locale][option.value as keyof typeof inquiryLabels.en],
  }));

  const updateField = (field: keyof FormValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    if (!ALLOWED_EXTENSIONS.has(extension)) { setError("PDF 형식의 파일만 첨부할 수 있습니다."); return; }
    if (file.size > MAX_FILE_SIZE) { setError("첨부 파일은 최대 5MB까지 등록할 수 있습니다."); return; }
    setAttachment(file);
  };
  const focusFirstInvalid = (id: string) => {
    requestAnimationFrame(() => {
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      (element?.matches("input, textarea, button") ? element : element?.querySelector("button"))?.focus({ preventScroll: true });
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
    if (required) { setError(required.message); focusFirstInvalid(required.id); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setError("올바른 이메일 주소를 입력해 주세요."); focusFirstInvalid("contact-email"); return false; }
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
      const response = await fetch("/api/contact-inquiries", { method: "POST", body: payload });
      const result = await response.json().catch(() => ({})) as { id?: string; remaining?: number; code?: string };
      if (!response.ok || !result.id) throw new Error(result.code || "SUBMISSION_FAILED");
      if (typeof result.remaining === "number") setRemaining(result.remaining);
      setSubmittedId(result.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "문의 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };
  const resetForm = () => {
    setSubmittedId("");
    setForm({ inquiryType: "", companyName: "", name: initialName, phone: "", email: initialEmail, message: "" });
    setAttachment(null);
    setConsented(false);
    setError(EMPTY_ERROR);
  };

  return {
    locale, messages, category, setCategory, form, setForm, attachment, setAttachment, consented, setConsented,
    submitting, submittedId, remaining, error, setError, formRef, isBusiness, typeOptions, updateField, changeCategory,
    handleFile, submitInquiry, resetForm,
  };
}
