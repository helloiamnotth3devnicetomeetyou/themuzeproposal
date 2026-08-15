"use client";

import { useParams, useSearchParams } from "next/navigation";
import { UserRound } from "lucide-react";
import AdminLanguageTabs from "@/admin/components/content/AdminLanguageTabs";
import AdminTranslationButton from "@/admin/components/content/AdminTranslationButton";
import ContentWorkbench from "@/admin/components/content/ContentWorkbench";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import { hasInvalidSocialLinks } from "@/admin/components/content/SocialLinksField";
import MemberActions from "./MemberActions";
import MemberEditorSections from "./MemberEditorSections";
import MemberIdentity from "./MemberIdentity";
import MemberLibraryRail from "./MemberLibraryRail";
import { memberTabs } from "./member-editor-model";
import { useMemberEditor } from "./useMemberEditor";

export default function ArtistMembersAdmin() {
  const routeArtistId = useParams<{ id: string }>()?.id;
  const selectedMemberId = useSearchParams().get("member");
  const requestConfirm = useAdminConfirm();
  const editor = useMemberEditor({
    routeArtistId,
    selectedMemberId,
    requestConfirm,
  });
  const {
    artistId,
    artistName,
    members,
    tab,
    setTab,
    language,
    setLanguage,
    sorting,
    setSorting,
    sortDirty,
    setSortDirty,
    newMemberId,
    pendingDelete,
    setPendingDelete,
    canSave,
    previewPayload,
    openPreview,
    nestedDrafts,
    draft,
    patchDraft,
    snapshot,
    dirty,
    loading,
    saving,
    deleting,
    deleteOpen,
    setDeleteOpen,
    error,
    setError,
    toast,
    recovery,
    restoreDraft,
    discardDraftBackup,
    selectMember,
    addMember,
    saveMember,
    removeMember,
    reorderMembers,
    saveOrder,
    onImageChange,
    onUploaded,
  } = editor;

  if (loading) {
    return <AdminSkeleton variant="workbench" className="min-h-[420px]" />;
  }

  const save = async () => {
    if (pendingDelete) return removeMember();
    if (dirty) await saveMember();
    if (sortDirty) await saveOrder();
    await nestedDrafts.commit();
  };

  return (
    <>
      <ContentWorkbench
        rail={(closeRail) => (
          <MemberLibraryRail
            draft={draft}
            members={members}
            sorting={sorting}
            sortDirty={sortDirty}
            onAdd={() =>
              void addMember().then((created) => {
                if (created) closeRail();
              })
            }
            onSelect={(member) =>
              void selectMember(member).then((selected) => {
                if (selected) closeRail();
              })
            }
            onReorder={reorderMembers}
            onToggleSorting={() => {
              setSorting((value) => !value);
              setSortDirty(false);
            }}
          />
        )}
        railLabel="멤버 선택"
        identity={<MemberIdentity draft={draft} artistName={artistName} />}
        actions={
          <MemberActions
            draft={draft}
            previewAvailable={Boolean(previewPayload)}
            pendingDelete={pendingDelete}
            sortDirty={sortDirty}
            snapshot={snapshot}
            dirty={dirty || sortDirty || nestedDrafts.dirty || pendingDelete}
            saving={saving}
            canSave={canSave}
            nestedDiff={nestedDrafts.diff}
            onPreview={openPreview}
            onDelete={() =>
              pendingDelete ? setPendingDelete(false) : setDeleteOpen(true)
            }
            onSave={save}
            onAdd={() => void addMember()}
          />
        }
        toolbar={
          draft ? (
            <>
              <AdminLanguageTabs
                activeLang={language}
                onChange={setLanguage}
                values={{ ko: draft.name, en: draft.engName, ja: draft.jaName }}
              />
              <AdminTranslationButton
                documentKind="member"
                fields={[
                  {
                    key: "role",
                    label: "멤버 역할",
                    format: "plain",
                    ko: draft.roleKo,
                    en: draft.roleEn,
                    ja: draft.roleJa,
                  },
                  {
                    key: "bio",
                    label: "멤버 소개",
                    format: "plain",
                    ko: draft.bioKo,
                    en: draft.bioEn,
                    ja: draft.bioJa,
                  },
                ]}
                onApply={(translations) =>
                  patchDraft({
                    roleEn: translations.role?.en ?? draft.roleEn,
                    roleJa: translations.role?.ja ?? draft.roleJa,
                    bioEn: translations.bio?.en ?? draft.bioEn,
                    bioJa: translations.bio?.ja ?? draft.bioJa,
                  })
                }
                onError={setError}
                onSuccess={editor.setToast}
              />
            </>
          ) : null
        }
        tabs={memberTabs.map((item) => ({
          ...item,
          complete:
            item.id === "basic"
              ? Boolean(draft?.name && draft.engName)
              : item.id === "profile"
                ? Boolean(
                    draft?.imageUrl && /^#[0-9a-f]{6}$/i.test(draft.color),
                  )
                : item.id === "content"
                  ? Boolean(draft?.bioKo)
                  : item.id === "social"
                    ? Boolean(
                        draft && !hasInvalidSocialLinks(draft.socialLinks),
                      )
                    : Boolean(draft?.id),
          missing:
            item.id === "basic"
              ? [draft?.name, draft?.engName].filter((value) => !value).length
              : item.id === "profile"
                ? [
                    draft?.imageUrl,
                    /^#[0-9a-f]{6}$/i.test(draft?.color || ""),
                  ].filter((value) => !value).length
                : item.id === "content"
                  ? draft?.bioKo
                    ? 0
                    : 1
                  : item.id === "social"
                    ? draft && !hasInvalidSocialLinks(draft.socialLinks)
                      ? 0
                      : 1
                    : 0,
        }))}
        activeTab={tab}
        onTabChange={setTab}
        error={error}
        onDismissError={() => setError("")}
        toast={toast}
        className="member-workbench"
        recovery={
          recovery
            ? {
                updatedAt: recovery.updatedAt,
                onRestore: restoreDraft,
                onDiscard: discardDraftBackup,
              }
            : null
        }
      >
        {!draft ? (
          <div className="content-no-selection">
            <span>
              <UserRound aria-hidden="true" />
            </span>
            <h2>멤버를 선택하세요</h2>
            <p>
              왼쪽 라이브러리에서 멤버를 선택하거나 새 멤버를 추가할 수
              있습니다.
            </p>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => void addMember()}
            >
              첫 멤버 추가
            </button>
          </div>
        ) : (
          <MemberEditorSections
            artistId={artistId}
            draft={draft}
            newMemberId={newMemberId}
            tab={tab}
            patchDraft={patchDraft}
            onImageChange={onImageChange}
            onUploaded={onUploaded}
            onError={setError}
            onToast={editor.setToast}
            language={language}
          />
        )}
      </ContentWorkbench>

      {deleteOpen && draft?.id && (
        <DeleteConfirmDialog
          title="멤버를 삭제할까요?"
          description="삭제 작업은 상단 저장 전까지 서버에 반영되지 않습니다."
          confirmValue={draft.name}
          valueLabel="멤버명"
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
