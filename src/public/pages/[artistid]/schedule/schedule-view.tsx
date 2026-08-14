import { SCHEDULE_CATEGORY_COLORS } from "@/core/utils/design-tokens";
import type { CSSProperties } from "react";
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
import { safeHref } from "@/core/http/safe-href";
import type { PublicMessages } from "@/core/i18n/public-messages";
import styles from "@/styles/(public)/pages/artist-schedule.module.css";
import type { Category, ScheduleRow } from "./schedule-types";
import { dateAtLocalMidnight, daysUntil } from "./schedule-utils";

const CATEGORIES: Record<Category, { icon: IconType; color: string }> = {
  show: { icon: Radio, color: SCHEDULE_CATEGORY_COLORS.show },
  release: { icon: Disc3, color: SCHEDULE_CATEGORY_COLORS.release },
  anniversary: { icon: Cake, color: SCHEDULE_CATEGORY_COLORS.anniversary },
  event: { icon: PartyPopper, color: SCHEDULE_CATEGORY_COLORS.event },
  etc: { icon: CalendarPlus, color: SCHEDULE_CATEGORY_COLORS.etc },
};

type ScheduleTranslations = PublicMessages["schedule"];
type ScheduleTextField = "title" | "description";

type ScheduleListProps = {
  error: string;
  visibleEvents: ScheduleRow[];
  selectedDate: string | null;
  today: Date;
  weekdays: string[];
  categoryFilters: Category[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  onToggleCategory: (category: Category) => void;
  localize: (event: ScheduleRow, field: ScheduleTextField) => string;
  localizeLocation: (event: ScheduleRow) => string;
  t: ScheduleTranslations;
  page: number;
  totalPages: number;
  hasMultiplePages: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export function ScheduleList({
  error,
  visibleEvents,
  selectedDate,
  today,
  weekdays,
  categoryFilters,
  selectedEventId,
  onSelectEvent,
  onToggleCategory,
  localize,
  localizeLocation,
  t,
  page,
  totalPages,
  hasMultiplePages,
  onPreviousPage,
  onNextPage,
}: ScheduleListProps) {
  return (
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
          const remaining = daysUntil(event.event_date, today);
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
                onClick={() => onSelectEvent(event.id)}
                aria-expanded={isSelected}
              >
                <div className={styles.eventDate}>
                  <strong>{date.getDate()}</strong>
                  <span>{weekdays[date.getDay()]}</span>
                </div>
                <p className={styles.eventTitle}>{localize(event, "title")}</p>
              </button>
              <div className={styles.eventMeta}>
                <button
                  type="button"
                  className={styles.eventType}
                  aria-pressed={categoryFilters.includes(event.category)}
                  onClick={() => onToggleCategory(event.category)}
                >
                  <i>
                    <CategoryIcon aria-hidden="true" />
                  </i>
                  {t.categories[event.category] ?? t.categories.etc}
                </button>
                {remaining >= 0 && (
                  <span className={styles.eventCountdown}>
                    {remaining ? `D-${remaining}` : "D-DAY"}
                  </span>
                )}
                {event.start_time && <b>{event.start_time.slice(0, 5)}</b>}
                {localizeLocation(event) && <b>{localizeLocation(event)}</b>}
              </div>
              {isSelected && (
                <div className={styles.eventDetail}>
                  {localize(event, "description") && (
                    <p>{localize(event, "description")}</p>
                  )}
                  {href && (
                    <a href={href} target="_blank" rel="noreferrer">
                      {t.categories[event.category] ?? t.categories.etc} {"→"}
                    </a>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {!visibleEvents.length && !error && (
          <div className={styles.empty}>{t.empty}</div>
        )}
      </div>
      {hasMultiplePages && (
        <div className={styles.pager} aria-label={t.pageLabel}>
          <button
            type="button"
            onClick={onPreviousPage}
            disabled={page === 0}
            aria-label={t.previous}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={onNextPage}
            disabled={page >= totalPages - 1}
            aria-label={t.next}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}

type ScheduleCalendarProps = {
  cursor: Date;
  today: Date;
  months: string[];
  weekdays: string[];
  calendarCells: Array<number | null>;
  monthEvents: ScheduleRow[];
  categoryFilters: Category[];
  selectedDate: string | null;
  onChangeCursor: (nextCursor: Date) => void;
  onGoToday: () => void;
  onToggleCategory: (category: Category) => void;
  onSelectDate: (date: string) => void;
  t: ScheduleTranslations;
};

export function ScheduleCalendar({
  cursor,
  today,
  months,
  weekdays,
  calendarCells,
  monthEvents,
  categoryFilters,
  selectedDate,
  onChangeCursor,
  onGoToday,
  onToggleCategory,
  onSelectDate,
  t,
}: ScheduleCalendarProps) {
  return (
    <section
      className={styles.calendarPanel}
      aria-label={t.calendarLabel(cursor.getFullYear(), cursor.getMonth() + 1)}
    >
      <div className={styles.calendarTop}>
        <div className={styles.yearControl}>
          <button
            type="button"
            onClick={() =>
              onChangeCursor(
                new Date(cursor.getFullYear() - 1, cursor.getMonth(), 1),
              )
            }
            aria-label={t.previousYear}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <strong>{cursor.getFullYear()}</strong>
          <button
            type="button"
            onClick={() =>
              onChangeCursor(
                new Date(cursor.getFullYear() + 1, cursor.getMonth(), 1),
              )
            }
            aria-label={t.nextYear}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
        <button
          className={styles.todayButton}
          type="button"
          onClick={onGoToday}
        >
          {t.today}
        </button>
      </div>
      <nav className={styles.months} aria-label={t.monthSelect}>
        {months.map((month, index) => (
          <button
            key={`${month}-${index}`}
            type="button"
            aria-current={cursor.getMonth() === index}
            onClick={() =>
              onChangeCursor(new Date(cursor.getFullYear(), index, 1))
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
          if (!day) return <span key={`empty-${index}`} aria-hidden="true" />;
          const dayEvents = monthEvents
            .filter(
              (event) =>
                dateAtLocalMidnight(event.event_date).getDate() === day,
            )
            .filter(
              (event) =>
                !categoryFilters.length ||
                categoryFilters.includes(event.category),
            );
          const dateKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSelectedDate = selectedDate === dateKey;
          const isPastDate = daysUntil(dateKey, today) < 0;
          const isToday =
            day === today.getDate() &&
            cursor.getMonth() === today.getMonth() &&
            cursor.getFullYear() === today.getFullYear();
          return (
            <button
              key={day}
              type="button"
              className={`${styles.day} ${index % 7 === 0 ? styles.sunday : ""} ${dayEvents.length ? styles.hasEvents : ""} ${isPastDate ? styles.pastDate : ""} ${isSelectedDate ? styles.selectedDate : ""} ${isToday ? styles.isToday : ""}`}
              disabled={!dayEvents.length}
              aria-pressed={isSelectedDate}
              aria-label={t.dayLabel(
                cursor.getMonth() + 1,
                day,
                dayEvents.length,
              )}
              onClick={() => onSelectDate(dateKey)}
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
      <div className={styles.legend} aria-label={t.eventTypes}>
        {(Object.keys(CATEGORIES) as Category[]).map((key) => {
          const CategoryIcon = CATEGORIES[key].icon;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={categoryFilters.includes(key)}
              onClick={() => onToggleCategory(key)}
              style={
                { "--event-color": CATEGORIES[key].color } as CSSProperties
              }
            >
              <i>
                <CategoryIcon aria-hidden="true" />
              </i>
              {t.categories[key]}
            </button>
          );
        })}
      </div>
    </section>
  );
}
