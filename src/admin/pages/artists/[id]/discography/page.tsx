"use client";

import { useParams } from "next/navigation";
import { Disc3 } from "lucide-react";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import AdminLanguageTabs from "@/admin/components/content/AdminLanguageTabs";
import AdminTranslationButton from "@/admin/components/content/AdminTranslationButton";
import ContentWorkbench, {
  type WorkbenchTab,
} from "@/admin/components/content/ContentWorkbench";
import DraftSaveButton from "@/admin/components/content/DraftSaveButton";
import OverflowDeleteMenu from "@/admin/components/content/OverflowDeleteMenu";
import PreviewButton from "@/admin/components/content/PreviewButton";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import type { EditorTab } from "@/core/utils/music-editor";
import DiscographyBulkModal from "./DiscographyBulkModal";
import DiscographyContextRail from "./DiscographyContextRail";
import DiscographyEditorSections from "./DiscographyEditorSections";
import { useDiscographyEditor } from "./useDiscographyEditor";

export default function DiscographyAdmin() {
  const routeArtistId = useParams<{ id: string }>()?.id;
  const requestConfirm = useAdminConfirm();
  const {
    artistId,
    artistName,
    albums,
    tab,
    language,
    setLanguage,
    search,
    setSearch,
    filter,
    setFilter,
    expandedTrack,
    setExpandedTrack,
    bulkOpen,
    setBulkOpen,
    bulkValue,
    setBulkValue,
    sorting,
    setSorting,
    sortDirty,
    setSortDirty,
    setDragAlbum,
    setDragTrack,
    pendingDelete,
    setPendingDelete,
    draft,
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
    setToast,
    patchDraft,
    recovery,
    restoreDraft,
    discardDraftBackup,
    validation,
    nestedDrafts,
    previewPayload,
    openPreview,
    patchTrack,
    selectAlbum,
    addAlbum,
    changeTab,
    registerUpload,
    save,
    removeAlbum,
    reorderAlbum,
    saveOrder,
    reorderTrack,
    applyBulk,
    visibleAlbums,
  } = useDiscographyEditor({ routeArtistId, requestConfirm });

  if (loading)
    return <AdminSkeleton variant="workbench" className="min-h-[420px]" />;

  const workbenchTabs: WorkbenchTab<EditorTab>[] = [
    {
      id: "basic",
      label: "기본 정보",
      complete: Boolean(draft?.title && draft.release_date && draft.cover_url),
      missing: [draft?.title, draft?.release_date, draft?.cover_url].filter(
        (value) => !value,
      ).length,
    },
    {
      id: "content",
      label: "콘텐츠",
      complete: Boolean(draft?.description_ko),
      missing: draft?.description_ko ? 0 : 1,
    },
    {
      id: "tracks",
      label: `트랙 ${draft?.tracks.length || 0}`,
      complete: Boolean(draft?.tracks.length),
      missing: draft?.tracks.length ? 0 : 1,
    },
    {
      id: "gallery",
      label: "갤러리",
      complete: Boolean(draft && albums.some((album) => album.id === draft.id)),
    },
    {
      id: "publish",
      label: "공개 설정",
      complete: Boolean(validation?.canPublish),
      missing: validation?.publishIssues.length || 0,
    },
  ];

  const rail = (closeRail: () => void) => (
    <DiscographyContextRail
      albums={albums}
      draft={draft}
      visibleAlbums={visibleAlbums}
      search={search}
      filter={filter}
      sorting={sorting}
      sortDirty={sortDirty}
      onAddAlbum={() =>
        void addAlbum().then((created) => {
          if (created) closeRail();
        })
      }
      onSearchChange={setSearch}
      onFilterChange={setFilter}
      onToggleSorting={() => {
        setSorting((value) => !value);
        if (!sorting) setSortDirty(false);
      }}
      onDragAlbum={setDragAlbum}
      onReorderAlbum={reorderAlbum}
      onSaveOrder={() =>
        void saveOrder().then((saved) => {
          if (saved) closeRail();
        })
      }
      onSelectAlbum={(album) =>
        void selectAlbum(album).then((selected) => {
          if (selected) closeRail();
        })
      }
    />
  );

  const identity = draft ? (
    <>
      <span className="music-header-cover">
        {draft.cover_url ? (
          <AdminAssetImage src={draft.cover_url} alt="" sizes="72px" />
        ) : (
          <i />
        )}
      </span>
      <div>
        <p>
          <span className={`cms-status ${draft.is_published ? "is-live" : ""}`}>
            {draft.is_published ? "공개" : "초안"}
          </span>
        </p>
        <h2>{draft.title || "제목 없는 새 앨범"}</h2>
        <small>{artistName}</small>
      </div>
    </>
  ) : (
    <div className="content-identity-copy">
      <p>
        <span className="cms-status">선택 안 됨</span>
      </p>
      <h2>앨범을 선택하세요</h2>
      <small>{artistName}</small>
    </div>
  );

  const actions = draft ? (
    <div className="music-header-actions">
      <PreviewButton onClick={openPreview} disabled={!previewPayload} />
      {albums.some((album) => album.id === draft.id) && (
        <OverflowDeleteMenu
          onDelete={() =>
            pendingDelete ? setPendingDelete(false) : setDeleteOpen(true)
          }
          deleteLabel={pendingDelete ? "삭제 취소" : "삭제"}
        />
      )}
      <DraftSaveButton
        snapshot={snapshot}
        draft={draft}
        dirty={dirty || sortDirty || nestedDrafts.dirty || pendingDelete}
        saving={saving}
        disabled={!pendingDelete && !validation?.canSave && dirty}
        extraDiff={[
          ...(pendingDelete
            ? [
                {
                  kind: "delete" as const,
                  field: "앨범",
                  before: draft.title,
                  after: "삭제",
                },
              ]
            : []),
          ...(sortDirty
            ? [
                {
                  kind: "order" as const,
                  field: "앨범 노출 순서",
                  before: "기존 순서",
                  after: "변경된 순서",
                },
              ]
            : []),
          ...nestedDrafts.diff,
        ]}
        onSave={async () => {
          if (pendingDelete) return removeAlbum();
          if (dirty) await save();
          if (sortDirty) await saveOrder();
          await nestedDrafts.commit();
        }}
      />
    </div>
  ) : (
    <button
      type="button"
      className="admin-btn admin-btn-primary"
      onClick={() => void addAlbum()}
    >
      새 앨범 만들기
    </button>
  );

  return (
    <>
      <ContentWorkbench
        rail={rail}
        railLabel="앨범 선택"
        identity={identity}
        actions={actions}
        toolbar={
          draft ? (
            <>
              <AdminLanguageTabs
                activeLang={language}
                onChange={setLanguage}
                values={{
                  ko: draft.description_ko,
                  en: draft.description_en,
                  ja: draft.description_ja,
                }}
              />
              <AdminTranslationButton
                documentKind="album"
                fields={[
                  {
                    key: "description",
                    label: "앨범 소개",
                    format: "plain",
                    ko: draft.description_ko,
                    en: draft.description_en,
                    ja: draft.description_ja,
                  },
                ]}
                onApply={(translations) =>
                  patchDraft({
                    description_en:
                      translations.description?.en ?? draft.description_en,
                    description_ja:
                      translations.description?.ja ?? draft.description_ja,
                  })
                }
                onError={setError}
                onSuccess={setToast}
              />
            </>
          ) : null
        }
        tabs={workbenchTabs}
        activeTab={tab}
        onTabChange={changeTab}
        error={error}
        onDismissError={() => setError("")}
        toast={toast}
        className="music-editor-shell"
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
          <div className="music-no-selection">
            <span>
              <Disc3 aria-hidden="true" />
            </span>
            <h2>앨범을 선택하세요</h2>
            <p>
              왼쪽 라이브러리에서 앨범을 열거나 새 앨범을 추가할 수 있습니다.
            </p>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => void addAlbum()}
            >
              새 앨범 만들기
            </button>
          </div>
        ) : (
          <DiscographyEditorSections
            artistId={artistId}
            albums={albums}
            draft={draft}
            tab={tab}
            language={language}
            expandedTrack={expandedTrack}
            validation={validation}
            patchDraft={patchDraft}
            patchTrack={patchTrack}
            registerUpload={registerUpload}
            onError={setError}
            onToast={setToast}
            onOpenBulk={() => setBulkOpen(true)}
            onAddTrack={(track) => {
              patchDraft({ tracks: [...draft.tracks, track] });
              setExpandedTrack(track.id);
            }}
            onToggleTrack={(trackId) =>
              setExpandedTrack(expandedTrack === trackId ? null : trackId)
            }
            onDragStart={setDragTrack}
            onReorderTrack={reorderTrack}
          />
        )}
      </ContentWorkbench>

      {bulkOpen && (
        <DiscographyBulkModal
          value={bulkValue}
          onChange={setBulkValue}
          onClose={() => setBulkOpen(false)}
          onApply={applyBulk}
        />
      )}

      {deleteOpen && draft && (
        <DeleteConfirmDialog
          title="앨범을 삭제할까요?"
          description="삭제 작업은 상단 저장 전까지 서버에 반영되지 않습니다."
          confirmValue={draft.title}
          valueLabel="앨범명"
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
