"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, FileText, Plus } from "lucide-react";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import ContentWorkbench, {
  type WorkbenchTab,
} from "@/admin/components/content/ContentWorkbench";
import PreviewButton from "@/admin/components/content/PreviewButton";
import DraftSaveButton from "@/admin/components/content/DraftSaveButton";
import OverflowDeleteMenu from "@/admin/components/content/OverflowDeleteMenu";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import FormField from "@/admin/components/content/FormField";
import AdminLanguageTabs from "@/admin/components/content/AdminLanguageTabs";
import NoticeCategoryInput from "@/admin/components/content/NoticeCategoryInput";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { hasRichTextContent, sanitizeRichText } from "@/core/utils/rich-text";
import { revalidatePublicCache } from "@/core/utils/public-cache";
import { supabase } from "@/core/supabase/client";

import { useAdminPreview } from "@/admin/hooks/useAdminPreview";
import { useDraftBackup } from "@/admin/hooks/useDraftBackup";
import { duplicateNoticeDraft, type NoticeDraft } from "./notice-editor-model";
type Notice = {
  id: string;
  title_ko: string;
  title_en: string | null;
  title_ja: string | null;
  content_ko: string | null;
  content_en: string | null;
  content_ja: string | null;
  category_ko: string;
  category_en: string | null;
  category_ja: string | null;
  date: string;
  is_published: boolean;
};

type NoticeTab = "content" | "publish";
type NoticeFilter = "all" | "published" | "draft";
type NoticeLanguage = "ko" | "en" | "ja";

const tabs: WorkbenchTab<NoticeTab>[] = [
  { id: "content", label: "공지 내용" },
  { id: "publish", label: "발행 설정" },
];

const emptyNotice = (): NoticeDraft => ({
  id: null,
  titleKo: "",
  titleEn: "",
  titleJa: "",
  contentKo: "",
  contentEn: "",
  contentJa: "",
  categoryKo: "공지",
  categoryEn: "Notice",
  categoryJa: "お知らせ",
  date: new Date().toISOString().slice(0, 10),
  published: true,
});

const fromNotice = (notice: Notice): NoticeDraft => ({
  id: notice.id,
  titleKo: notice.title_ko,
  titleEn: notice.title_en || "",
  titleJa: notice.title_ja || "",
  contentKo: sanitizeRichText(notice.content_ko || ""),
  contentEn: sanitizeRichText(notice.content_en || ""),
  contentJa: sanitizeRichText(notice.content_ja || ""),
  categoryKo: notice.category_ko,
  categoryEn: notice.category_en || "",
  categoryJa: notice.category_ja || "",
  date: notice.date,
  published: notice.is_published,
});

export default function NoticeManager({
  artistId: scopeArtistId,
}: {
  artistId?: string;
}) {
  const selectedNoticeId = useSearchParams().get("notice");
  const requestConfirm = useAdminConfirm();
  const [artistId, setArtistId] = useState<string | null>(null);
  const [scopeName, setScopeName] = useState(
    scopeArtistId ? "아티스트" : "THE MUZE",
  );
  const [scopeSlug, setScopeSlug] = useState("");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [draft, setDraft] = useState<NoticeDraft | null>(null);
  const [snapshot, setSnapshot] = useState("");
  const [tab, setTab] = useState<NoticeTab>("content");
  const [language, setLanguage] = useState<NoticeLanguage>("ko");
  const [filter, setFilter] = useState<NoticeFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const editorRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [previewNoticeId] = useState(() => `preview-${crypto.randomUUID()}`);

  const serializedDraft = useMemo(
    () => (draft ? JSON.stringify(draft) : ""),
    [draft],
  );
  const dirty = Boolean(draft && serializedDraft !== snapshot);
  const restoreNotice = useCallback(
    (saved: NoticeDraft) => setDraft(saved),
    [],
  );
  const { recovery, restoreBackup, discardBackup } = useDraftBackup({
    key: `admin-draft:notices:${scopeArtistId || "global"}`,
    draft,
    snapshot,
    dirty,
    restore: restoreNotice,
  });
  const canSave = Boolean(
    draft?.titleKo.trim() &&
    hasRichTextContent(draft.contentKo) &&
    draft.categoryKo.trim() &&
    draft.date,
  );
  const categoryOptions = useMemo(
    () => [
      ...new Set(
        ["공지", ...notices.map((notice) => notice.category_ko)]
          .map((category) => category.trim())
          .filter(Boolean),
      ),
    ],
    [notices],
  );

  const effectiveNoticeId = draft?.id || previewNoticeId;
  const previewPayload = useMemo(
    () =>
      draft
        ? {
            scope: { name: scopeName, artistSlug: scopeSlug || undefined },
            notice: {
              id: effectiveNoticeId,
              title: {
                ko: draft.titleKo,
                en: draft.titleEn,
                ja: draft.titleJa,
              },
              content: {
                ko: sanitizeRichText(draft.contentKo),
                en: sanitizeRichText(draft.contentEn),
                ja: sanitizeRichText(draft.contentJa),
              },
              category: {
                ko: draft.categoryKo,
                en: draft.categoryEn,
                ja: draft.categoryJa,
              },
              date: draft.date,
            },
          }
        : null,
    [draft, effectiveNoticeId, scopeName, scopeSlug],
  );
  const { openPreview } = useAdminPreview({
    kind: "notice",
    payload: previewPayload,
    targetPath: previewPayload
      ? scopeSlug
        ? `/${scopeSlug}/notice/${effectiveNoticeId}`
        : `/notice/${effectiveNoticeId}`
      : "",
    canPreview: Boolean(previewPayload),
    unavailableMessage: "미리보기할 공지 내용을 먼저 입력해 주세요.",
    onError: setError,
  });
  const patchDraft = (patch: Partial<NoticeDraft>) => {
    setFieldErrors({});
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const loadNotices = useCallback(
    async (preferredId?: string) => {
      setLoading(true);
      setError("");
      const artistLookup = scopeArtistId
        ? supabase
            .from("artists")
            .select("id,name,slug")
            .eq("id", scopeArtistId)
            .single()
        : null;
      const noticesQuery = (
        scopeArtistId
          ? supabase
              .from("notices")
              .select(
                "id,title_ko,title_en,title_ja,content_ko,content_en,content_ja,category_ko,category_en,category_ja,date,is_published",
              )
              .eq("artist_id", scopeArtistId)
          : supabase
              .from("notices")
              .select(
                "id,title_ko,title_en,title_ja,content_ko,content_en,content_ja,category_ko,category_en,category_ja,date,is_published",
              )
              .is("artist_id", null)
      ).order("date", { ascending: false });
      const [artistResult, noticeResult] = await Promise.all([
        artistLookup,
        noticesQuery,
      ]);
      let resolvedArtistId: string | null = null;
      if (scopeArtistId) {
        const artist = artistResult?.data;
        if (artistResult?.error || !artist) {
          setError("아티스트 정보를 불러오지 못했습니다.");
          setLoading(false);
          return;
        }
        resolvedArtistId = artist.id;
        setScopeName(artist.name || "아티스트");
        setScopeSlug(artist.slug || "");
      } else {
        setScopeName("THE MUZE");
        setScopeSlug("");
      }
      setArtistId(resolvedArtistId);
      const { data, error: noticeError } = noticeResult;
      if (noticeError) {
        setError(noticeError.message);
        setLoading(false);
        return;
      }
      const nextNotices = (data as Notice[] | null) ?? [];
      const selected =
        nextNotices.find(
          (notice) => notice.id === (preferredId || selectedNoticeId),
        ) ??
        nextNotices[0] ??
        null;
      setNotices(nextNotices);
      if (selected) {
        const nextDraft = fromNotice(selected);
        setDraft(nextDraft);
        setSnapshot(JSON.stringify(nextDraft));
      } else {
        setDraft(null);
        setSnapshot("");
      }
      setLoading(false);
    },
    [scopeArtistId, selectedNoticeId],
  );

  useEffect(() => {
    void Promise.resolve().then(() => loadNotices());
  }, [loadNotices]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleNotices = notices.filter((notice) => {
    const matchesSearch = `${notice.title_ko} ${notice.category_ko}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "published" ? notice.is_published : !notice.is_published);
    return matchesSearch && matchesFilter;
  });

  const selectNotice = async (notice: Notice) => {
    if (
      (dirty || pendingDelete) &&
      !(await requestConfirm({
        title: "변경사항을 버릴까요?",
        description:
          "현재 공지에서 저장하지 않은 내용이 사라집니다. 다른 공지를 열기 전에 한 번 더 확인해 주세요.",
        confirmLabel: "버리고 열기",
        tone: "danger",
      }))
    )
      return;
    const nextDraft = fromNotice(notice);
    setDraft(nextDraft);
    setPendingDelete(false);
    setSnapshot(JSON.stringify(nextDraft));
    setTab("content");
    setError("");
  };

  const addNotice = async () => {
    if (
      (dirty || pendingDelete) &&
      !(await requestConfirm({
        title: "새 공지를 작성할까요?",
        description:
          "현재 공지에서 저장하지 않은 내용이 사라지고 새 작성 화면으로 이동합니다.",
        confirmLabel: "버리고 새로 작성",
        tone: "danger",
      }))
    )
      return;
    const nextDraft = emptyNotice();
    setDraft(nextDraft);
    setPendingDelete(false);
    setSnapshot(JSON.stringify(nextDraft));
    setTab("content");
    setError("");
  };

  const saveNotice = async () => {
    if (!draft || !canSave) {
      const errors = !draft
        ? {}
        : {
            ...(draft.titleKo.trim()
              ? {}
              : { titleKo: "한국어 제목을 입력해 주세요." }),
            ...(hasRichTextContent(draft.contentKo)
              ? {}
              : { contentKo: "한국어 본문을 입력해 주세요." }),
            ...(draft.categoryKo.trim()
              ? {}
              : { categoryKo: "한국어 분류를 입력해 주세요." }),
            ...(draft.date ? {} : { date: "등록일을 입력해 주세요." }),
          };
      setFieldErrors(errors);
      setTab("content");
      setLanguage("ko");
      const first = Object.keys(errors)[0];
      window.setTimeout(() =>
        editorRef.current
          ?.querySelector<HTMLElement>(
            `[data-validation-field="${first}"] input, [data-validation-field="${first}"] [contenteditable=true]`,
          )
          ?.focus(),
      );
      setError("분류, 제목, 내용, 등록일을 모두 입력하세요.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      artist_id: artistId,
      title_ko: draft.titleKo,
      title_en: draft.titleEn.trim() || null,
      title_ja: draft.titleJa.trim() || null,
      content_ko: sanitizeRichText(draft.contentKo),
      content_en: sanitizeRichText(draft.contentEn) || null,
      content_ja: sanitizeRichText(draft.contentJa) || null,
      category_ko: draft.categoryKo.trim(),
      category_en: draft.categoryEn.trim() || null,
      category_ja: draft.categoryJa.trim() || null,
      date: draft.date,
      is_published: draft.published,
      published_at: draft.published ? new Date().toISOString() : null,
    };
    const result = draft.id
      ? await supabase
          .from("notices")
          .update(payload)
          .eq("id", draft.id)
          .select("id")
          .single()
      : await supabase.from("notices").insert(payload).select("id").single();
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setToast(draft.id ? "공지를 저장했습니다." : "새 공지를 작성했습니다.");
    discardBackup();
    await revalidatePublicCache("public-notices", "public-notice-title");
    await loadNotices(result.data.id);
  };

  const duplicateNotice = async () => {
    if (!draft?.id) return;
    if (
      (dirty || pendingDelete) &&
      !(await requestConfirm({
        title: "변경사항을 버리고 복제할까요?",
        description:
          "현재 저장하지 않은 변경사항은 사라지고, 선택한 공지의 비공개 복제 초안이 열립니다.",
        confirmLabel: "버리고 복제",
        tone: "danger",
      }))
    )
      return;
    const next = duplicateNoticeDraft(draft);
    setPendingDelete(false);
    setFieldErrors({});
    setDraft(next);
    setSnapshot(JSON.stringify(draft));
    setTab("content");
    setLanguage("ko");
    setError("");
  };

  const removeNotice = async () => {
    if (!draft?.id) return;
    setDeleting(true);
    const { error: deleteError } = await supabase
      .from("notices")
      .delete()
      .eq("id", draft.id);
    setDeleting(false);
    if (deleteError) {
      setDeleteOpen(false);
      setError(deleteError.message);
      return;
    }
    setDeleteOpen(false);
    setToast("공지를 삭제했습니다.");
    await revalidatePublicCache("public-notices", "public-notice-title");
    await loadNotices();
  };

  if (loading)
    return <AdminSkeleton variant="workbench" className="min-h-[420px]" />;

  const rail = (
    <>
      <div className="content-rail-heading" data-tour-id="notice-create">
        <div>
          <h2>{scopeArtistId ? "아티스트 공지" : "전체 공지"}</h2>
        </div>
        <button
          type="button"
          onClick={() => void addNotice()}
          aria-label="공지 작성"
        >
          <Plus aria-hidden="true" />
        </button>
      </div>
      <div className="content-rail-tools" data-tour-id="notice-filters">
        <input
          data-tour-id="notice-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="공지 검색"
          aria-label="공지 검색"
        />
        <div className="content-filter-row" data-tour-id="notice-status-filter">
          {(["all", "published", "draft"] as NoticeFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? "is-active" : ""}
              onClick={() => setFilter(item)}
            >
              {item === "all"
                ? "전체"
                : item === "published"
                  ? "공개"
                  : "비공개"}
            </button>
          ))}
        </div>
      </div>
      <div className="content-rail-sort">
        <span>{visibleNotices.length}개 공지</span>
        <small>{scopeName}</small>
      </div>
      <div className="content-library-list notice-library-list">
        {draft && !draft.id && (
          <button
            type="button"
            className="content-library-item notice-library-item is-selected"
          >
            <span className="notice-library-date">
              <b>NEW</b>
              <small>{draft.date.slice(5).replace("-", ".")}</small>
            </span>
            <span className="content-library-copy">
              <b>{draft.titleKo || "새 공지"}</b>
              <small>
                {draft.categoryKo} · {draft.published ? "공개 예정" : "비공개"}
              </small>
            </span>
          </button>
        )}
        {visibleNotices.map((notice) => (
          <button
            key={notice.id}
            type="button"
            data-tour-id="entity-list-item"
            onClick={() => void selectNotice(notice)}
            className={`content-library-item notice-library-item ${draft?.id === notice.id ? "is-selected" : ""}`}
          >
            <span className="notice-library-date">
              <b>{notice.date.slice(0, 4)}</b>
              <small>{notice.date.slice(5).replace("-", ".")}</small>
            </span>
            <span className="content-library-copy">
              <b>{notice.title_ko}</b>
              <small>
                {notice.category_ko} · {notice.is_published ? "공개" : "비공개"}
              </small>
            </span>
            <span
              className={`content-library-dot ${notice.is_published ? "is-live" : ""}`}
            />
          </button>
        ))}
        {!visibleNotices.length && !draft?.id && (
          <div className="content-library-empty">
            <b>표시할 공지가 없습니다.</b>
            <span>검색 조건을 바꾸거나 새 공지를 작성하세요.</span>
          </div>
        )}
      </div>
    </>
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

  const actions = draft ? (
    <>
      <PreviewButton onClick={openPreview} disabled={!previewPayload} />
      {draft.id && (
        <button
          type="button"
          data-tour-id="entity-duplicate"
          className="admin-btn admin-btn-secondary"
          onClick={() => void duplicateNotice()}
        >
          <Copy aria-hidden="true" />
          복제
        </button>
      )}
      {draft.id && (
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
        dirty={dirty || pendingDelete}
        saving={saving}
        onSave={() => (pendingDelete ? removeNotice() : saveNotice())}
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
  ) : (
    <button
      type="button"
      className="admin-btn admin-btn-primary"
      onClick={() => void addNotice()}
    >
      공지 작성
    </button>
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
        {!draft ? (
          <div className="content-no-selection">
            <span>
              <FileText aria-hidden="true" />
            </span>
            <h2>공지를 선택하세요</h2>
            <p>
              왼쪽 라이브러리에서 공지를 열거나 새 소식을 작성할 수 있습니다.
            </p>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => void addNotice()}
            >
              공지 작성
            </button>
          </div>
        ) : (
          <div ref={editorRef} className="content-editor-stack">
            {tab === "content" && (
              <>
                <div className="content-section-heading">
                  <h3>공지 내용</h3>
                  <span>
                    독자가 목록에서 찾고 본문에서 읽게 될 제목과 내용을
                    작성합니다.
                  </span>
                </div>
                <label
                  data-validation-field="date"
                  className="music-field content-field-short"
                >
                  <span>
                    등록일 <b>*</b>
                  </span>
                  <input
                    type="date"
                    className="admin-input"
                    value={draft.date}
                    onChange={(event) =>
                      patchDraft({ date: event.target.value })
                    }
                    aria-invalid={Boolean(fieldErrors.date)}
                    aria-describedby={
                      fieldErrors.date ? "notice-date-error" : undefined
                    }
                  />
                  {fieldErrors.date && (
                    <p
                      id="notice-date-error"
                      className="admin-field-error"
                      role="alert"
                    >
                      {fieldErrors.date}
                    </p>
                  )}
                </label>
                <div
                  data-validation-field="categoryKo"
                  className="desk-translatable-field"
                >
                  <div className="desk-translatable-heading">
                    <label>분류{language === "ko" && <span>*</span>}</label>
                  </div>
                  <div className="desk-translatable-control">
                    {language === "ko" ? (
                      <NoticeCategoryInput
                        value={draft.categoryKo}
                        options={categoryOptions}
                        onChange={(categoryKo) => patchDraft({ categoryKo })}
                      />
                    ) : (
                      <input
                        className="admin-input w-full"
                        value={
                          language === "en"
                            ? draft.categoryEn
                            : draft.categoryJa
                        }
                        onChange={(event) =>
                          patchDraft(
                            language === "en"
                              ? { categoryEn: event.target.value }
                              : { categoryJa: event.target.value },
                          )
                        }
                      />
                    )}
                  </div>
                  {fieldErrors.categoryKo && (
                    <p className="admin-field-error" role="alert">
                      {fieldErrors.categoryKo}
                    </p>
                  )}
                </div>
                <div data-validation-field="titleKo">
                  <FormField
                    label="제목"
                    activeLang={language}
                    error={fieldErrors.titleKo}
                    valueKo={draft.titleKo}
                    valueEn={draft.titleEn}
                    valueJa={draft.titleJa}
                    onChangeKo={(titleKo) => patchDraft({ titleKo })}
                    onChangeEn={(titleEn) => patchDraft({ titleEn })}
                    onChangeJa={(titleJa) => patchDraft({ titleJa })}
                    required
                  />
                </div>
                <div data-validation-field="contentKo">
                  <FormField
                    label="본문"
                    type="richtext"
                    activeLang={language}
                    error={fieldErrors.contentKo}
                    valueKo={draft.contentKo}
                    valueEn={draft.contentEn}
                    valueJa={draft.contentJa}
                    onChangeKo={(contentKo) => patchDraft({ contentKo })}
                    onChangeEn={(contentEn) => patchDraft({ contentEn })}
                    onChangeJa={(contentJa) => patchDraft({ contentJa })}
                    required
                  />
                </div>
              </>
            )}
            {tab === "publish" && (
              <>
                <div className="content-section-heading">
                  <h3>발행 설정</h3>
                  <span>
                    공지의 노출 범위와 공개 상태를 마지막으로 확인합니다.
                  </span>
                </div>
                <div className="notice-preview-card">
                  <p>{draft.categoryKo || "분류"}</p>
                  <h3>{draft.titleKo || "공지 제목"}</h3>
                  <small>
                    {draft.date || "등록일 미설정"} ·{" "}
                    {scopeArtistId ? `${scopeName} 아티스트` : "전체 공지"}
                  </small>
                  {hasRichTextContent(draft.contentKo) ? (
                    <div
                      className="notice-preview-content"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeRichText(draft.contentKo),
                      }}
                    />
                  ) : (
                    <div className="notice-preview-content is-empty">
                      공지 내용을 입력하면 여기에 미리 표시됩니다.
                    </div>
                  )}
                </div>
                <div className="content-choice-grid">
                  <label className="content-choice">
                    <input
                      type="radio"
                      checked={draft.published}
                      onChange={() => patchDraft({ published: true })}
                    />
                    <span>
                      <b>공개</b>
                      <small>저장 즉시 사이트 공지 목록에 표시합니다.</small>
                    </span>
                  </label>
                  <label className="content-choice">
                    <input
                      type="radio"
                      checked={!draft.published}
                      onChange={() => patchDraft({ published: false })}
                    />
                    <span>
                      <b>비공개</b>
                      <small>
                        관리자에만 저장하고 사이트에는 표시하지 않습니다.
                      </small>
                    </span>
                  </label>
                </div>
              </>
            )}
          </div>
        )}
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
