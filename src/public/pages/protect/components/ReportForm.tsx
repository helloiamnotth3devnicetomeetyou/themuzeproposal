"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/core/auth/auth";
import { useLocale } from "@/core/providers/LocaleContext";
import { supabase } from "@/core/supabase/client";
import type { Artist, MyReport } from "../ProtectClient";
import ReportFormFields, { type ReportFormValues } from "./ReportFormFields";
import styles from "@/styles/(public)/pages/protect.module.css";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const HOLD_DURATION_MS = 1500;
const ACCEPTED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const initialForm: ReportFormValues = {
  artistId: "",
  reportType: "",
  title: "",
  content: "",
  platform: "",
  postUrl: "",
  postedAt: "",
  authorName: "",
  postIp: "",
};

type Props = {
  artists: Artist[];
  userEmail: string;
  setMyReports: Dispatch<SetStateAction<MyReport[]>>;
  setSubmittedId: (id: string) => void;
  setError: (message: string) => void;
  error: string;
};

export default function ReportForm({
  artists,
  setMyReports,
  setSubmittedId,
  setError,
  error,
}: Props) {
  const { t } = useLocale();
  const router = useRouter();
  const [form, setForm] = useState<ReportFormValues>(initialForm);
  const [fileSlots, setFileSlots] = useState<Array<File | null>>([null, null, null]);
  const [confirmed, setConfirmed] = useState(false);
  const [holdingSubmit, setHoldingSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const holdTimer = useRef<number | null>(null);

  const files = useMemo(
    () => fileSlots.filter((file): file is File => file !== null),
    [fileSlots],
  );

  useEffect(() => () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
  }, []);

  const clearValidation = () => {
    if (error) setError("");
    if (missingFields.length) setMissingFields([]);
  };

  const updateField =
    (field: keyof ReportFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      clearValidation();
    };

  const updateSelect = (field: keyof ReportFormValues) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    clearValidation();
  };

  const validateReport = () => {
    const requiredFields = [
      { label: t.protect.fields.artist, id: "artist", missing: !form.artistId },
      { label: t.protect.fields.reportType, id: "reportType", missing: !form.reportType },
      { label: t.protect.fields.title, id: "title", missing: !form.title.trim() },
      { label: t.protect.fields.content, id: "content", missing: !form.content.trim() },
      { label: t.protect.fields.platform, id: "platform", missing: !form.platform },
      { label: t.protect.fields.postUrl, id: "postUrl", missing: !form.postUrl.trim() },
      { label: t.protect.fields.postedAt, id: "postedAt", missing: !form.postedAt },
      { label: t.protect.fields.authorName, id: "authorName", missing: !form.authorName.trim() },
      { label: t.protect.fields.evidence, id: "evidenceFiles", missing: files.length === 0 },
      { label: t.protect.fields.confirmation, id: "reportConfirmation", missing: !confirmed },
    ].filter((field) => field.missing);

    setMissingFields(requiredFields.map((field) => field.label));
    if (!requiredFields.length) return true;

    setError(t.protect.missingCount(requiredFields.length));
    requestAnimationFrame(() => {
      const firstField = document.getElementById(requiredFields[0].id);
      firstField?.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusTarget = firstField?.matches("button, input, textarea, select")
        ? firstField
        : firstField?.querySelector<HTMLElement>("button, input, textarea, select");
      (focusTarget as HTMLElement | null)?.focus({ preventScroll: true });
    });
    return false;
  };

  const cancelSubmitHold = () => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setHoldingSubmit(false);
  };

  const startSubmitHold = () => {
    if (submitting || holdTimer.current || !validateReport()) return;
    setHoldingSubmit(true);
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      setHoldingSubmit(false);
      formRef.current?.requestSubmit();
    }, HOLD_DURATION_MS);
  };

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files ?? []);
    event.target.value = "";
    setError("");
    setMissingFields([]);
    if (!incoming.length) return;
    if (files.length + incoming.length > 3) {
      setError(t.protect.errors.maxFiles);
      return;
    }

    const invalidType = incoming.find((file) => !ACCEPTED_FILE_TYPES.has(file.type));
    if (invalidType) {
      setError(t.protect.errors.fileType(invalidType.name));
      return;
    }
    const oversized = incoming.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(t.protect.errors.fileSize(oversized.name));
      return;
    }

    const fileKeys = new Set(files.map((file) => `${file.name}:${file.size}`));
    const duplicate = incoming.find((file) => {
      const key = `${file.name}:${file.size}`;
      if (fileKeys.has(key)) return true;
      fileKeys.add(key);
      return false;
    });
    if (duplicate) {
      setError(t.protect.errors.duplicate(duplicate.name));
      return;
    }

    setFileSlots((current) => {
      const next = [...current];
      incoming.forEach((file) => {
        const emptySlot = next.findIndex((item) => item === null);
        if (emptySlot >= 0) next[emptySlot] = file;
      });
      return next;
    });
  };

  const submitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!files.length || !confirmed) {
      setError(!files.length
        ? t.protect.errors.evidenceRequired
        : t.protect.errors.confirmationRequired);
      return;
    }

    setSubmitting(true);
    const user = await getUser();
    if (!user) {
      setSubmitting(false);
      router.replace("/login?redirect=/protect");
      return;
    }

    const uploadedPaths: string[] = [];
    try {
      for (const file of files) {
        const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "file";
        const path = `${user.id}/${crypto.randomUUID()}.${extension.toLowerCase()}`;
        const { error: uploadError } = await supabase.storage
          .from("protect-evidence")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
      }

      const { data, error: insertError } = await supabase
        .from("protect_reports")
        .insert({
          user_id: user.id,
          reporter_email: user.email || null,
          artist_id: form.artistId,
          report_type: form.reportType,
          title: form.title.trim(),
          content: form.content.trim(),
          platform: form.platform,
          post_url: form.postUrl.trim(),
          posted_at: form.postedAt,
          author_name: form.authorName.trim(),
          post_ip: form.postIp.trim() || null,
          confirmation: true,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      const { error: attachmentError } = await supabase
        .from("protect_report_attachments")
        .insert(uploadedPaths.map((path, index) => ({
          report_id: data.id,
          file_path: path,
          file_name: files[index].name,
        })));
      if (attachmentError) throw attachmentError;

      setMyReports((current) => [{
        id: data.id,
        artist_id: form.artistId,
        report_type: form.reportType,
        title: form.title.trim(),
        platform: form.platform,
        status: "pending",
        created_at: new Date().toISOString(),
      }, ...current]);
      setSubmittedId(data.id);
      setForm(initialForm);
      setFileSlots([null, null, null]);
      setConfirmed(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      if (uploadedPaths.length) {
        await supabase.storage.from("protect-evidence").remove(uploadedPaths);
      }
      setError(submitError instanceof Error
        ? submitError.message
        : t.protect.errors.submitFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} className={styles.form} onSubmit={submitReport}>
      <ReportFormFields
        artists={artists}
        form={form}
        fileSlots={fileSlots}
        files={files}
        confirmed={confirmed}
        missingFields={missingFields}
        holdingSubmit={holdingSubmit}
        submitting={submitting}
        updateField={updateField}
        updateSelect={updateSelect}
        addFiles={addFiles}
        removeFile={(slot) => { setFileSlots((current) => current.map((item, index) => index === slot ? null : item)); clearValidation(); }}
        onConfirmedChange={(next) => { setConfirmed(next); setError(""); }}
        startSubmitHold={startSubmitHold}
        cancelSubmitHold={cancelSubmitHold}
      />
    </form>
  );
}
