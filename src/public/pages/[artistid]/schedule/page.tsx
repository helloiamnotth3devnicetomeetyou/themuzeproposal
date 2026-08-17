"use client";

import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams } from "next/navigation";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { localizeText, localeTags } from "@/core/i18n/localized";
import { useLocale } from "@/core/providers/LocaleContext";
import { usePreviewPayload } from "@/core/preview/PreviewProvider";
import type { PublicMessages } from "@/core/i18n/public-messages";
import { supabase } from "@/core/supabase/client";
import { fetchArtistSchedule } from "@/public/features/schedule/repository";
import type {
  Category,
  PublicScheduleData,
  ScheduleFetchFailure,
  ScheduleRow,
} from "@/public/features/schedule/types";
import { ScheduleCalendar, ScheduleList } from "./schedule-view";
import { dateAtLocalMidnight } from "@/public/features/schedule/date";
import styles from "@/styles/(public)/pages/artist-schedule.module.css";

export { daysUntil } from "@/public/features/schedule/date";

const PAGE_SIZE = 5;

function failureCopy(
  failure: ScheduleFetchFailure,
  t: PublicMessages["schedule"],
) {
  if (failure === "table-missing") return t.tableMissing;
  if (failure === "failed") return t.loadError;
  return t.artistNotFound;
}

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

  const [today, setToday] = useState(() => {
    const current = new Date();
    return new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate(),
    );
  });
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
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
    let timer: number | undefined;
    const updateToday = () => {
      const current = new Date();
      setToday(
        new Date(current.getFullYear(), current.getMonth(), current.getDate()),
      );
      const nextMidnight = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate() + 1,
      );
      timer = window.setTimeout(
        updateToday,
        Math.max(1, nextMidnight.getTime() - current.getTime() + 1),
      );
    };
    updateToday();
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      if (!previewArtistId && initialData) {
        setArtistColor(initialData.artistColor || BRAND_PINK_HEX);
        setEvents(initialData.events);
        setPage(0);
        setSelectedDate(null);
        setSelectedEventId(null);
        setLoading(false);
        return;
      }
      if (previewArtistId) {
        setArtistColor(previewArtistColor || BRAND_PINK_HEX);
        setLoading(false);
        return;
      }
      const result = await fetchArtistSchedule(supabase, artistid);
      if (cancelled) return;
      if (result.failure) setError(failureCopy(result.failure, t.schedule));
      else {
        setArtistColor(result.data.artistColor || BRAND_PINK_HEX);
        setEvents(result.data.events);
      }
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
  const goToday = () =>
    changeCursor(new Date(today.getFullYear(), today.getMonth(), 1));
  const selectEvent = (id: string) =>
    setSelectedEventId((current) => (current === id ? null : id));
  const selectDate = (dateKey: string) => {
    setSelectedDate((current) => (current === dateKey ? null : dateKey));
    setPage(0);
    setSelectedEventId(null);
  };

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
        <ScheduleList
          error={error}
          visibleEvents={visibleEvents}
          selectedDate={selectedDate}
          today={today}
          weekdays={weekdays}
          categoryFilters={categoryFilters}
          selectedEventId={selectedEventId}
          onSelectEvent={selectEvent}
          onToggleCategory={toggleCategory}
          localize={localized}
          localizeLocation={localizedLocation}
          t={t.schedule}
          page={page}
          totalPages={totalPages}
          hasMultiplePages={filteredMonthEvents.length > PAGE_SIZE}
          onPreviousPage={() => setPage((value) => Math.max(0, value - 1))}
          onNextPage={() =>
            setPage((value) => Math.min(totalPages - 1, value + 1))
          }
        />
        <ScheduleCalendar
          cursor={cursor}
          today={today}
          months={months}
          weekdays={weekdays}
          calendarCells={calendarCells}
          monthEvents={monthEvents}
          categoryFilters={categoryFilters}
          selectedDate={selectedDate}
          onChangeCursor={changeCursor}
          onGoToday={goToday}
          onToggleCategory={toggleCategory}
          onSelectDate={selectDate}
          t={t.schedule}
        />
      </div>
    </main>
  );
}
