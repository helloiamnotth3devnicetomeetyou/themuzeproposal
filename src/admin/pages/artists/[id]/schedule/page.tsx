"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import ContentWorkbench from "@/admin/components/content/ContentWorkbench";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import AdminLanguageTabs, {
  type AdminLanguage,
} from "@/admin/components/content/AdminLanguageTabs";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { useAdminEntityEditor } from "@/admin/hooks/useAdminEntityEditor";
import { useAdminPreview } from "@/admin/hooks/useAdminPreview";
import { supabase } from "@/core/supabase/client";
import { adminDbError } from "@/admin/utils/admin-db-error";
import { revalidatePublicCache } from "@/core/utils/public-cache";
import ScheduleCalendar from "./ScheduleCalendar";
import ScheduleActions from "./ScheduleActions";
import ScheduleEditorSections from "./ScheduleEditorSections";
import ScheduleIdentity from "./ScheduleIdentity";
import ScheduleLibraryRail from "./ScheduleLibraryRail";
import {
  emptyScheduleDraft,
  duplicateScheduleDraft,
  monthFromDateKey,
  monthKey,
  scheduleTabs,
  scheduleToDraft,
  today,
  type ScheduleDraft,
  type ScheduleRow,
  type ScheduleTab,
} from "./schedule-editor-model";

export default function ArtistScheduleAdminPage() {
  const artistId = useParams<{ id: string }>()?.id;
  const selectedScheduleId = useSearchParams().get("schedule");
  const requestConfirm = useAdminConfirm();
  const [artistName, setArtistName] = useState("");
  const [artistSlug, setArtistSlug] = useState("");
  const [artistColor, setArtistColor] = useState<string | null>(null);
  const [previewScheduleId] = useState(() => `preview-${crypto.randomUUID()}`);
  const [items, setItems] = useState<ScheduleRow[]>([]);
  const [tab, setTab] = useState<ScheduleTab>("calendar");
  const [calendarMonth, setCalendarMonth] = useState(() =>
    monthFromDateKey(today()),
  );
  const [pendingDelete, setPendingDelete] = useState(false);
  const [language, setLanguage] = useState<AdminLanguage>("ko");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const detailsRef = useRef<HTMLDivElement>(null);

  const {
    draft,
    setDraft,
    snapshot,
    setSnapshot,
    dirty,
    loading,
    setLoading,
    saving,
    setSaving,
    deleting,
    setDeleting,
    deleteOpen,
    setDeleteOpen,
    error,
    setError,
    toast,
    setToast,
    recovery,
    restoreDraft,
    discardDraftBackup,
  } = useAdminEntityEditor<ScheduleDraft>({
    initialDraft: null,
    storageKey: `admin-draft:schedule:${artistId}`,
  });
  const currentMonthKey = monthKey(calendarMonth);
  const calendarTitle = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(calendarMonth);
  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1,
    );
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [calendarMonth]);
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, ScheduleRow[]>();
    items.forEach((item) =>
      grouped.set(item.event_date, [
        ...(grouped.get(item.event_date) ?? []),
        item,
      ]),
    );
    return grouped;
  }, [items]);
  const monthItems = useMemo(
    () =>
      items
        .filter((item) => item.event_date.startsWith(currentMonthKey))
        .sort(
          (a, b) =>
            a.event_date.localeCompare(b.event_date) ||
            (a.start_time || "").localeCompare(b.start_time || ""),
        ),
    [currentMonthKey, items],
  );

  const loadItems = useCallback(
    async (selectId?: string) => {
      if (!artistId) return;
      const [artistResult, scheduleResult] = await Promise.all([
        supabase
          .from("artists")
          .select("name,slug,color")
          .eq("id", artistId)
          .single(),
        supabase
          .from("artist_schedules")
          .select("*")
          .eq("artist_id", artistId)
          .order("event_date", { ascending: false })
          .order("start_time", { ascending: true, nullsFirst: true }),
      ]);
      if (artistResult.data) {
        setArtistName(artistResult.data.name);
        setArtistSlug(artistResult.data.slug || "");
        setArtistColor(artistResult.data.color || null);
      }
      if (scheduleResult.error) {
        setError(
          scheduleResult.error.message.includes("artist_schedules")
            ? "일정 테이블이 없습니다. 018_artist_schedules.sql을 먼저 적용하세요."
            : scheduleResult.error.message,
        );
      } else {
        const next = (scheduleResult.data ?? []) as ScheduleRow[];
        setItems(next);
        const requestedId = selectId || selectedScheduleId;
        if (requestedId) {
          const selected = next.find((item) => item.id === requestedId);
          if (selected) {
            const nextDraft = scheduleToDraft(selected);
            setDraft(nextDraft);
            setSnapshot(JSON.stringify(nextDraft));
          }
        }
      }
      setLoading(false);
    },
    [artistId, selectedScheduleId, setDraft, setError, setLoading, setSnapshot],
  );

  useEffect(() => {
    void Promise.resolve().then(() => loadItems());
  }, [loadItems]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const patch = (value: Partial<ScheduleDraft>) => {
    setFieldErrors({});
    setDraft((current) => (current ? { ...current, ...value } : current));
  };
  const add = (eventDate = today()) => {
    const next = emptyScheduleDraft(eventDate);
    setPendingDelete(false);
    setDraft(next);
    setSnapshot(JSON.stringify(next));
    setCalendarMonth(monthFromDateKey(eventDate));
    setTab("details");
    setError("");
  };
  const select = async (item: ScheduleRow) => {
    if (
      (dirty || pendingDelete) &&
      !(await requestConfirm({
        title: "다른 일정을 열까요?",
        description:
          "현재 변경사항은 브라우저 임시 작업에 남지만 편집 화면에서는 전환됩니다.",
        confirmLabel: "전환",
      }))
    )
      return false;
    const next = scheduleToDraft(item);
    setPendingDelete(false);
    setDraft(next);
    setSnapshot(JSON.stringify(next));
    setCalendarMonth(monthFromDateKey(item.event_date));
    setTab("details");
    setError("");
    return true;
  };
  const moveMonth = (offset: number) =>
    setCalendarMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  const showToday = () => setCalendarMonth(monthFromDateKey(today()));
  const validation = useMemo(() => {
    if (!draft) return "";
    if (!draft.eventDate) return "날짜를 입력하세요.";
    if (!draft.titleKo.trim()) return "한국어 일정명을 입력하세요.";
    if (draft.linkUrl && !/^https?:\/\//i.test(draft.linkUrl))
      return "연결 링크는 http:// 또는 https://로 시작해야 합니다.";
    return "";
  }, [draft]);
  const validationErrors = useMemo(() => {
    if (!draft) return {} as Record<string, string>;
    if (!draft.eventDate) return { eventDate: "날짜를 입력해 주세요." };
    if (!draft.titleKo.trim())
      return { titleKo: "한국어 일정명을 입력해 주세요." };
    if (draft.linkUrl && !/^https?:\/\//i.test(draft.linkUrl))
      return {
        linkUrl: "연결 링크는 http:// 또는 https://로 시작해야 합니다.",
      };
    return {} as Record<string, string>;
  }, [draft]);

  const showValidation = () => {
    setFieldErrors(validationErrors);
    setTab("details");
    const first = Object.keys(validationErrors)[0];
    window.setTimeout(() =>
      detailsRef.current
        ?.querySelector<HTMLElement>(
          first === "titleKo" ? "input" : `input[name=\"${first}\"]`,
        )
        ?.focus(),
    );
  };

  const effectiveScheduleId = draft?.id || previewScheduleId;
  const previewPayload = useMemo(
    () =>
      draft && artistId && artistSlug && draft.eventDate
        ? {
            artist: { id: artistId, slug: artistSlug, color: artistColor },
            schedule: {
              id: effectiveScheduleId,
              event_date: draft.eventDate,
              start_time: draft.startTime || null,
              category: draft.category,
              title_ko: draft.titleKo,
              title_en: draft.titleEn || null,
              title_ja: draft.titleJa || null,
              description_ko: draft.descriptionKo || null,
              description_en: draft.descriptionEn || null,
              description_ja: draft.descriptionJa || null,
              location: draft.location || null,
              location_ko: draft.location || null,
              location_en: draft.locationEn || null,
              location_ja: draft.locationJa || null,
              link_url: draft.linkUrl || null,
              sort_order: draft.sortOrder,
            },
          }
        : null,
    [artistColor, artistId, artistSlug, draft, effectiveScheduleId],
  );
  const { openPreview } = useAdminPreview({
    kind: "schedule",
    payload: previewPayload,
    targetPath: previewPayload ? `/${artistSlug}/schedule` : "",
    canPreview: Boolean(previewPayload),
    unavailableMessage: "미리보기를 열 수 없습니다.",
    onError: setError,
  });

  const save = async () => {
    if (!draft || !artistId) return;
    if (validation) {
      showValidation();
      setError(validation);
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      artist_id: artistId,
      event_date: draft.eventDate,
      start_time: draft.startTime || null,
      category: draft.category,
      title_ko: draft.titleKo.trim(),
      title_en: draft.titleEn.trim() || null,
      title_ja: draft.titleJa.trim() || null,
      description_ko: draft.descriptionKo.trim() || null,
      description_en: draft.descriptionEn.trim() || null,
      description_ja: draft.descriptionJa.trim() || null,
      location: draft.location.trim() || null,
      location_ko: draft.location.trim() || null,
      location_en: draft.locationEn.trim() || null,
      location_ja: draft.locationJa.trim() || null,
      link_url: draft.linkUrl.trim() || null,
      is_published: draft.isPublished,
      sort_order: draft.sortOrder,
    };
    const result = draft.id
      ? await supabase
          .from("artist_schedules")
          .update(payload)
          .eq("id", draft.id)
          .eq(
            "updated_at",
            items.find((item) => item.id === draft.id)?.updated_at ?? "",
          )
          .select("id")
          .single()
      : await supabase
          .from("artist_schedules")
          .insert(payload)
          .select("id")
          .single();
    setSaving(false);
    if (result.error) {
      setError(adminDbError(result.error, "일정을 저장하지 못했습니다."));
      return;
    }
    setToast(
      draft.id ? "일정 변경사항을 저장했습니다." : "새 일정을 추가했습니다.",
    );
    discardDraftBackup();
    await revalidatePublicCache("public-artist-schedule");
    await loadItems(result.data.id);
  };

  const duplicate = async () => {
    if (!draft?.id) return;
    if (
      (dirty || pendingDelete) &&
      !(await requestConfirm({
        title: "변경사항을 버리고 복제할까요?",
        description:
          "현재 저장하지 않은 변경사항은 사라지고, 선택한 일정의 비공개 복제 초안이 열립니다.",
        confirmLabel: "버리고 복제",
        tone: "danger",
      }))
    )
      return;
    const next = duplicateScheduleDraft(draft);
    setPendingDelete(false);
    setFieldErrors({});
    setDraft(next);
    setSnapshot(JSON.stringify(draft));
    setTab("details");
    setError("");
  };

  const remove = async () => {
    if (!draft?.id) return;
    setDeleting(true);
    const result = await supabase
      .from("artist_schedules")
      .delete()
      .eq("id", draft.id);
    setDeleting(false);
    setDeleteOpen(false);
    if (result.error) {
      setError(adminDbError(result.error, "일정을 삭제하지 못했습니다."));
      return;
    }
    setDraft(null);
    setSnapshot("");
    setTab("calendar");
    setToast("일정을 삭제했습니다.");
    await revalidatePublicCache("public-artist-schedule");
    await loadItems();
  };

  if (loading)
    return <AdminSkeleton variant="workbench" className="min-h-[420px]" />;

  const rail = (closeRail: () => void) => (
    <ScheduleLibraryRail
      artistName={artistName}
      calendarTitle={calendarTitle}
      monthItems={monthItems}
      draft={draft}
      onAdd={() => {
        add();
        closeRail();
      }}
      onSelect={(item) =>
        void select(item).then((selected) => {
          if (selected) closeRail();
        })
      }
    />
  );
  const identity = <ScheduleIdentity artistName={artistName} draft={draft} />;
  const actions = (
    <ScheduleActions
      draft={draft}
      previewAvailable={Boolean(previewPayload)}
      pendingDelete={pendingDelete}
      snapshot={snapshot}
      dirty={dirty}
      saving={saving}
      onPreview={openPreview}
      onDuplicate={() => void duplicate()}
      onDelete={() =>
        pendingDelete ? setPendingDelete(false) : setDeleteOpen(true)
      }
      onSave={() => (pendingDelete ? remove() : save())}
      onAdd={() => add()}
    />
  );

  return (
    <>
      <ContentWorkbench
        rail={rail}
        railLabel="일정 선택"
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
            />
          ) : null
        }
        tabs={scheduleTabs.map((item) => ({
          ...item,
          complete:
            item.id === "calendar"
              ? items.length > 0
              : item.id === "details"
                ? Boolean(draft?.eventDate && draft.titleKo.trim())
                : Boolean(draft && !validation),
          missing:
            item.id === "calendar"
              ? items.length
                ? 0
                : 1
              : item.id === "details"
                ? [draft?.eventDate, draft?.titleKo.trim()].filter(
                    (value) => !value,
                  ).length
                : draft && !validation
                  ? 0
                  : 1,
        }))}
        activeTab={tab}
        onTabChange={setTab}
        error={error}
        onDismissError={() => setError("")}
        toast={toast}
        className="schedule-workbench"
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
        {tab === "calendar" ? (
          <ScheduleCalendar
            artistName={artistName}
            calendarTitle={calendarTitle}
            calendarDays={calendarDays}
            currentMonthKey={currentMonthKey}
            eventsByDate={eventsByDate}
            draft={draft}
            onAdd={add}
            onSelect={select}
            onMoveMonth={moveMonth}
            onShowToday={showToday}
          />
        ) : !draft ? (
          <div className="content-no-selection">
            <span>
              <CalendarDays aria-hidden="true" />
            </span>
            <h2>일정을 선택하세요</h2>
            <p>
              월간 달력에서 일정을 고르거나 날짜를 눌러 새 일정을 추가하세요.
            </p>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => add()}
            >
              일정 추가
            </button>
          </div>
        ) : (
          <ScheduleEditorSections
            draft={draft}
            tab={tab}
            language={language}
            fieldErrors={fieldErrors}
            detailsRef={detailsRef}
            patch={patch}
          />
        )}
      </ContentWorkbench>
      {deleteOpen && draft?.id && (
        <DeleteConfirmDialog
          title="일정을 삭제할까요?"
          description="삭제 작업은 상단 저장 전까지 서버에 반영되지 않습니다."
          confirmValue={draft.titleKo}
          valueLabel="일정명"
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
