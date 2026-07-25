"use client";

import { SCHEDULE_CATEGORY_COLORS } from "@/core/utils/design-tokens";

import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams } from "next/navigation";
import type { IconType } from "react-icons";
import { LuCake, LuCalendarPlus, LuChevronLeft, LuChevronRight, LuDisc3, LuPartyPopper, LuRadio } from "react-icons/lu";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { useLocale } from "@/core/providers/LocaleContext";
import { usePreviewPayload } from "@/core/preview/PreviewProvider";
import { supabase } from "@/core/supabase/client";
import styles from "@/styles/(public)/pages/artist-schedule.module.css";

type Category = "show" | "release" | "anniversary" | "event" | "etc";
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
};

const CATEGORIES: Record<Category, { label: string; icon: IconType; color: string }> = {
  show: { label: "Show", icon: LuRadio, color: SCHEDULE_CATEGORY_COLORS.show },
  release: { label: "Release", icon: LuDisc3, color: SCHEDULE_CATEGORY_COLORS.release },
  anniversary: { label: "Anniversary", icon: LuCake, color: SCHEDULE_CATEGORY_COLORS.anniversary },
  event: { label: "Event", icon: LuPartyPopper, color: SCHEDULE_CATEGORY_COLORS.event },
  etc: { label: "ETC", icon: LuCalendarPlus, color: SCHEDULE_CATEGORY_COLORS.etc },
};
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const PAGE_SIZE = 5;
const dateAtLocalMidnight = (value: string) => new Date(`${value}T00:00:00`);

export default function ArtistSchedulePage() {
  const { artistid } = useParams<{ artistid: string }>();
  const { locale } = useLocale();
  const preview = usePreviewPayload("schedule");
  const previewArtistId = preview?.artist.id;
  const previewArtistColor = preview?.artist.color;

  const now = new Date();
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [artistColor, setArtistColor] = useState(BRAND_PINK_HEX);
  const [events, setEvents] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const artistResult = previewArtistId
        ? { data: { id: previewArtistId, color: previewArtistColor }, error: null }
        : await supabase.from("artists").select("id,color").eq("slug", artistid).maybeSingle();
      if (cancelled) return;
      if (artistResult.error || !artistResult.data) {
        setError("아티스트 정보를 찾을 수 없습니다.");
        setLoading(false);
        return;
      }
      setArtistColor(artistResult.data.color || BRAND_PINK_HEX);
      const result = await supabase
        .from("artist_schedules")
        .select("id,event_date,start_time,category,title_ko,title_en,title_ja,description_ko,description_en,description_ja,location,link_url")
        .eq("artist_id", artistResult.data.id)
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true, nullsFirst: true })
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      if (result.error) setError(result.error.message.includes("artist_schedules") ? "일정 테이블이 준비되지 않았습니다. 018_artist_schedules.sql을 적용해 주세요." : "일정을 불러오지 못했습니다.");
      else setEvents((result.data ?? []) as ScheduleRow[]);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [artistid, previewArtistColor, previewArtistId]);

  const effectiveEvents = useMemo(() => {
    if (!preview) return events;
    const override = preview.schedule as ScheduleRow;
    const exists = events.some((item) => item.id === override.id);
    return exists
      ? events.map((item) => item.id === override.id ? override : item)
      : [...events, override];
  }, [events, preview]);

  useEffect(() => {
    if (!preview) return;
    const timer = window.setTimeout(() => {
      setArtistColor(preview.artist.color || BRAND_PINK_HEX);
      setCursor(dateAtLocalMidnight(preview.schedule.event_date));
      setPage(0);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [preview]);

  const monthEvents = useMemo(() => effectiveEvents.filter((item) => {
    const date = dateAtLocalMidnight(item.event_date);
    return date.getFullYear() === cursor.getFullYear() && date.getMonth() === cursor.getMonth();
  }), [cursor, effectiveEvents]);
  const totalPages = Math.max(1, Math.ceil(monthEvents.length / PAGE_SIZE));
  const visibleEvents = monthEvents.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const firstWeekday = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const calendarCells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) => index < firstWeekday ? null : index - firstWeekday + 1);

  const localized = (event: ScheduleRow, field: "title" | "description") => {
    const preferred = event[`${field}_${locale}` as keyof ScheduleRow];
    const english = event[`${field}_en` as keyof ScheduleRow];
    const korean = event[`${field}_ko` as keyof ScheduleRow];
    return String(preferred || english || korean || "");
  };
  const changeCursor = (nextCursor: Date) => {
    setCursor(nextCursor);
    setPage(0);
  };
  const moveYear = (amount: number) => changeCursor(new Date(cursor.getFullYear() + amount, cursor.getMonth(), 1));
  const goToday = () => changeCursor(new Date(now.getFullYear(), now.getMonth(), 1));
  const eventsOnDay = (day: number) => monthEvents.filter((event) => dateAtLocalMidnight(event.event_date).getDate() === day);

  if (loading) return <main className={styles.page}><LoadingIndicator label="아티스트 일정을 불러오는 중…" /></main>;

  return (
    <main className={styles.page} style={{ "--artist-color": artistColor } as CSSProperties}>
      <div className={styles.layout}>
        <section className={styles.listPanel} aria-labelledby="schedule-title">
          <h1 id="schedule-title" className={styles.heading}>SCHEDULE</h1>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.list} aria-live="polite">
            {visibleEvents.map((event) => {
              const date = dateAtLocalMidnight(event.event_date);
              const category = CATEGORIES[event.category] || CATEGORIES.etc;
              const CategoryIcon = category.icon;
              const content = <>
                <div className={styles.eventDate}><strong>{date.getDate()}</strong><span>{WEEKDAYS[date.getDay()]}</span></div>
                <div>
                  <p className={styles.eventTitle}>{localized(event, "title")}</p>
                  <div className={styles.eventMeta}>
                    <span className={styles.eventType}><i><CategoryIcon aria-hidden="true" /></i>{category.label}</span>
                    {event.start_time && <b>{event.start_time.slice(0, 5)}</b>}
                    {event.location && <b>{event.location}</b>}
                  </div>
                </div>
              </>;
              const eventStyle = { "--event-color": category.color } as CSSProperties;
              return event.link_url
                ? <a key={event.id} className={styles.event} style={eventStyle} href={event.link_url} target="_blank" rel="noreferrer">{content}</a>
                : <article key={event.id} className={styles.event} style={eventStyle}>{content}</article>;
            })}
            {!visibleEvents.length && !error && <div className={styles.empty}>이 달에 공개된 일정이 없습니다.</div>}
          </div>
          {monthEvents.length > PAGE_SIZE && <div className={styles.pager} aria-label="일정 페이지">
            <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0} aria-label="이전 일정"><LuChevronLeft aria-hidden="true" /></button>
            <span>{page + 1} / {totalPages}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} disabled={page >= totalPages - 1} aria-label="다음 일정"><LuChevronRight aria-hidden="true" /></button>
          </div>}
        </section>

        <section className={styles.calendarPanel} aria-label={`${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월 일정 달력`}>
          <div className={styles.calendarTop}>
            <div className={styles.yearControl}>
              <button type="button" onClick={() => moveYear(-1)} aria-label="이전 해"><LuChevronLeft aria-hidden="true" /></button>
              <strong>{cursor.getFullYear()}</strong>
              <button type="button" onClick={() => moveYear(1)} aria-label="다음 해"><LuChevronRight aria-hidden="true" /></button>
            </div>
            <button className={styles.todayButton} type="button" onClick={goToday}>TODAY</button>
          </div>
          <nav className={styles.months} aria-label="월 선택">
            {MONTHS.map((month, index) => <button key={month} type="button" aria-current={cursor.getMonth() === index} onClick={() => changeCursor(new Date(cursor.getFullYear(), index, 1))}>{month}</button>)}
          </nav>
          <div className={styles.weekdays}>{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
          <div className={styles.days}>
            {calendarCells.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} aria-hidden="true" />;
              const dayEvents = eventsOnDay(day);
              const isToday = day === now.getDate() && cursor.getMonth() === now.getMonth() && cursor.getFullYear() === now.getFullYear();
              return <button key={day} type="button" className={`${styles.day} ${index % 7 === 0 ? styles.sunday : ""} ${dayEvents.length ? styles.hasEvents : ""} ${isToday ? styles.isToday : ""}`} disabled={!dayEvents.length} aria-label={`${cursor.getMonth() + 1}월 ${day}일, 일정 ${dayEvents.length}개`} onClick={() => {
                const target = monthEvents.findIndex((event) => dateAtLocalMidnight(event.event_date).getDate() === day);
                if (target >= 0) setPage(Math.floor(target / PAGE_SIZE));
              }}>
                <span className={styles.dayNumber}>{day}</span>
                {!!dayEvents.length && <span className={styles.dots}>{[...new Set(dayEvents.map((event) => event.category))].slice(0, 3).map((category) => <i key={category} style={{ "--dot-color": CATEGORIES[category].color } as CSSProperties} />)}</span>}
              </button>;
            })}
          </div>
          <div className={styles.legend} aria-label="일정 유형">{(Object.keys(CATEGORIES) as Category[]).map((key) => { const CategoryIcon = CATEGORIES[key].icon; return <span key={key} style={{ "--event-color": CATEGORIES[key].color } as CSSProperties}><i><CategoryIcon aria-hidden="true" /></i>{CATEGORIES[key].label}</span>; })}</div>
        </section>
      </div>
    </main>
  );
}
