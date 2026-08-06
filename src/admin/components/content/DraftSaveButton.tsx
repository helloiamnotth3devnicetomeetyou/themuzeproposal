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
};

export default function DraftSaveButton({ snapshot, draft, dirty, saving, onSave, labels, extraDiff = [], disabled, label = "변경사항 저장" }: Props) {
  const confirm = useAdminConfirm();
  const diff = useMemo(() => {
    let before: unknown = {};
    try { before = snapshot ? JSON.parse(snapshot) : {}; } catch { /* invalid snapshots are shown as a full change */ }
    return [...buildDraftDiff(before, draft, labels), ...extraDiff];
  }, [draft, extraDiff, labels, snapshot]);

  const save = async () => {
    if (!await confirm({
      title: "변경사항을 저장할까요?",
      description: "아래 내용이 공개 페이지 데이터에 일괄 반영됩니다.",
      confirmLabel: "일괄 반영",
      details: diff,
    })) return;
    await onSave();
  };

  return <button type="button" data-tour-id="draft-save" className="admin-btn admin-btn-primary draft-save-button" disabled={disabled || !dirty || saving} onClick={() => void save()}><Save aria-hidden="true" />{saving ? "저장 중…" : label}</button>;
}
