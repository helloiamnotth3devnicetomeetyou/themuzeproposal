"use client";

import { SCHEDULE_CATEGORY_COLORS } from "@/core/utils/design-tokens";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams } from "next/navigation";
import { LuCake, LuCalendarDays, LuCalendarPlus, LuChevronLeft, LuChevronRight, LuClock3, LuDisc3, LuMapPin, LuPartyPopper, LuPlus, LuRadio } from "react-icons/lu";
import type { IconType } from "react-icons";
import ContentWorkbench, { type WorkbenchTab } from "@/admin/components/content/ContentWorkbench";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import FormField from "@/admin/components/content/FormField";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import CustomSelect from "@/core/components/form/CustomSelect";
import { useAdminCrud } from "@/admin/hooks/useAdminCrud";
import { supabase } from "@/core/supabase/client";
import styles from "./schedule-admin.module.css";

type Category = "show" | "release" | "anniversary" | "event" | "etc";
type Tab = "calendar" | "details" | "publish";
type ScheduleRow = {
  id: string;
  event_date: string;
  start_time: string | null;
  category: Category;
  title_ko: string;
  title_en: string | null;
  title_ja: string | null;
  description_ko: string | null;
  description_en: string | null;
  description_ja: string | null;
  location: string | null;
  link_url: string | null;
  is_published: boolean;
  sort_order: number;
};
type Draft = {
  id: string;
  eventDate: string;
  startTime: string;
  category: Category;
  titleKo: string;
  titleEn: string;
  titleJa: string;
  descriptionKo: string;
  descriptionEn: string;
  descriptionJa: string;
  location: string;
  linkUrl: string;
  isPublished: boolean;
  sortOrder: number;
};

const CATEGORY: Record<Category, { label: string; icon: IconType; color: string }> = {
  show: { label: "방송 / 공연", icon: LuRadio, color: SCHEDULE_CATEGORY_COLORS.show },
  release: { label: "발매", icon: LuDisc3, color: SCHEDULE_CATEGORY_COLORS.release },
  anniversary: { label: "기념일", icon: LuCake, color: SCHEDULE_CATEGORY_COLORS.anniversary },
  event: { label: "이벤트", icon: LuPartyPopper, color: SCHEDULE_CATEGORY_COLORS.event },
  etc: { label: "기타", icon: LuCalendarPlus, color: SCHEDULE_CATEGORY_COLORS.etc },
};
const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
const tabs: WorkbenchTab<Tab>[] = [
  { id: "calendar", label: "월간 달력" },
  { id: "details", label: "일정 정보" },
  { id: "publish", label: "공개 설정" },
];
const toDateKey = (date: Date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("-");
const today = () => toDateKey(new Date());
const monthFromDateKey = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
};
const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const emptyDraft = (eventDate = today()): Draft => ({ id: "", eventDate, startTime: "", category: "event", titleKo: "", titleEn: "", titleJa: "", descriptionKo: "", descriptionEn: "", descriptionJa: "", location: "", linkUrl: "", isPublished: false, sortOrder: 0 });
const toDraft = (row: ScheduleRow): Draft => ({ id: row.id, eventDate: row.event_date, startTime: row.start_time?.slice(0, 5) || "", category: row.category, titleKo: row.title_ko, titleEn: row.title_en || "", titleJa: row.title_ja || "", descriptionKo: row.description_ko || "", descriptionEn: row.description_en || "", descriptionJa: row.description_ja || "", location: row.location || "", linkUrl: row.link_url || "", isPublished: row.is_published, sortOrder: row.sort_order });

export default function ArtistScheduleAdminPage() {
  const artistId = useParams<{ id: string }>()?.id;
  const [artistName, setArtistName] = useState("");
  const [items, setItems] = useState<ScheduleRow[]>([]);
  const [tab, setTab] = useState<Tab>("calendar");
  const [calendarMonth, setCalendarMonth] = useState(() => monthFromDateKey(today()));

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
  } = useAdminCrud<Draft>({ initialDraft: null });
  const currentMonthKey = monthKey(calendarMonth);
  const calendarTitle = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(calendarMonth);
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
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
    items.forEach((item) => grouped.set(item.event_date, [...(grouped.get(item.event_date) ?? []), item]));
    return grouped;
  }, [items]);
  const monthItems = useMemo(() => items
    .filter((item) => item.event_date.startsWith(currentMonthKey))
    .sort((a, b) => a.event_date.localeCompare(b.event_date) || (a.start_time || "").localeCompare(b.start_time || "")), [currentMonthKey, items]);

  const loadItems = useCallback(async (selectId?: string) => {
    if (!artistId) return;
    const [artistResult, scheduleResult] = await Promise.all([
      supabase.from("artists").select("name").eq("id", artistId).single(),
      supabase.from("artist_schedules").select("*").eq("artist_id", artistId).order("event_date", { ascending: false }).order("start_time", { ascending: true, nullsFirst: true }),
    ]);
    if (artistResult.data) setArtistName(artistResult.data.name);
    if (scheduleResult.error) {
      setError(scheduleResult.error.message.includes("artist_schedules") ? "일정 테이블이 없습니다. 018_artist_schedules.sql을 먼저 적용하세요." : scheduleResult.error.message);
    } else {
      const next = (scheduleResult.data ?? []) as ScheduleRow[];
      setItems(next);
      if (selectId) {
        const selected = next.find((item) => item.id === selectId);
        if (selected) { const nextDraft = toDraft(selected); setDraft(nextDraft); setSnapshot(JSON.stringify(nextDraft)); }
      }
    }
    setLoading(false);
  }, [artistId]);

  useEffect(() => { void Promise.resolve().then(() => loadItems()); }, [loadItems]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const patch = (value: Partial<Draft>) => setDraft((current) => current ? { ...current, ...value } : current);
  const add = (eventDate = today()) => { const next = emptyDraft(eventDate); setDraft(next); setSnapshot(JSON.stringify(next)); setCalendarMonth(monthFromDateKey(eventDate)); setTab("details"); setError(""); };
  const select = (item: ScheduleRow) => { const next = toDraft(item); setDraft(next); setSnapshot(JSON.stringify(next)); setCalendarMonth(monthFromDateKey(item.event_date)); setTab("details"); setError(""); };
  const moveMonth = (offset: number) => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  const showToday = () => setCalendarMonth(monthFromDateKey(today()));
  const validation = useMemo(() => {
    if (!draft) return "";
    if (!draft.eventDate) return "날짜를 입력하세요.";
    if (!draft.titleKo.trim()) return "한국어 일정명을 입력하세요.";
    if (draft.linkUrl && !/^https?:\/\//i.test(draft.linkUrl)) return "연결 링크는 http:// 또는 https://로 시작해야 합니다.";
    return "";
  }, [draft]);

  const save = async () => {
    if (!draft || !artistId) return;
    if (validation) {
      if (!draft.eventDate || !draft.titleKo.trim()) setTab("details");
      setError(validation);
      return;
    }
    setSaving(true); setError("");
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
      link_url: draft.linkUrl.trim() || null,
      is_published: draft.isPublished,
      sort_order: draft.sortOrder,
    };
    const result = draft.id
      ? await supabase.from("artist_schedules").update(payload).eq("id", draft.id).select("id").single()
      : await supabase.from("artist_schedules").insert(payload).select("id").single();
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    setToast(draft.id ? "일정 변경사항을 저장했습니다." : "새 일정을 추가했습니다.");
    await loadItems(result.data.id);
  };

  const remove = async () => {
    if (!draft?.id) return;
    setDeleting(true);
    const result = await supabase.from("artist_schedules").delete().eq("id", draft.id);
    setDeleting(false);
    setDeleteOpen(false);
    if (result.error) { setError(result.error.message); return; }
    setDraft(null); setSnapshot(""); setTab("calendar"); setToast("일정을 삭제했습니다."); await loadItems();
  };

  if (loading) return <LoadingIndicator label="일정 관리 화면을 불러오는 중…" className="min-h-[420px] bg-[var(--bg-card)]" />;

  const rail = <>
    <div className="content-rail-heading"><div><h2>일정 캘린더</h2></div><button type="button" onClick={() => add()} aria-label="일정 추가"><LuPlus aria-hidden="true" /></button></div>
    <div className="content-rail-sort"><span>{calendarTitle} · {monthItems.length}개</span><small>{artistName}</small></div>
    <div className="content-library-list">
      {draft && !draft.id && <button type="button" className={`content-library-item is-selected ${styles.railItem}`}><span className={styles.railDate}><b>NEW</b><small>DATE</small></span><span className="content-library-copy"><b>{draft.titleKo || "새 일정"}</b><small>{draft.eventDate}</small></span><i className="content-library-dot" /></button>}
      {monthItems.map((item) => { const date = new Date(`${item.event_date}T00:00:00`); return <button key={item.id} type="button" onClick={() => select(item)} className={`content-library-item ${draft?.id === item.id ? "is-selected" : ""} ${styles.railItem}`}><span className={styles.railDate}><b>{String(date.getDate()).padStart(2, "0")}</b><small>{date.toLocaleString("en", { month: "short" }).toUpperCase()}</small></span><span className="content-library-copy"><b>{item.title_ko}</b><small>{CATEGORY[item.category].label}{item.start_time ? ` · ${item.start_time.slice(0, 5)}` : ""}</small></span><i className={`content-library-dot ${item.is_published ? "is-live" : ""}`} /></button>; })}
      {!monthItems.length && !(draft && !draft.id) && <div className="content-library-empty"><b>이 달의 일정이 없습니다.</b><span>달력에서 날짜를 골라 새 일정을 추가하세요.</span></div>}
    </div>
  </>;
  const identity = draft ? <><span className={styles.dateArt}><b>{draft.eventDate ? draft.eventDate.slice(8, 10) : "--"}</b><small>{draft.eventDate ? draft.eventDate.slice(5, 7) : "DATE"}</small></span><div className="content-identity-copy"><p><span className={`cms-status ${draft.isPublished ? "is-live" : ""}`}>{draft.isPublished ? "공개" : "비공개"}</span>{dirty && <em>저장하지 않은 변경사항</em>}</p><h2>{draft.titleKo || "이름 없는 일정"}</h2></div></> : <div className="content-identity-copy"><p><span className="cms-status">선택 안 됨</span></p><h2>일정을 선택하세요</h2><small>{artistName}</small></div>;
  const actions = draft ? <>{draft.id && <button type="button" className="content-delete-action" onClick={() => setDeleteOpen(true)}>삭제</button>}<button type="button" className="admin-btn admin-btn-primary" disabled={!dirty || saving} onClick={() => void save()}>{saving ? "저장 중…" : "변경사항 저장"}</button></> : <button type="button" className="admin-btn admin-btn-primary" onClick={() => add()}>일정 추가</button>;

  return <>
    <ContentWorkbench rail={rail} identity={identity} actions={actions} tabs={tabs} activeTab={tab} onTabChange={setTab} error={error} onDismissError={() => setError("")} toast={toast} className="schedule-workbench">
      {tab === "calendar" ? <section className={styles.calendarView} aria-label={`${calendarTitle} 일정 달력`}>
        <header className={styles.calendarToolbar}>
          <div className={styles.calendarHeading}>
            <span><LuCalendarDays aria-hidden="true" /></span>
            <div><small>{artistName} SCHEDULE</small><h3>{calendarTitle}</h3></div>
          </div>
          <div className={styles.calendarControls}>
            <button type="button" className={styles.todayButton} onClick={showToday}>오늘</button>
            <div className={styles.monthButtons}>
              <button type="button" onClick={() => moveMonth(-1)} aria-label="이전 달"><LuChevronLeft aria-hidden="true" /></button>
              <button type="button" onClick={() => moveMonth(1)} aria-label="다음 달"><LuChevronRight aria-hidden="true" /></button>
            </div>
            <button type="button" className={styles.addScheduleButton} onClick={() => add()}><LuPlus aria-hidden="true" /> 일정 추가</button>
          </div>
        </header>
        <div className={styles.calendarViewport}>
          <div className={styles.calendar} role="grid" aria-label={calendarTitle}>
            <div className={styles.weekdays} role="row">
              {WEEKDAYS.map((weekday, index) => <span key={weekday} className={index > 4 ? styles.weekend : ""} role="columnheader">{weekday}</span>)}
            </div>
            <div className={styles.calendarGrid}>
              {calendarDays.map((date, index) => {
                const dateKey = toDateKey(date);
                const dateItems = eventsByDate.get(dateKey) ?? [];
                const isCurrentMonth = monthKey(date) === currentMonthKey;
                const isToday = dateKey === today();
                const isSelected = draft?.eventDate === dateKey;
                return <div
                  key={dateKey}
                  role="gridcell"
                  className={`${styles.dayCell} ${!isCurrentMonth ? styles.otherMonth : ""} ${isToday ? styles.today : ""} ${isSelected ? styles.selectedDay : ""}`}
                >
                  <div className={styles.dayHeader}>
                    <button type="button" className={index % 7 > 4 ? styles.weekend : ""} onClick={() => add(dateKey)} aria-label={`${dateKey}에 일정 추가`}>{date.getDate()}</button>
                    <button type="button" className={styles.dayAdd} onClick={() => add(dateKey)} aria-label={`${dateKey}에 일정 추가`}><LuPlus aria-hidden="true" /></button>
                  </div>
                  <div className={styles.dayEvents}>
                    {dateItems.slice(0, 3).map((item) => <button
                      key={item.id}
                      type="button"
                      className={`${styles.eventChip} ${!item.is_published ? styles.draftEvent : ""}`}
                      style={{ "--event-color": CATEGORY[item.category].color } as CSSProperties}
                      onClick={() => select(item)}
                      title={item.title_ko}
                    >
                      <i aria-hidden="true" />
                      {item.start_time && <time>{item.start_time.slice(0, 5)}</time>}
                      <span>{item.title_ko}</span>
                    </button>)}
                    {dateItems.length > 3 && <span className={styles.moreEvents}>+{dateItems.length - 3}개 일정</span>}
                  </div>
                </div>;
              })}
            </div>
          </div>
        </div>
        <footer className={styles.calendarFooter}>
          <div className={styles.legend}>{(Object.keys(CATEGORY) as Category[]).map((key) => <span key={key} style={{ "--legend-color": CATEGORY[key].color } as CSSProperties}><i />{CATEGORY[key].label}</span>)}</div>
          <p><span><LuClock3 aria-hidden="true" /> 시간</span><span><LuMapPin aria-hidden="true" /> 장소는 일정 편집에서 관리</span></p>
        </footer>
      </section> : !draft ? <div className="content-no-selection"><span><LuCalendarDays aria-hidden="true" /></span><h2>일정을 선택하세요</h2><p>월간 달력에서 일정을 고르거나 날짜를 눌러 새 일정을 추가하세요.</p><button type="button" className="admin-btn admin-btn-primary" onClick={() => add()}>일정 추가</button></div> : <div className="content-editor-stack">
        {tab === "details" && <>
          <div className="content-section-heading"><h3>일정 기본 정보</h3><span>공개 캘린더에서 날짜순으로 표시할 일정의 핵심 정보입니다.</span></div>
          <FormField label="일정명" valueKo={draft.titleKo} valueEn={draft.titleEn} valueJa={draft.titleJa} onChangeKo={(titleKo) => patch({ titleKo })} onChangeEn={(titleEn) => patch({ titleEn })} onChangeJa={(titleJa) => patch({ titleJa })} required />
          <div className="music-field-grid two"><label className="music-field"><span>날짜 <b>*</b></span><input type="date" className="admin-input" value={draft.eventDate} onChange={(event) => patch({ eventDate: event.target.value })} /></label><label className="music-field"><span>시작 시간</span><input type="time" className="admin-input" value={draft.startTime} onChange={(event) => patch({ startTime: event.target.value })} /></label></div>
          <div className="music-field-grid two"><div className="music-field"><span>일정 유형 <b>*</b></span><CustomSelect ariaLabel="일정 유형" value={draft.category} onChange={(category) => patch({ category: category as Category })} options={(Object.keys(CATEGORY) as Category[]).map((key) => ({ value: key, label: CATEGORY[key].label }))} /></div><div className="music-field"><span>캘린더 표시</span><div className={styles.categoryPreview} style={{ "--category-color": CATEGORY[draft.category].color } as CSSProperties}>{(() => { const CategoryIcon = CATEGORY[draft.category].icon; return <i><CategoryIcon aria-hidden="true" /></i>; })()}{CATEGORY[draft.category].label}</div></div></div>
          <div className="music-field-grid two"><label className="music-field"><span>장소</span><input className="admin-input" value={draft.location} onChange={(event) => patch({ location: event.target.value })} placeholder="예: 올림픽공원 KSPO DOME" /></label><label className="music-field"><span>연결 링크</span><input type="url" className="admin-input" value={draft.linkUrl} onChange={(event) => patch({ linkUrl: event.target.value })} placeholder="https://" /></label></div>
          <div className={styles.sectionDivider} />
          <div className="content-section-heading"><h3>일정 설명</h3><span>언어 탭을 전환해 같은 폼에서 설명을 작성합니다. 번역이 없으면 공개 페이지에서 한국어가 대신 표시됩니다.</span></div>
          <FormField label="일정 설명" type="textarea" valueKo={draft.descriptionKo} valueEn={draft.descriptionEn} valueJa={draft.descriptionJa} onChangeKo={(descriptionKo) => patch({ descriptionKo })} onChangeEn={(descriptionEn) => patch({ descriptionEn })} onChangeJa={(descriptionJa) => patch({ descriptionJa })} />
        </>}
        {tab === "publish" && <>
          <div className="content-section-heading"><h3>공개 설정</h3><span>저장 즉시 아티스트 공개 일정 페이지에 반영할지 선택합니다.</span></div>
          <div className="content-publish-summary"><div><span>일정</span><strong>{draft.titleKo || "미입력"}</strong></div><div><span>날짜 · 시간</span><strong>{draft.eventDate || "미입력"}{draft.startTime ? ` · ${draft.startTime}` : ""}</strong></div><div><span>유형</span><strong>{CATEGORY[draft.category].label}</strong></div><div><span>장소</span><strong>{draft.location || "미설정"}</strong></div></div>
          <div className="content-choice-grid"><label className="content-choice"><input type="radio" checked={draft.isPublished} onChange={() => patch({ isPublished: true })} /><span><b>바로 공개</b><small>공개 일정 페이지와 달력에 표시합니다.</small></span></label><label className="content-choice"><input type="radio" checked={!draft.isPublished} onChange={() => patch({ isPublished: false })} /><span><b>비공개로 저장</b><small>관리자만 확인할 수 있는 상태로 보관합니다.</small></span></label></div>
        </>}
      </div>}
    </ContentWorkbench>
    {deleteOpen && draft?.id && <DeleteConfirmDialog title="일정을 삭제할까요?" description="공개 캘린더와 관리자 목록에서 일정이 제거됩니다. 이 작업은 되돌릴 수 없습니다." confirmValue={draft.titleKo} valueLabel="일정명" busy={deleting} onCancel={() => setDeleteOpen(false)} onConfirm={() => void remove()} />}
  </>;
}
