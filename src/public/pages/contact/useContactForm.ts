"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useLocale } from "@/core/providers/LocaleContext";
import {
  ALLOWED_EXTENSIONS,
  EMPTY_ERROR,
  MAX_FILE_SIZE,
  businessTypes,
  contactCopy,
  emptyCategoryDraft,
  generalTypes,
  inquiryLabels,
  type CategoryDraft,
  type ContactCategory,
  type FormValues,
} from "./contact-model";

export function useContactForm({
  initialName,
  initialEmail,
  initialRemaining,
  resetTurnstile,
}: {
  initialName: string;
  initialEmail: string;
  initialRemaining: number;
  resetTurnstile?: () => void;
}) {
  const { locale } = useLocale();
  const messages = contactCopy[locale];
  const [category, setCategory] = useState<ContactCategory>("general");
  const [shared, setShared] = useState({
    name: initialName,
    phone: "",
    email: initialEmail,
  });
  const [drafts, setDrafts] = useState<Record<ContactCategory, CategoryDraft>>({
    general: emptyCategoryDraft,
    business: emptyCategoryDraft,
  });
  const [attachments, setAttachments] = useState<
    Record<ContactCategory, File | null>
  >({ general: null, business: null });
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [remaining, setRemaining] = useState(initialRemaining);
  const [error, setError] = useState(EMPTY_ERROR);
  const [errorFieldId, setErrorFieldId] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const submissionId = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const isBusiness = category === "business";
  const draft = drafts[category];
  const attachment = attachments[category];
  const form: FormValues = {
    inquiryType: draft.inquiryType,
    companyName: draft.companyName,
    name: shared.name,
    phone: shared.phone,
    email: shared.email,
    message: draft.message,
  };
  const consented = draft.consented;
  const typeOptions = (isBusiness ? businessTypes : generalTypes).map(
    (option) => ({
      ...option,
      label:
        locale === "ko"
          ? option.label
          : inquiryLabels[locale][
              option.value as keyof typeof inquiryLabels.en
            ],
    }),
  );

  const clearFieldError = (_message?: string) => {
    void _message;
    setError(EMPTY_ERROR);
    setErrorFieldId("");
  };
  const updateDraft = (patch: Partial<CategoryDraft>) =>
    setDrafts((current) => ({
      ...current,
      [category]: { ...current[category], ...patch },
    }));
  const setForm: (updater: (current: FormValues) => FormValues) => void = (
    updater,
  ) => {
    const next = updater(form);
    setShared({ name: next.name, phone: next.phone, email: next.email });
    updateDraft({
      inquiryType: next.inquiryType,
      companyName: next.companyName,
      message: next.message,
    });
  };
  const setAttachment = (file: File | null) =>
    setAttachments((current) => ({ ...current, [category]: file }));
  const setConsented = (value: boolean) => updateDraft({ consented: value });

  const updateField =
    (field: keyof FormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      if (field === "name" || field === "phone" || field === "email")
        setShared((current) => ({ ...current, [field]: value }));
      else updateDraft({ [field]: value } as Partial<CategoryDraft>);
      clearFieldError();
    };
  const changeCategory = (next: ContactCategory) => {
    setCategory(next);
    clearFieldError();
  };
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    clearFieldError();
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      setError(messages.validation.fileType);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(messages.validation.fileSize);
      return;
    }
    setAttachment(file);
  };
  const focusFirstInvalid = (id: string) => {
    requestAnimationFrame(() => {
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      (element?.matches("input, textarea, button")
        ? element
        : element?.querySelector("button")
      )?.focus({ preventScroll: true });
    });
  };
  const validate = () => {
    const required = [
      {
        id: "contact-inquiry-type",
        missing: !form.inquiryType,
        message: messages.validation.inquiryType,
      },
      {
        id: "contact-company",
        missing: isBusiness && !form.companyName.trim(),
        message: messages.validation.company,
      },
      {
        id: "contact-name",
        missing: !form.name.trim(),
        message: isBusiness
          ? messages.validation.nameBusiness
          : messages.validation.nameGeneral,
      },
      {
        id: "contact-phone",
        missing: isBusiness && !form.phone.trim(),
        message: messages.validation.phone,
      },
      {
        id: "contact-email",
        missing: !form.email.trim(),
        message: messages.validation.email,
      },
      {
        id: "contact-message",
        missing: !form.message.trim(),
        message: isBusiness
          ? messages.validation.messageBusiness
          : messages.validation.messageGeneral,
      },
      {
        id: "contact-consent",
        missing: !consented,
        message: messages.validation.consent,
      },
    ].find((field) => field.missing);
    if (required) {
      setError(required.message);
      setErrorFieldId(required.id);
      focusFirstInvalid(required.id);
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError(messages.validation.emailInvalid);
      setErrorFieldId("contact-email");
      focusFirstInvalid("contact-email");
      return false;
    }
    if (!turnstileToken) {
      setError(messages.validation.captcha);
      setErrorFieldId("contact-turnstile");
      focusFirstInvalid("contact-turnstile");
      return false;
    }
    return true;
  };
  const submitInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    clearFieldError();
    if (!validate()) return;
    const requestId = ++submissionId.current;
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
      payload.set("turnstileToken", turnstileToken);
      if (isBusiness && attachment) payload.set("attachment", attachment);
      const response = await fetch("/api/contact-inquiries", {
        method: "POST",
        body: payload,
      });
      const result = (await response.json().catch(() => ({}))) as {
        id?: string;
        remaining?: number;
        code?: string;
      };
      if (requestId !== submissionId.current) return;
      if (!response.ok || !result.id)
        throw new Error(result.code || "SUBMISSION_FAILED");
      if (typeof result.remaining === "number") setRemaining(result.remaining);
      setSubmittedId(result.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      if (requestId !== submissionId.current) return;
      const code =
        submitError instanceof Error
          ? submitError.message
          : "SUBMISSION_FAILED";
      setError(
        messages.errors[code as keyof typeof messages.errors] ||
          messages.errors.SUBMISSION_FAILED,
      );
      setTurnstileToken("");
      resetTurnstile?.();
    } finally {
      if (requestId === submissionId.current) setSubmitting(false);
    }
  };
  const resetForm = () => {
    setSubmittedId("");
    setShared({ name: initialName, phone: "", email: initialEmail });
    setDrafts({ general: emptyCategoryDraft, business: emptyCategoryDraft });
    setAttachments({ general: null, business: null });
    setTurnstileToken("");
    resetTurnstile?.();
    clearFieldError();
  };

  return {
    locale,
    messages,
    category,
    setCategory,
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
    setError: clearFieldError,
    errorFieldId,
    formRef,
    isBusiness,
    typeOptions,
    updateField,
    changeCategory,
    handleFile,
    submitInquiry,
    resetForm,
    turnstileToken,
    setTurnstileToken,
  };
}
