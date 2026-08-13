"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CalendarDays, Copy, Plus } from "lucide-react";
import ContentWorkbench from "@/admin/components/content/ContentWorkbench";
import DraftSaveButton from "@/admin/components/content/DraftSaveButton";
import OverflowDeleteMenu from "@/admin/components/content/OverflowDeleteMenu";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import PreviewButton from "@/admin/components/content/PreviewButton";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import FormField from "@/admin/components/content/FormField";
import AdminLanguageTabs, {
  type AdminLanguage,
} from "@/admin/components/content/AdminLanguageTabs";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import CustomSelect from "@/core/components/form/CustomSelect";
import { useAdminEntityEditor } from "@/admin/hooks/useAdminEntityEditor";
import { useAdminPreview } from "@/admin/hooks/useAdminPreview";
import { supabase } from "@/core/supabase/client";
import { adminDbError } from "@/admin/utils/admin-db-error";
import ScheduleCalendar from "./ScheduleCalendar";
import styles from "@/styles/(admin)/pages/artist-schedule/schedule-admin.module.css";
import {
  CATEGORY,
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
  type Category,
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
      return;
    const next = scheduleToDraft(item);
    setPendingDelete(false);
    setDraft(next);
    setSnapshot(JSON.stringify(next));
    setCalendarMonth(monthFromDateKey(item.event_date));
    setTab("details");
    setError("");
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
    unavailableMessage: "?? ????? ??? ??? ???? ?? ??? ?????.",
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
    await loadItems();
  };

  if (loading)
    return <AdminSkeleton variant="workbench" className="min-h-[420px]" />;

  const rail = (
    <>
      <div className="content-rail-heading" data-tour-id="schedule-add">
        <div>
          <h2>일정 캘린더</h2>
        </div>
        <button type="button" onClick={() => add()} aria-label="일정 추가">
          <Plus aria-hidden="true" />
        </button>
      </div>
      <div className="content-rail-sort">
        <span>
          {calendarTitle} · {monthItems.length}개
        </span>
        <small>{artistName}</small>
      </div>
      <div className="content-library-list">
        {draft && !draft.id && (
          <button
            type="button"
            className={`content-library-item is-selected ${styles.railItem}`}
          >
            <span className={styles.railDate}>
              <b>NEW</b>
              <small>DATE</small>
            </span>
            <span className="content-library-copy">
              <b>{draft.titleKo || "새 일정"}</b>
              <small>{draft.eventDate}</small>
            </span>
            <i className="content-library-dot" />
          </button>
        )}
        {monthItems.map((item) => {
          const date = new Date(`${item.event_date}T00:00:00`);
          return (
            <button
              key={item.id}
              type="button"
              data-tour-id="entity-list-item"
              onClick={() => select(item)}
              className={`content-library-item ${draft?.id === item.id ? "is-selected" : ""} ${styles.railItem}`}
            >
              <span className={styles.railDate}>
                <b>{String(date.getDate()).padStart(2, "0")}</b>
                <small>
                  {date.toLocaleString("en", { month: "short" }).toUpperCase()}
                </small>
              </span>
              <span className="content-library-copy">
                <b>{item.title_ko}</b>
                <small>
                  {CATEGORY[item.category].label}
                  {item.start_time ? ` · ${item.start_time.slice(0, 5)}` : ""}
                </small>
              </span>
              <i
                className={`content-library-dot ${item.is_published ? "is-live" : ""}`}
              />
            </button>
          );
        })}
        {!monthItems.length && !(draft && !draft.id) && (
          <div className="content-library-empty">
            <b>이 달의 일정이 없습니다.</b>
            <span>달력에서 날짜를 골라 새 일정을 추가하세요.</span>
          </div>
        )}
      </div>
    </>
  );
  const identity = draft ? (
    <>
      <span className={styles.dateArt}>
        <b>{draft.eventDate ? draft.eventDate.slice(8, 10) : "--"}</b>
        <small>{draft.eventDate ? draft.eventDate.slice(5, 7) : "DATE"}</small>
      </span>
      <div className="content-identity-copy">
        <p>
          <span className={`cms-status ${draft.isPublished ? "is-live" : ""}`}>
            {draft.isPublished ? "공개" : "비공개"}
          </span>
        </p>
        <h2>{draft.titleKo || "이름 없는 일정"}</h2>
        <small>{artistName}</small>
      </div>
    </>
  ) : (
    <div className="content-identity-copy">
      <p>
        <span className="cms-status">선택 안 됨</span>
      </p>
      <h2>일정을 선택하세요</h2>
      <small>{artistName}</small>
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
          onClick={() => void duplicate()}
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
        onSave={() => (pendingDelete ? remove() : save())}
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
  ) : (
    <button
      type="button"
      className="admin-btn admin-btn-primary"
      onClick={() => add()}
    >
      일정 추가
    </button>
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
          <div className="content-editor-stack">
            {tab === "details" && (
              <div ref={detailsRef}>
                <div className="content-section-heading">
                  <h3>일정 기본 정보</h3>
                  <span>
                    공개 캘린더에서 날짜순으로 표시할 일정의 핵심 정보입니다.
                  </span>
                </div>
                <FormField
                  label="일정명"
                  activeLang={language}
                  error={fieldErrors.titleKo}
                  valueKo={draft.titleKo}
                  valueEn={draft.titleEn}
                  valueJa={draft.titleJa}
                  onChangeKo={(titleKo) => patch({ titleKo })}
                  onChangeEn={(titleEn) => patch({ titleEn })}
                  onChangeJa={(titleJa) => patch({ titleJa })}
                  required
                />
                <div className="music-field-grid two">
                  <label className="music-field">
                    <span>
                      날짜 <b>*</b>
                    </span>
                    <input
                      name="eventDate"
                      type="date"
                      className="admin-input"
                      value={draft.eventDate}
                      onChange={(event) =>
                        patch({ eventDate: event.target.value })
                      }
                      aria-invalid={Boolean(fieldErrors.eventDate)}
                      aria-describedby={
                        fieldErrors.eventDate
                          ? "schedule-date-error"
                          : undefined
                      }
                    />
                    {fieldErrors.eventDate && (
                      <p
                        id="schedule-date-error"
                        className="admin-field-error"
                        role="alert"
                      >
                        {fieldErrors.eventDate}
                      </p>
                    )}
                  </label>
                  <label className="music-field">
                    <span>시작 시간</span>
                    <input
                      type="time"
                      className="admin-input"
                      value={draft.startTime}
                      onChange={(event) =>
                        patch({ startTime: event.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="music-field-grid two">
                  <div className="music-field">
                    <span>
                      일정 유형 <b>*</b>
                    </span>
                    <CustomSelect
                      ariaLabel="일정 유형"
                      value={draft.category}
                      onChange={(category) =>
                        patch({ category: category as Category })
                      }
                      options={(Object.keys(CATEGORY) as Category[]).map(
                        (key) => ({ value: key, label: CATEGORY[key].label }),
                      )}
                    />
                  </div>
                  <div className="music-field">
                    <span>캘린더 표시</span>
                    <div
                      className={styles.categoryPreview}
                      style={
                        {
                          "--category-color": CATEGORY[draft.category].color,
                        } as CSSProperties
                      }
                    >
                      {(() => {
                        const CategoryIcon = CATEGORY[draft.category].icon;
                        return (
                          <i>
                            <CategoryIcon aria-hidden="true" />
                          </i>
                        );
                      })()}
                      {CATEGORY[draft.category].label}
                    </div>
                  </div>
                </div>
                <FormField
                  label="장소"
                  activeLang={language}
                  valueKo={draft.location}
                  valueEn={draft.locationEn}
                  valueJa={draft.locationJa}
                  onChangeKo={(location) => patch({ location })}
                  onChangeEn={(locationEn) => patch({ locationEn })}
                  onChangeJa={(locationJa) => patch({ locationJa })}
                />
                <label className="music-field content-field-short">
                  <span>연결 링크</span>
                  <input
                    name="linkUrl"
                    type="url"
                    className="admin-input"
                    value={draft.linkUrl}
                    onChange={(event) => patch({ linkUrl: event.target.value })}
                    placeholder="https://"
                    aria-invalid={Boolean(fieldErrors.linkUrl)}
                    aria-describedby={
                      fieldErrors.linkUrl ? "schedule-link-error" : undefined
                    }
                  />
                  {fieldErrors.linkUrl && (
                    <p
                      id="schedule-link-error"
                      className="admin-field-error"
                      role="alert"
                    >
                      {fieldErrors.linkUrl}
                    </p>
                  )}
                </label>
                <div className={styles.sectionDivider} />
                <div className="content-section-heading">
                  <h3>일정 설명</h3>
                  <span>
                    언어 탭을 전환해 같은 폼에서 설명을 작성합니다. 번역이
                    없으면 공개 페이지에서 한국어가 대신 표시됩니다.
                  </span>
                </div>
                <FormField
                  label="일정 설명"
                  type="textarea"
                  activeLang={language}
                  valueKo={draft.descriptionKo}
                  valueEn={draft.descriptionEn}
                  valueJa={draft.descriptionJa}
                  onChangeKo={(descriptionKo) => patch({ descriptionKo })}
                  onChangeEn={(descriptionEn) => patch({ descriptionEn })}
                  onChangeJa={(descriptionJa) => patch({ descriptionJa })}
                />
              </div>
            )}
            {tab === "publish" && (
              <>
                <div className="content-section-heading">
                  <h3>공개 설정</h3>
                  <span>
                    저장 즉시 아티스트 공개 일정 페이지에 반영할지 선택합니다.
                  </span>
                </div>
                <div className="content-publish-summary">
                  <div>
                    <span>일정</span>
                    <strong>{draft.titleKo || "미입력"}</strong>
                  </div>
                  <div>
                    <span>날짜 · 시간</span>
                    <strong>
                      {draft.eventDate || "미입력"}
                      {draft.startTime ? ` · ${draft.startTime}` : ""}
                    </strong>
                  </div>
                  <div>
                    <span>유형</span>
                    <strong>{CATEGORY[draft.category].label}</strong>
                  </div>
                  <div>
                    <span>장소</span>
                    <strong>{draft.location || "미설정"}</strong>
                  </div>
                </div>
                <div className="content-choice-grid">
                  <label className="content-choice">
                    <input
                      type="radio"
                      checked={draft.isPublished}
                      onChange={() => patch({ isPublished: true })}
                    />
                    <span>
                      <b>바로 공개</b>
                      <small>공개 일정 페이지와 달력에 표시합니다.</small>
                    </span>
                  </label>
                  <label className="content-choice">
                    <input
                      type="radio"
                      checked={!draft.isPublished}
                      onChange={() => patch({ isPublished: false })}
                    />
                    <span>
                      <b>비공개로 저장</b>
                      <small>관리자만 확인할 수 있는 상태로 보관합니다.</small>
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
