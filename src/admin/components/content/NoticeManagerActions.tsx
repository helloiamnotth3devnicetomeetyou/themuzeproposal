"use client";

import { Copy, Trash2 } from "lucide-react";
import DraftSaveButton from "@/admin/components/content/DraftSaveButton";
import PreviewButton from "@/admin/components/content/PreviewButton";
import type { NoticeDraft } from "./notice-editor-model";

type NoticeManagerActionsProps = {
  draft: NoticeDraft | null;
  previewAvailable: boolean;
  pendingDelete: boolean;
  snapshot: string;
  dirty: boolean;
  saving: boolean;
  onPreview: () => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSave: () => void | Promise<void>;
};

export default function NoticeManagerActions({
  draft,
  previewAvailable,
  pendingDelete,
  snapshot,
  dirty,
  saving,
  onPreview,
  onAdd,
  onDuplicate,
  onDelete,
  onSave,
}: NoticeManagerActionsProps) {
  if (!draft) {
    return (
      <button
        type="button"
        className="admin-btn admin-btn-primary"
        onClick={onAdd}
      >
        공지 작성
      </button>
    );
  }

  return (
    <>
      <PreviewButton onClick={onPreview} disabled={!previewAvailable} />
      {draft.id && (
        <button
          type="button"
          data-tour-id="entity-duplicate"
          className="admin-btn admin-btn-secondary"
          onClick={onDuplicate}
        >
          <Copy aria-hidden="true" />
          복제
        </button>
      )}
      {draft.id && (
        <button
          type="button"
          data-tour-id="entity-delete"
          className="admin-btn admin-btn-secondary notice-delete-button"
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" />
          {pendingDelete ? "삭제 취소" : "삭제"}
        </button>
      )}
      <DraftSaveButton
        snapshot={snapshot}
        draft={draft}
        dirty={dirty || pendingDelete}
        saving={saving}
        onSave={onSave}
        extraDiff={
          pendingDelete
            ? [
                {
                  kind: "delete",
                  field: "공지",
                  before: draft.titleKo,
                  after: "삭제",
                },
              ]
            : []
        }
      />
    </>
  );
}
