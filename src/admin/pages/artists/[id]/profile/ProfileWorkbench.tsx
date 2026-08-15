"use client";

import type { Dispatch, ReactNode, RefObject, SetStateAction } from "react";
import ContentWorkbench from "@/admin/components/content/ContentWorkbench";
import AdminLanguageTabs, {
  type AdminLanguage,
} from "@/admin/components/content/AdminLanguageTabs";
import AdminTranslationButton from "@/admin/components/content/AdminTranslationButton";
import DraftSaveButton from "@/admin/components/content/DraftSaveButton";
import OverflowDeleteMenu from "@/admin/components/content/OverflowDeleteMenu";
import PreviewButton from "@/admin/components/content/PreviewButton";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import { usePageDrafts } from "@/admin/hooks/usePageDrafts";
import {
  profileTabs,
  type ProfileDraft,
  type ProfileTab,
} from "./profile-editor-model";
import ProfileEditorSections from "./ProfileEditorSections";
import type { UploadedImageAsset } from "@/admin/components/assets/ImageAssetField";

type Recovery = {
  updatedAt: number;
  onRestore: () => void;
  onDiscard: () => void;
};

type ProfileWorkbenchProps = {
  identity: ReactNode;
  rail: ReactNode;
  draft: ProfileDraft;
  artistId: string | null;
  saveIssues: string[];
  completion: Array<{ label: string; ready: boolean }>;
  tab: ProfileTab;
  setTab: (tab: ProfileTab) => void;
  language: AdminLanguage;
  setLanguage: (language: AdminLanguage) => void;
  patchDraft: (
    patch: Partial<ProfileDraft> | ((current: ProfileDraft) => ProfileDraft),
  ) => void;
  onAssetChange: (field: "imageUrl" | "logoUrl", value: string) => void;
  onUploaded: (asset: UploadedImageAsset) => void;
  onError: (message: string) => void;
  onToast: (message: string) => void;
  previewEnabled: boolean;
  onPreview: () => void;
  pendingDelete: boolean;
  setPendingDelete: Dispatch<SetStateAction<boolean>>;
  snapshot: string;
  dirty: boolean;
  saving: boolean;
  nestedDrafts: ReturnType<typeof usePageDrafts>;
  onSave: () => Promise<void>;
  error: string;
  setError: (message: string) => void;
  toast: string;
  recovery: Recovery | null;
  editorBodyRef: RefObject<HTMLDivElement | null>;
  deleteOpen: boolean;
  setDeleteOpen: Dispatch<SetStateAction<boolean>>;
  deleting: boolean;
  artistName: string;
};

export default function ProfileWorkbench({
  identity,
  rail,
  draft,
  artistId,
  saveIssues,
  completion,
  tab,
  setTab,
  language,
  setLanguage,
  patchDraft,
  onAssetChange,
  onUploaded,
  onError,
  onToast,
  previewEnabled,
  onPreview,
  pendingDelete,
  setPendingDelete,
  snapshot,
  dirty,
  saving,
  nestedDrafts,
  onSave,
  error,
  setError,
  toast,
  recovery,
  editorBodyRef,
  deleteOpen,
  setDeleteOpen,
  deleting,
  artistName,
}: ProfileWorkbenchProps) {
  return (
    <>
      <ContentWorkbench
        rail={rail}
        identity={identity}
        actions={
          <>
            <PreviewButton onClick={onPreview} disabled={!previewEnabled} />
            <OverflowDeleteMenu
              onDelete={() =>
                pendingDelete ? setPendingDelete(false) : setDeleteOpen(true)
              }
              deleteLabel={pendingDelete ? "삭제 취소" : "삭제"}
            />
            <DraftSaveButton
              snapshot={snapshot}
              draft={draft}
              dirty={dirty || nestedDrafts.dirty || pendingDelete}
              saving={saving}
              extraDiff={[
                ...(pendingDelete
                  ? [
                      {
                        kind: "delete" as const,
                        field: "아티스트",
                        before: draft.name,
                        after: "삭제",
                      },
                    ]
                  : []),
                ...nestedDrafts.diff,
              ]}
              onSave={onSave}
              disabled={!pendingDelete && Boolean(saveIssues.length)}
              label="변경사항 저장"
            />
          </>
        }
        toolbar={
          <>
            <AdminLanguageTabs
              activeLang={language}
              onChange={setLanguage}
              values={{ ko: draft.name, en: draft.engName, ja: draft.jaName }}
            />
            <AdminTranslationButton
              documentKind="artist"
              fields={[
                {
                  key: "description",
                  label: "아티스트 소개",
                  format: "richtext",
                  ko: draft.descKo,
                  en: draft.descEn,
                  ja: draft.descJa,
                },
              ]}
              onApply={(translations) =>
                patchDraft({
                  ...(translations.description?.en
                    ? { descEn: translations.description.en }
                    : {}),
                  ...(translations.description?.ja
                    ? { descJa: translations.description.ja }
                    : {}),
                })
              }
              onError={onError}
              onSuccess={onToast}
            />
          </>
        }
        tabs={profileTabs.map((item, index) => ({
          ...item,
          complete: completion[index]?.ready,
          missing: completion[index]?.ready ? 0 : 1,
        }))}
        activeTab={tab}
        onTabChange={setTab}
        bodyRef={editorBodyRef}
        error={error}
        onDismissError={() => setError("")}
        toast={toast}
        recovery={recovery}
        className="profile-workbench"
      >
        <ProfileEditorSections
          artistId={artistId}
          isNew={false}
          draft={draft}
          saveIssues={saveIssues}
          tab={tab}
          language={language}
          patchDraft={patchDraft}
          onAssetChange={onAssetChange}
          onUploaded={onUploaded}
          onError={onError}
          onToast={onToast}
        />
      </ContentWorkbench>
      {deleteOpen && (
        <DeleteConfirmDialog
          title="아티스트를 삭제할까요?"
          description="삭제 작업은 관련 데이터까지 서버에 반영되며 되돌릴 수 없습니다."
          confirmValue={artistName}
          valueLabel="아티스트명"
          busy={deleting}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => {
            setPendingDelete(true);
            setDeleteOpen(false);
          }}
        />
      )}
    </>
  );
}
