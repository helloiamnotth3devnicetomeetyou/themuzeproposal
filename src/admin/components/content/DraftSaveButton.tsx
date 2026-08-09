"use client";

import { useMemo } from "react";
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
    await onSave();
  };

  const status = saving ? "저장 중…" : dirty ? disabled ? "필수 항목을 확인하세요" : diff.length ? `${diff.length}건 변경됨` : "저장할 변경사항 있음" : "저장됨";

  return <><span className={`draft-save-status${dirty ? " is-dirty" : ""}${disabled ? " is-invalid" : ""}`} role="status" aria-live="polite">{status}</span><button type="button" data-tour-id="draft-save" className="admin-btn admin-btn-primary draft-save-button" disabled={disabled || !dirty || saving} onClick={() => void save()}><Save aria-hidden="true" />{saving ? "저장 중…" : `${label}${diff.length ? ` (${diff.length})` : ""}`}</button></>;
}
