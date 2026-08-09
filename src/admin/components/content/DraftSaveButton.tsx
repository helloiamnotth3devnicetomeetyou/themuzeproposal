"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Save } from "lucide-react";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import { buildDraftDiff, type DraftDiffItem } from "@/admin/utils/draft-diff";

type Props = {
  snapshot: string;
  draft: unknown;
  dirty: boolean;
  saving: boolean;
  onSave: () => void | Promise<void>;
  labels?: Record<string, string>;
  extraDiff?: DraftDiffItem[];
  disabled?: boolean;
  label?: string;
  requireConfirmation?: boolean;
};

export default function DraftSaveButton({ snapshot, draft, dirty, saving, onSave, labels, extraDiff = [], disabled, label = "변경사항 저장", requireConfirmation = false }: Props) {
  const confirm = useAdminConfirm();
  const saveRequested = useRef(false);
  const [justSaved, setJustSaved] = useState(false);
  const diff = useMemo(() => {
    let before: unknown = {};
    try { before = snapshot ? JSON.parse(snapshot) : {}; } catch { /* invalid snapshots are shown as a full change */ }
    return [...buildDraftDiff(before, draft, labels), ...extraDiff];
  }, [draft, extraDiff, labels, snapshot]);

  const save = async () => {
    if (requireConfirmation && !await confirm({
      title: "변경사항을 저장할까요?",
      description: "아래 내용이 공개 페이지 데이터에 일괄 반영됩니다.",
      confirmLabel: "일괄 반영",
      details: diff,
    })) return;
    saveRequested.current = true;
    await onSave();
  };

  useEffect(() => {
    if (!saveRequested.current || saving || dirty) return;
    saveRequested.current = false;
    setJustSaved(true);
  }, [dirty, saving]);

  useEffect(() => {
    if (!justSaved) return;
    const timer = window.setTimeout(() => setJustSaved(false), 5000);
    return () => window.clearTimeout(timer);
  }, [justSaved]);

  useEffect(() => {
    if (dirty) setJustSaved(false);
  }, [dirty]);

  const buttonLabel = saving ? "저장 중…" : justSaved && !dirty ? "저장됨" : `${label}${diff.length ? ` (${diff.length})` : ""}`;

  return <><span className="sr-only" role="status" aria-live="polite">{saving ? "저장 중…" : justSaved ? "저장됨" : ""}</span><button type="button" data-tour-id="draft-save" className="admin-btn admin-btn-primary draft-save-button" disabled={disabled || !dirty || saving} onClick={() => void save()}><Save aria-hidden="true" />{buttonLabel}</button></>;
}
