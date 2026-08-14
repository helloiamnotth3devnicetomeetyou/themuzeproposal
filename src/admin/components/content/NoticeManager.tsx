"use client";

import ContentWorkbench, {
  type WorkbenchTab,
} from "@/admin/components/content/ContentWorkbench";
import AdminLanguageTabs from "@/admin/components/content/AdminLanguageTabs";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import { hasRichTextContent } from "@/core/utils/rich-text";
import NoticeManagerActions from "./NoticeManagerActions";
import NoticeManagerEditor from "./NoticeManagerEditor";
import NoticeManagerRail from "./NoticeManagerRail";
import useNoticeManager from "./useNoticeManager";
import type { NoticeTab } from "./notice-manager-types";

const tabs: WorkbenchTab<NoticeTab>[] = [
  { id: "content", label: "공지 내용" },
  { id: "publish", label: "발행 설정" },
];

export default function NoticeManager({
  artistId: scopeArtistId,
}: {
  artistId?: string;
}) {
  const {
    scopeName,
    visibleNotices,
    draft,
    snapshot,
    tab,
    language,
    filter,
    search,
    loading,
    saving,
    deleting,
    deleteOpen,
    pendingDelete,
    fieldErrors,
    editorRef,
    error,
    toast,
    dirty,
    categoryOptions,
    previewPayload,
    recovery,
    restoreBackup,
    discardBackup,
    openPreview,
    patchDraft,
    selectNotice,
    addNotice,
    saveNotice,
    duplicateNotice,
    removeNotice,
    setTab,
    setLanguage,
    setFilter,
    setSearch,
    setError,
    setDeleteOpen,
    setPendingDelete,
  } = useNoticeManager({ scopeArtistId });

  if (loading)
    return <AdminSkeleton variant="workbench" className="min-h-[420px]" />;

  const rail = (closeRail: () => void) => (
    <NoticeManagerRail
      scopeArtistId={scopeArtistId}
      scopeName={scopeName}
      visibleNotices={visibleNotices}
      draft={draft}
      search={search}
      filter={filter}
      onAdd={() =>
        void addNotice().then((created) => {
          if (created) closeRail();
        })
      }
      onSearchChange={setSearch}
      onFilterChange={setFilter}
      onSelect={(notice) =>
        void selectNotice(notice).then((selected) => {
          if (selected) closeRail();
        })
      }
    />
  );

  const identity = draft ? (
    <>
      <span className="notice-identity-date">
        <b>{draft.date ? draft.date.slice(5, 7) : "—"}</b>
        <small>{draft.date ? draft.date.slice(8, 10) : "—"}</small>
      </span>
      <div className="content-identity-copy">
        <p>
          <span className={`cms-status ${draft.published ? "is-live" : ""}`}>
            {draft.published ? "공개" : "비공개"}
          </span>
        </p>
        <h2>{draft.titleKo || "제목 없는 공지"}</h2>
        <small>
          {scopeName} · {draft.categoryKo || "분류 미설정"}
        </small>
      </div>
    </>
  ) : (
    <div className="content-identity-copy">
      <p>
        <span className="cms-status">선택 안 됨</span>
      </p>
      <h2>공지를 선택하세요</h2>
      <small>{scopeName} notice desk</small>
    </div>
  );

  const actions = (
    <NoticeManagerActions
      draft={draft}
      previewAvailable={Boolean(previewPayload)}
      pendingDelete={pendingDelete}
      snapshot={snapshot}
      dirty={dirty}
      saving={saving}
      onPreview={openPreview}
      onAdd={() => void addNotice()}
      onDuplicate={() => void duplicateNotice()}
      onDelete={() =>
        pendingDelete ? setPendingDelete(false) : setDeleteOpen(true)
      }
      onSave={() => (pendingDelete ? removeNotice() : saveNotice())}
    />
  );

  return (
    <>
      <ContentWorkbench
        rail={rail}
        railLabel="공지 선택"
        identity={identity}
        actions={actions}
        toolbar={
          draft ? (
            <AdminLanguageTabs
              activeLang={language}
              onChange={setLanguage}
              values={{
                ko: draft.titleKo,
                en: draft.titleEn,
                ja: draft.titleJa,
              }}
              ariaLabel="공지 작성 언어"
            />
          ) : null
        }
        tabs={tabs.map((item) => ({
          ...item,
          complete:
            item.id === "content"
              ? Boolean(
                  draft?.titleKo.trim() &&
                  hasRichTextContent(draft.contentKo) &&
                  draft.categoryKo.trim(),
                )
              : Boolean(draft?.date),
          missing:
            item.id === "content"
              ? [
                  draft?.titleKo.trim(),
                  draft?.categoryKo.trim(),
                  hasRichTextContent(draft?.contentKo || ""),
                ].filter((value) => !value).length
              : draft?.date
                ? 0
                : 1,
        }))}
        activeTab={tab}
        onTabChange={setTab}
        error={error}
        onDismissError={() => setError("")}
        toast={toast}
        className="notice-workbench"
        recovery={
          recovery
            ? {
                updatedAt: recovery.updatedAt,
                onRestore: restoreBackup,
                onDiscard: discardBackup,
              }
            : null
        }
      >
        <NoticeManagerEditor
          draft={draft}
          scopeArtistId={scopeArtistId}
          scopeName={scopeName}
          tab={tab}
          language={language}
          fieldErrors={fieldErrors}
          categoryOptions={categoryOptions}
          editorRef={editorRef}
          onPatch={patchDraft}
          onAdd={() => void addNotice()}
        />
      </ContentWorkbench>
      {deleteOpen && draft?.id && (
        <DeleteConfirmDialog
          title="공지를 삭제할까요?"
          description="삭제 작업은 상단 저장 전까지 서버에 반영되지 않습니다."
          confirmValue={draft.titleKo}
          valueLabel="공지 제목"
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
