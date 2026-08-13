"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export default function DraftSaveButton({
  snapshot,
  draft,
  dirty,
  saving,
  onSave,
  labels,
  extraDiff = [],
  disabled,
  label = "변경사항 저장",
  requireConfirmation = false,
}: Props) {
  const confirm = useAdminConfirm();
  const saveRequested = useRef(false);
  const saveInFlight = useRef(false);
  const [justSaved, setJustSaved] = useState(false);
  const diff = useMemo(() => {
    let before: unknown = {};
    try {
      before = snapshot ? JSON.parse(snapshot) : {};
    } catch {
      /* invalid snapshots are shown as a full change */
    }
    return [...buildDraftDiff(before, draft, labels), ...extraDiff];
  }, [draft, extraDiff, labels, snapshot]);
  const saveDisabled = Boolean(disabled || !dirty || saving);

  const save = useCallback(async () => {
    if (saveDisabled || saveInFlight.current) return;
    saveInFlight.current = true;
    try {
      if (
        requireConfirmation &&
        !(await confirm({
          title: "변경사항을 저장할까요?",
          description: "아래 내용은 공개 페이지 또는 데이터에 즉시 반영됩니다.",
          confirmLabel: "저장 반영",
          details: diff,
        }))
      )
        return;
      saveRequested.current = true;
      await onSave();
    } finally {
      saveInFlight.current = false;
    }
  }, [confirm, diff, onSave, requireConfirmation, saveDisabled]);

  const reset = async () => {
    if (
      !(await confirm({
        title: "변경사항을 모두 되돌릴까요?",
        description:
          "이 페이지에서 저장하지 않은 변경사항을 버리고 마지막 저장 상태로 돌아갑니다.",
        confirmLabel: "모두 되돌리기",
        tone: "danger",
      }))
    )
      return;
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
    const timer = window.setTimeout(() => setJustSaved(false), 2000);
    return () => window.clearTimeout(timer);
  }, [justSaved]);

  useEffect(() => {
    if (dirty) setJustSaved(false);
  }, [dirty]);

  useEffect(() => {
    const handleSaveShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, [save]);

  const buttonLabel = saving
    ? "저장 중"
    : justSaved && !dirty
      ? "저장 완료"
      : dirty
        ? `${label}${diff.length ? ` (${diff.length})` : ""}`
        : label;
  const announcement = saving
    ? "저장 중"
    : justSaved && !dirty
      ? "저장 완료"
      : dirty
        ? "저장하지 않은 변경사항"
        : "저장할 변경사항 없음";

  return (
    <>
      <span
        className="draft-save-announcement"
        role="status"
        aria-live="polite"
      >
        {announcement}
      </span>
      <button
        type="button"
        data-tour-id="draft-reset"
        className="admin-btn admin-btn-secondary draft-reset-button"
        disabled={!dirty || saving}
        onClick={() => void reset()}
      >
        <Undo2 aria-hidden="true" />
        되돌리기
      </button>
      <button
        type="button"
        data-tour-id="draft-save"
        className={`admin-btn admin-btn-primary draft-save-button${justSaved && !dirty ? " is-success" : ""}`}
        disabled={saveDisabled}
        onClick={() => void save()}
      >
        <Save aria-hidden="true" />
        {buttonLabel}
      </button>
    </>
  );
}
