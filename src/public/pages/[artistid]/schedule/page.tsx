"use client";

import { SCHEDULE_CATEGORY_COLORS } from "@/core/utils/design-tokens";

import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams } from "next/navigation";
import type { IconType } from "react-icons";
import {
  Cake,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Disc3,
  PartyPopper,
  Radio,
} from "lucide-react";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { localizeText, localeTags } from "@/core/i18n/localized";
import { useLocale } from "@/core/providers/LocaleContext";
import { usePreviewPayload } from "@/core/preview/PreviewProvider";
import { supabase } from "@/core/supabase/client";
import { safeHref } from "@/core/http/safe-href";
import styles from "@/styles/(public)/pages/artist-schedule.module.css";
import type {
  Category,
  PublicScheduleData,
  ScheduleRow,
} from "./schedule-types";

const CATEGORIES: Record<Category, { icon: IconType; color: string }> = {
  show: { icon: Radio, color: SCHEDULE_CATEGORY_COLORS.show },
  release: { icon: Disc3, color: SCHEDULE_CATEGORY_COLORS.release },
  anniversary: { icon: Cake, color: SCHEDULE_CATEGORY_COLORS.anniversary },
  event: { icon: PartyPopper, color: SCHEDULE_CATEGORY_COLORS.event },
  etc: { icon: CalendarPlus, color: SCHEDULE_CATEGORY_COLORS.etc },
};
const PAGE_SIZE = 5;
const dateAtLocalMidnight = (value: string) => new Date(`${value}T00:00:00`);
const daysUntil = (value: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round(
    (dateAtLocalMidnight(value).getTime() - today.getTime()) / 86_400_000,
  );
};

export default function ArtistSchedulePage({
  initialData = null,
  initialLoadFailed = false,
}: {
  initialData?: PublicScheduleData | null;
  initialLoadFailed?: boolean;
}) {
  const { artistid } = useParams<{ artistid: string }>();
  const { locale, t } = useLocale();
  const preview = usePreviewPayload("schedule");
  const previewArtistId = preview?.artist.id;
  const previewArtistColor = preview?.artist.color;

  const now = new Date();
  const [cursor, setCursor] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const [artistColor, setArtistColor] = useState(
    initialData?.artistColor || BRAND_PINK_HEX,
  );
  const [events, setEvents] = useState<ScheduleRow[]>(
    initialData?.events ?? [],
  );
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(
    initialLoadFailed ? t.schedule.loadError : "",
  );
  const [page, setPage] = useState(0);
  const [categoryFilters, setCategoryFilters] = useState<Category[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const scheduleColumns =
      "id,event_date,start_time,category,title_ko,title_en,title_ja,description_ko,description_en,description_ja,location,location_ko,location_en,location_ja,link_url";
    async function load() {
      setLoading(true);
      setError("");
      if (!previewArtistId && initialData) {
        setLoading(false);
        return;
      }
      if (previewArtistId) {
        setArtistColor(previewArtistColor || BRAND_PINK_HEX);
        setLoading(false);
        return;
      }
      // Single round trip: fetch the artist with its schedules embedded,
      // instead of resolving the artist id first and querying schedules after.
      const joined = await supabase
        .from("artists")
        .select(`id,color,artist_schedules(${scheduleColumns})`)
        .eq("slug", artistid)
        .eq("is_active", true)
        .order("event_date", {
          foreignTable: "artist_schedules",
          ascending: true,
        })
        .order("start_time", {
          foreignTable: "artist_schedules",
          ascending: true,
          nullsFirst: true,
        })
        .order("sort_order", {
          foreignTable: "artist_schedules",
          ascending: true,
        })
        .maybeSingle();
      if (cancelled) return;
      if (joined.error?.message.includes("location_ko")) {
        // Legacy schema fallback: re-fetch without location_ko in the rare
        // case a target environment hasn't run that migration yet.
        const artistResult = await supabase
          .from("artists")
          .select("id,color")
          .eq("slug", artistid)
          .eq("is_active", true)
          .maybeSingle();
        if (cancelled) return;
        if (artistResult.error || !artistResult.data) {
          setError(t.schedule.artistNotFound);
          setLoading(false);
          return;
        }
        setArtistColor(artistResult.data.color || BRAND_PINK_HEX);
        const legacy = await supabase
          .from("artist_schedules")
          .select(
            "id,event_date,start_time,category,title_ko,title_en,title_ja,description_ko,description_en,description_ja,location,link_url",
          )
          .eq("artist_id", artistResult.data.id)
          .order("event_date", { ascending: true })
          .order("start_time", { ascending: true, nullsFirst: true })
          .order("sort_order", { ascending: true });
        if (cancelled) return;
        if (legacy.error)
          setError(
            legacy.error.message.includes("artist_schedules")
              ? t.schedule.tableMissing
              : t.schedule.loadError,
          );
        else
          setEvents(
            (legacy.data?.map((row) => ({
              ...row,
              location_ko: row.location,
              location_en: null,
              location_ja: null,
            })) ?? []) as ScheduleRow[],
          );
        setLoading(false);
        return;
      }
      if (joined.error) {
        setError(
          joined.error.message.includes("artist_schedules")
            ? t.schedule.tableMissing
            : t.schedule.artistNotFound,
        );
        setLoading(false);
        return;
      }
      if (!joined.data) {
        setError(t.schedule.artistNotFound);
        setLoading(false);
        return;
      }
      setArtistColor(joined.data.color || BRAND_PINK_HEX);
      setEvents(
        (joined.data.artist_schedules ?? []) as unknown as ScheduleRow[],
      );
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [artistid, initialData, previewArtistColor, previewArtistId, t.schedule]);

  const effectiveEvents = useMemo(() => {
    if (!preview) return events;
    const override = preview.schedule as ScheduleRow;
    const exists = events.some((item) => item.id === override.id);
    return exists
      ? events.map((item) => (item.id === override.id ? override : item))
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

  const monthEvents = useMemo(
    () =>
      effectiveEvents.filter((item) => {
        const date = dateAtLocalMidnight(item.event_date);
        return (
          date.getFullYear() === cursor.getFullYear() &&
          date.getMonth() === cursor.getMonth()
        );
      }),
    [cursor, effectiveEvents],
  );
  const dateEvents = useMemo(
    () =>
      selectedDate
        ? monthEvents.filter((item) => item.event_date === selectedDate)
        : monthEvents,
    [monthEvents, selectedDate],
  );
  const filteredMonthEvents = useMemo(
    () =>
      categoryFilters.length
        ? dateEvents.filter((item) => categoryFilters.includes(item.category))
        : dateEvents,
    [categoryFilters, dateEvents],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredMonthEvents.length / PAGE_SIZE),
  );
  const visibleEvents = filteredMonthEvents.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );
  const firstWeekday = new Date(
    cursor.getFullYear(),
    cursor.getMonth(),
    1,
  ).getDay();
  const daysInMonth = new Date(
    cursor.getFullYear(),
    cursor.getMonth() + 1,
    0,
  ).getDate();
  const calendarCells = Array.from(
    { length: firstWeekday + daysInMonth },
    (_, index) => (index < firstWeekday ? null : index - firstWeekday + 1),
  );

  const localized = (event: ScheduleRow, field: "title" | "description") =>
    localizeText(
      {
        ko: event[`${field}_ko`],
        en: event[`${field}_en`],
        ja: event[`${field}_ja`],
      },
      locale,
    );
  const localizedLocation = (event: ScheduleRow) =>
    localizeText(
      {
        ko: event.location_ko,
        en: event.location_en,
        ja: event.location_ja,
      },
      locale,
      event.location ?? "",
    );
  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, month) =>
        new Intl.DateTimeFormat(localeTags[locale], { month: "short" })
          .format(new Date(2026, month, 1))
          .replace(".", "")
          .toUpperCase(),
      ),
    [locale],
  );
  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, day) =>
        new Intl.DateTimeFormat(localeTags[locale], { weekday: "short" })
          .format(new Date(2026, 0, 4 + day))
          .replace(".", "")
          .toUpperCase(),
      ),
    [locale],
  );
  const changeCursor = (nextCursor: Date) => {
    setCursor(nextCursor);
    setSelectedDate(null);
    setPage(0);
  };
  const toggleCategory = (category: Category) => {
    setCategoryFilters((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
    setPage(0);
  };
  const moveYear = (amount: number) =>
    changeCursor(new Date(cursor.getFullYear() + amount, cursor.getMonth(), 1));
  const goToday = () =>
    changeCursor(new Date(now.getFullYear(), now.getMonth(), 1));
  const eventsOnDay = (day: number) =>
    monthEvents.filter(
      (event) => dateAtLocalMidnight(event.event_date).getDate() === day,
    );

  if (loading)
    return (
      <main className={styles.page}>
        <LoadingIndicator label={t.schedule.loading} />
      </main>
    );

  return (
    <main
      className={styles.page}
      style={{ "--artist-color": artistColor } as CSSProperties}
    >
      <div className={styles.layout}>
        <section className={styles.listPanel} aria-labelledby="schedule-title">
          <h1 id="schedule-title" className={styles.heading}>
            SCHEDULE
          </h1>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <div
            className={`${styles.list} ${selectedDate ? styles.listFiltered : ""}`}
            aria-live="polite"
          >
            {visibleEvents.map((event) => {
              const date = dateAtLocalMidnight(event.event_date);
              const remaining = daysUntil(event.event_date);
              const category = CATEGORIES[event.category] || CATEGORIES.etc;
              const CategoryIcon = category.icon;
              const eventStyle = {
                "--event-color": category.color,
              } as CSSProperties;
              const isPast = remaining < 0;
              const href = safeHref(event.link_url);
              const isSelected = selectedEventId === event.id;
              return (
                <article
                  key={event.id}
                  id={`schedule-event-${event.id}`}
                  className={`${styles.event} ${isPast ? styles.eventPast : ""} ${isSelected ? styles.eventSelected : ""}`}
                  style={eventStyle}
                >
                  <button
                    type="button"
                    className={styles.eventMain}
                    onClick={() =>
                      setSelectedEventId((id) =>
                        id === event.id ? null : event.id,
                      )
                    }
                    aria-expanded={isSelected}
                  >
                    <div className={styles.eventDate}>
                      <strong>{date.getDate()}</strong>
                      <span>{weekdays[date.getDay()]}</span>
                    </div>
                    <p className={styles.eventTitle}>
                      {localized(event, "title")}
                    </p>
                  </button>
                  <div className={styles.eventMeta}>
                    <button
                      type="button"
                      className={styles.eventType}
                      aria-pressed={categoryFilters.includes(event.category)}
                      onClick={() => toggleCategory(event.category)}
                    >
                      <i>
                        <CategoryIcon aria-hidden="true" />
                      </i>
                      {t.schedule.categories[event.category] ??
                        t.schedule.categories.etc}
                    </button>
                    {remaining >= 0 && (
                      <span className={styles.eventCountdown}>
                        {remaining ? `D-${remaining}` : "D-DAY"}
                      </span>
                    )}
                    {event.start_time && <b>{event.start_time.slice(0, 5)}</b>}
                    {localizedLocation(event) && (
                      <b>{localizedLocation(event)}</b>
                    )}
                  </div>
                  {isSelected && (
                    <div className={styles.eventDetail}>
                      {localized(event, "description") && (
                        <p>{localized(event, "description")}</p>
                      )}
                      {href && (
                        <a href={href} target="_blank" rel="noreferrer">
                          {t.schedule.categories[event.category] ??
                            t.schedule.categories.etc}{" "}
                          {"→"}
                        </a>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
            {!visibleEvents.length && !error && (
              <div className={styles.empty}>{t.schedule.empty}</div>
            )}
          </div>
          {filteredMonthEvents.length > PAGE_SIZE && (
            <div className={styles.pager} aria-label={t.schedule.pageLabel}>
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(0, value - 1))}
                disabled={page === 0}
                aria-label={t.schedule.previous}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <span>
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((value) => Math.min(totalPages - 1, value + 1))
                }
                disabled={page >= totalPages - 1}
                aria-label={t.schedule.next}
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          )}
        </section>

        <section
          className={styles.calendarPanel}
          aria-label={t.schedule.calendarLabel(
            cursor.getFullYear(),
            cursor.getMonth() + 1,
          )}
        >
          <div className={styles.calendarTop}>
            <div className={styles.yearControl}>
              <button
                type="button"
                onClick={() => moveYear(-1)}
                aria-label={t.schedule.previousYear}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <strong>{cursor.getFullYear()}</strong>
              <button
                type="button"
                onClick={() => moveYear(1)}
                aria-label={t.schedule.nextYear}
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
            <button
              className={styles.todayButton}
              type="button"
              onClick={goToday}
            >
              {t.schedule.today}
            </button>
          </div>
          <nav className={styles.months} aria-label={t.schedule.monthSelect}>
            {months.map((month, index) => (
              <button
                key={`${month}-${index}`}
                type="button"
                aria-current={cursor.getMonth() === index}
                onClick={() =>
                  changeCursor(new Date(cursor.getFullYear(), index, 1))
                }
              >
                {month}
              </button>
            ))}
          </nav>
          <div className={styles.weekdays}>
            {weekdays.map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>
          <div className={styles.days}>
            {calendarCells.map((day, index) => {
              if (!day)
                return <span key={`empty-${index}`} aria-hidden="true" />;
              const dayEvents = eventsOnDay(day).filter(
                (event) =>
                  !categoryFilters.length ||
                  categoryFilters.includes(event.category),
              );
              const dateKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelectedDate = selectedDate === dateKey;
              const isPastDate = daysUntil(dateKey) < 0;
              const isToday =
                day === now.getDate() &&
                cursor.getMonth() === now.getMonth() &&
                cursor.getFullYear() === now.getFullYear();
              return (
                <button
                  key={day}
                  type="button"
                  className={`${styles.day} ${index % 7 === 0 ? styles.sunday : ""} ${dayEvents.length ? styles.hasEvents : ""} ${isPastDate ? styles.pastDate : ""} ${isSelectedDate ? styles.selectedDate : ""} ${isToday ? styles.isToday : ""}`}
                  disabled={!dayEvents.length}
                  aria-pressed={isSelectedDate}
                  aria-label={t.schedule.dayLabel(
                    cursor.getMonth() + 1,
                    day,
                    dayEvents.length,
                  )}
                  onClick={() => {
                    setSelectedDate((current) =>
                      current === dateKey ? null : dateKey,
                    );
                    setPage(0);
                    setSelectedEventId(null);
                  }}
                >
                  <span className={styles.dayNumber}>{day}</span>
                  {!!dayEvents.length && (
                    <span className={styles.dots}>
                      {[...new Set(dayEvents.map((event) => event.category))]
                        .slice(0, 3)
                        .map((category) => (
                          <i
                            key={category}
                            style={
                              {
                                "--dot-color": CATEGORIES[category].color,
                              } as CSSProperties
                            }
                          />
                        ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className={styles.legend} aria-label={t.schedule.eventTypes}>
            {(Object.keys(CATEGORIES) as Category[]).map((key) => {
              const CategoryIcon = CATEGORIES[key].icon;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={categoryFilters.includes(key)}
                  onClick={() => toggleCategory(key)}
                  style={
                    { "--event-color": CATEGORIES[key].color } as CSSProperties
                  }
                >
                  <i>
                    <CategoryIcon aria-hidden="true" />
                  </i>
                  {t.schedule.categories[key]}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
