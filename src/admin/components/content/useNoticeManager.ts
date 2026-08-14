"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import { useAdminPreview } from "@/admin/hooks/useAdminPreview";
import { useDraftBackup } from "@/admin/hooks/useDraftBackup";
import { hasRichTextContent, sanitizeRichText } from "@/core/utils/rich-text";
import { revalidatePublicCache } from "@/core/utils/public-cache";
import { supabase } from "@/core/supabase/client";
import {
  duplicateNoticeDraft,
  resolvePublishedAt,
  type NoticeDraft,
} from "./notice-editor-model";
import type {
  Notice,
  NoticeFilter,
  NoticeLanguage,
  NoticeTab,
} from "./notice-manager-types";

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

export default function useNoticeManager({
  scopeArtistId,
}: {
  scopeArtistId?: string;
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
                "id,title_ko,title_en,title_ja,content_ko,content_en,content_ja,category_ko,category_en,category_ja,date,is_published,published_at,updated_at",
              )
              .eq("artist_id", scopeArtistId)
          : supabase
              .from("notices")
              .select(
                "id,title_ko,title_en,title_ja,content_ko,content_en,content_ja,category_ko,category_en,category_ja,date,is_published,published_at,updated_at",
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
    const existingPublishedAt = draft.id
      ? notices.find((notice) => notice.id === draft.id)?.published_at
      : null;
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
      published_at: resolvePublishedAt(draft.published, existingPublishedAt),
    };
    const result = draft.id
      ? await supabase
          .from("notices")
          .update(payload)
          .eq("id", draft.id)
          .eq("updated_at", notices.find((notice) => notice.id === draft.id)?.updated_at ?? "")
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

  return {
    scopeName,
    notices,
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
  };
}
