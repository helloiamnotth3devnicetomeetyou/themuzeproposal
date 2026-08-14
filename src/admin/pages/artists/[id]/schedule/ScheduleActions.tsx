import { Copy } from "lucide-react";
import DraftSaveButton from "@/admin/components/content/DraftSaveButton";
import OverflowDeleteMenu from "@/admin/components/content/OverflowDeleteMenu";
import PreviewButton from "@/admin/components/content/PreviewButton";
import type { ScheduleDraft } from "./schedule-editor-model";

interface ScheduleActionsProps {
  draft: ScheduleDraft | null;
  previewAvailable: boolean;
  pendingDelete: boolean;
  snapshot: string;
  dirty: boolean;
  saving: boolean;
  onPreview: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSave: () => void | Promise<void>;
  onAdd: () => void;
}

export default function ScheduleActions({
  draft,
  previewAvailable,
  pendingDelete,
  snapshot,
  dirty,
  saving,
  onPreview,
  onDuplicate,
  onDelete,
  onSave,
  onAdd,
}: ScheduleActionsProps) {
  if (!draft) {
    return (
      <button
        type="button"
        className="admin-btn admin-btn-primary"
        onClick={onAdd}
      >
        일정 추가
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
        <OverflowDeleteMenu
          onDelete={onDelete}
          deleteLabel={pendingDelete ? "삭제 취소" : "삭제"}
        />
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
                  field: "일정",
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
