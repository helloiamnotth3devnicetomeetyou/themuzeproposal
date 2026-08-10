"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Save, Undo2 } from "lucide-react";
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

  const reset = async () => {
    if (!await confirm({
      title: "변경사항을 모두 되돌릴까요?",
      description: "이 페이지에서 저장하지 않은 변경사항을 버리고 마지막 저장 상태로 돌아갑니다.",
      confirmLabel: "모두 되돌리기",
      tone: "danger",
    })) return;
    window.dispatchEvent(new Event("admin-draft-reset"));
    window.setTimeout(() => window.location.reload(), 0);
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
  const saveStatus = saving ? "저장 중" : dirty ? "저장하지 않은 변경사항" : "저장됨";

  return <><span className={`draft-save-status${dirty ? " is-dirty" : ""}`} role="status" aria-live="polite">{saveStatus}</span><button type="button" data-tour-id="draft-reset" className="admin-btn admin-btn-secondary draft-reset-button" disabled={!dirty || saving} onClick={() => void reset()}><Undo2 aria-hidden="true" />되돌리기</button><button type="button" data-tour-id="draft-save" className="admin-btn admin-btn-primary draft-save-button" disabled={disabled || !dirty || saving} onClick={() => void save()}><Save aria-hidden="true" />{buttonLabel}</button></>;
}
