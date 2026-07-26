"use client";

import { SCHEDULE_CATEGORY_COLORS } from "@/core/utils/design-tokens";

import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams } from "next/navigation";
import type { IconType } from "react-icons";
import { LuCake, LuCalendarPlus, LuChevronLeft, LuChevronRight, LuDisc3, LuPartyPopper, LuRadio } from "react-icons/lu";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { localizeText, localeTags } from "@/core/i18n/localized";
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
  location_ko: string | null;
  location_en: string | null;
  location_ja: string | null;
  link_url: string | null;
};

const CATEGORIES: Record<Category, { icon: IconType; color: string }> = {
  show: { icon: LuRadio, color: SCHEDULE_CATEGORY_COLORS.show },
  release: { icon: LuDisc3, color: SCHEDULE_CATEGORY_COLORS.release },
  anniversary: { icon: LuCake, color: SCHEDULE_CATEGORY_COLORS.anniversary },
  event: { icon: LuPartyPopper, color: SCHEDULE_CATEGORY_COLORS.event },
  etc: { icon: LuCalendarPlus, color: SCHEDULE_CATEGORY_COLORS.etc },
};
const PAGE_SIZE = 5;
const dateAtLocalMidnight = (value: string) => new Date(`${value}T00:00:00`);

export default function ArtistSchedulePage() {
  const { artistid } = useParams<{ artistid: string }>();
  const { locale, t } = useLocale();
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
        setError(t.schedule.artistNotFound);
        setLoading(false);
        return;
      }
      setArtistColor(artistResult.data.color || BRAND_PINK_HEX);
      let result = await supabase
        .from("artist_schedules")
        .select("id,event_date,start_time,category,title_ko,title_en,title_ja,description_ko,description_en,description_ja,location,location_ko,location_en,location_ja,link_url")
        .eq("artist_id", artistResult.data.id)
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true, nullsFirst: true })
        .order("sort_order", { ascending: true });
      if (result.error?.message.includes("location_ko")) {
        const legacy = await supabase
          .from("artist_schedules")
          .select("id,event_date,start_time,category,title_ko,title_en,title_ja,description_ko,description_en,description_ja,location,link_url")
          .eq("artist_id", artistResult.data.id)
          .order("event_date", { ascending: true })
          .order("start_time", { ascending: true, nullsFirst: true })
          .order("sort_order", { ascending: true });
        result = {
          ...legacy,
          data: legacy.data?.map((row) => ({ ...row, location_ko: row.location, location_en: null, location_ja: null })) ?? null,
        } as typeof result;
      }
      if (cancelled) return;
      if (result.error) setError(result.error.message.includes("artist_schedules") ? t.schedule.tableMissing : t.schedule.loadError);
      else setEvents((result.data ?? []) as ScheduleRow[]);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [artistid, previewArtistColor, previewArtistId, t.schedule]);

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

  const localized = (event: ScheduleRow, field: "title" | "description") => localizeText({
    ko: event[`${field}_ko`],
    en: event[`${field}_en`],
    ja: event[`${field}_ja`],
  }, locale);
  const localizedLocation = (event: ScheduleRow) => localizeText({
    ko: event.location_ko,
    en: event.location_en,
    ja: event.location_ja,
  }, locale, event.location ?? "");
  const months = useMemo(() => Array.from({ length: 12 }, (_, month) =>
    new Intl.DateTimeFormat(localeTags[locale], { month: "short" }).format(new Date(2026, month, 1)).replace(".", "").toUpperCase()
  ), [locale]);
  const weekdays = useMemo(() => Array.from({ length: 7 }, (_, day) =>
    new Intl.DateTimeFormat(localeTags[locale], { weekday: "short" }).format(new Date(2026, 0, 4 + day)).replace(".", "").toUpperCase()
  ), [locale]);
  const changeCursor = (nextCursor: Date) => {
    setCursor(nextCursor);
    setPage(0);
  };
  const moveYear = (amount: number) => changeCursor(new Date(cursor.getFullYear() + amount, cursor.getMonth(), 1));
  const goToday = () => changeCursor(new Date(now.getFullYear(), now.getMonth(), 1));
  const eventsOnDay = (day: number) => monthEvents.filter((event) => dateAtLocalMidnight(event.event_date).getDate() === day);

  if (loading) return <main className={styles.page}><LoadingIndicator label={t.schedule.loading} /></main>;

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
                <div className={styles.eventDate}><strong>{date.getDate()}</strong><span>{weekdays[date.getDay()]}</span></div>
                <div>
                  <p className={styles.eventTitle}>{localized(event, "title")}</p>
                  <div className={styles.eventMeta}>
                    <span className={styles.eventType}><i><CategoryIcon aria-hidden="true" /></i>{t.schedule.categories[event.category] ?? t.schedule.categories.etc}</span>
                    {event.start_time && <b>{event.start_time.slice(0, 5)}</b>}
                    {localizedLocation(event) && <b>{localizedLocation(event)}</b>}
                  </div>
                </div>
              </>;
              const eventStyle = { "--event-color": category.color } as CSSProperties;
              return event.link_url
                ? <a key={event.id} className={styles.event} style={eventStyle} href={event.link_url} target="_blank" rel="noreferrer">{content}</a>
                : <article key={event.id} className={styles.event} style={eventStyle}>{content}</article>;
            })}
            {!visibleEvents.length && !error && <div className={styles.empty}>{t.schedule.empty}</div>}
          </div>
          {monthEvents.length > PAGE_SIZE && <div className={styles.pager} aria-label={t.schedule.pageLabel}>
            <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0} aria-label={t.schedule.previous}><LuChevronLeft aria-hidden="true" /></button>
            <span>{page + 1} / {totalPages}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} disabled={page >= totalPages - 1} aria-label={t.schedule.next}><LuChevronRight aria-hidden="true" /></button>
          </div>}
        </section>

        <section className={styles.calendarPanel} aria-label={t.schedule.calendarLabel(cursor.getFullYear(), cursor.getMonth() + 1)}>
          <div className={styles.calendarTop}>
            <div className={styles.yearControl}>
              <button type="button" onClick={() => moveYear(-1)} aria-label={t.schedule.previousYear}><LuChevronLeft aria-hidden="true" /></button>
              <strong>{cursor.getFullYear()}</strong>
              <button type="button" onClick={() => moveYear(1)} aria-label={t.schedule.nextYear}><LuChevronRight aria-hidden="true" /></button>
            </div>
            <button className={styles.todayButton} type="button" onClick={goToday}>{t.schedule.today}</button>
          </div>
          <nav className={styles.months} aria-label={t.schedule.monthSelect}>
            {months.map((month, index) => <button key={`${month}-${index}`} type="button" aria-current={cursor.getMonth() === index} onClick={() => changeCursor(new Date(cursor.getFullYear(), index, 1))}>{month}</button>)}
          </nav>
          <div className={styles.weekdays}>{weekdays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
          <div className={styles.days}>
            {calendarCells.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} aria-hidden="true" />;
              const dayEvents = eventsOnDay(day);
              const isToday = day === now.getDate() && cursor.getMonth() === now.getMonth() && cursor.getFullYear() === now.getFullYear();
              return <button key={day} type="button" className={`${styles.day} ${index % 7 === 0 ? styles.sunday : ""} ${dayEvents.length ? styles.hasEvents : ""} ${isToday ? styles.isToday : ""}`} disabled={!dayEvents.length} aria-label={t.schedule.dayLabel(cursor.getMonth() + 1, day, dayEvents.length)} onClick={() => {
                const target = monthEvents.findIndex((event) => dateAtLocalMidnight(event.event_date).getDate() === day);
                if (target >= 0) setPage(Math.floor(target / PAGE_SIZE));
              }}>
                <span className={styles.dayNumber}>{day}</span>
                {!!dayEvents.length && <span className={styles.dots}>{[...new Set(dayEvents.map((event) => event.category))].slice(0, 3).map((category) => <i key={category} style={{ "--dot-color": CATEGORIES[category].color } as CSSProperties} />)}</span>}
              </button>;
            })}
          </div>
          <div className={styles.legend} aria-label={t.schedule.eventTypes}>{(Object.keys(CATEGORIES) as Category[]).map((key) => { const CategoryIcon = CATEGORIES[key].icon; return <span key={key} style={{ "--event-color": CATEGORIES[key].color } as CSSProperties}><i><CategoryIcon aria-hidden="true" /></i>{t.schedule.categories[key]}</span>; })}</div>
        </section>
      </div>
    </main>
  );
}
