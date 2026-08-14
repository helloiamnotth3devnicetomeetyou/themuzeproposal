import DraftSaveButton from "@/admin/components/content/DraftSaveButton";
import OverflowDeleteMenu from "@/admin/components/content/OverflowDeleteMenu";
import PreviewButton from "@/admin/components/content/PreviewButton";
import type { DraftDiffItem } from "@/admin/utils/draft-diff";
import type { MemberDraft } from "./member-editor-model";

type MemberActionsProps = {
  draft: MemberDraft | null;
  previewAvailable: boolean;
  pendingDelete: boolean;
  sortDirty: boolean;
  snapshot: string;
  dirty: boolean;
  saving: boolean;
  canSave: boolean;
  nestedDiff: DraftDiffItem[];
  onPreview: () => void;
  onDelete: () => void;
  onSave: () => void | Promise<void>;
  onAdd: () => void;
};

export default function MemberActions({
  draft,
  previewAvailable,
  pendingDelete,
  sortDirty,
  snapshot,
  dirty,
  saving,
  canSave,
  nestedDiff,
  onPreview,
  onDelete,
  onSave,
  onAdd,
}: MemberActionsProps) {
  if (!draft) {
    return (
      <button
        type="button"
        className="admin-btn admin-btn-primary"
        onClick={onAdd}
      >
        첫 멤버 추가
      </button>
    );
  }

  return (
    <>
      <PreviewButton onClick={onPreview} disabled={!previewAvailable} />
      {draft.id && (
        <OverflowDeleteMenu
          onDelete={onDelete}
          deleteLabel={pendingDelete ? "삭제 취소" : "삭제"}
        />
      )}
      <DraftSaveButton
        snapshot={snapshot}
        draft={draft}
        dirty={dirty}
        saving={saving}
        disabled={!pendingDelete && !canSave && dirty}
        extraDiff={[
          ...(pendingDelete
            ? [
                {
                  kind: "delete" as const,
                  field: "멤버",
                  before: draft.name,
                  after: "삭제",
                },
              ]
            : []),
          ...(sortDirty
            ? [
                {
                  kind: "order" as const,
                  field: "멤버 노출 순서",
                  before: "기존 순서",
                  after: "변경된 순서",
                },
              ]
            : []),
          ...nestedDiff,
        ]}
        onSave={onSave}
      />
    </>
  );
}
