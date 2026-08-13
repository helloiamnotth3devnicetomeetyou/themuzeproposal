import { type CSSProperties } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
} from "lucide-react";
import styles from "@/styles/(admin)/pages/artist-schedule/schedule-admin.module.css";
import {
  CATEGORY,
  WEEKDAYS,
  monthKey,
  toDateKey,
  today,
  type ScheduleDraft,
  type ScheduleRow,
  type Category,
} from "./schedule-editor-model";

type Props = {
  artistName: string;
  calendarTitle: string;
  calendarDays: Date[];
  currentMonthKey: string;
  eventsByDate: Map<string, ScheduleRow[]>;
  draft: ScheduleDraft | null;
  onAdd: (eventDate?: string) => void;
  onSelect: (item: ScheduleRow) => void;
  onMoveMonth: (offset: number) => void;
  onShowToday: () => void;
};

export default function ScheduleCalendar({
  artistName,
  calendarTitle,
  calendarDays,
  currentMonthKey,
  eventsByDate,
  draft,
  onAdd,
  onSelect,
  onMoveMonth,
  onShowToday,
}: Props) {
  return (
    <section
      className={styles.calendarView}
      aria-label={`${calendarTitle} 일정 달력`}
    >
      <header className={styles.calendarToolbar}>
        <div className={styles.calendarHeading}>
          <span>
            <CalendarDays aria-hidden="true" />
          </span>
          <div>
            <small>{artistName} SCHEDULE</small>
            <h3>{calendarTitle}</h3>
          </div>
        </div>
        <div className={styles.calendarControls}>
          <button
            type="button"
            className={styles.todayButton}
            onClick={onShowToday}
          >
            오늘
          </button>
          <div className={styles.monthButtons}>
            <button
              type="button"
              onClick={() => onMoveMonth(-1)}
              aria-label="이전 달"
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onMoveMonth(1)}
              aria-label="다음 달"
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className={styles.addScheduleButton}
            onClick={() => onAdd()}
          >
            <Plus aria-hidden="true" /> 일정 추가
          </button>
        </div>
      </header>
      <div className={styles.calendarViewport}>
        <div className={styles.calendar} role="grid" aria-label={calendarTitle}>
          <div className={styles.weekdays} role="row">
            {WEEKDAYS.map((weekday, index) => (
              <span
                key={weekday}
                className={index > 4 ? styles.weekend : ""}
                role="columnheader"
              >
                {weekday}
              </span>
            ))}
          </div>
          <div className={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              const dateKey = toDateKey(date);
              const dateItems = eventsByDate.get(dateKey) ?? [];
              const isCurrentMonth = monthKey(date) === currentMonthKey;
              const isToday = dateKey === today();
              const isSelected = draft?.eventDate === dateKey;
              return (
                <div
                  key={dateKey}
                  role="gridcell"
                  className={`${styles.dayCell} ${!isCurrentMonth ? styles.otherMonth : ""} ${isToday ? styles.today : ""} ${isSelected ? styles.selectedDay : ""}`}
                >
                  <div className={styles.dayHeader}>
                    <button
                      type="button"
                      className={index % 7 > 4 ? styles.weekend : ""}
                      onClick={() => onAdd(dateKey)}
                      aria-label={`${dateKey}에 일정 추가`}
                    >
                      {date.getDate()}
                    </button>
                    <button
                      type="button"
                      className={styles.dayAdd}
                      onClick={() => onAdd(dateKey)}
                      aria-label={`${dateKey}에 일정 추가`}
                    >
                      <Plus aria-hidden="true" />
                    </button>
                  </div>
                  <div className={styles.dayEvents}>
                    {dateItems.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`${styles.eventChip} ${!item.is_published ? styles.draftEvent : ""}`}
                        style={
                          {
                            "--event-color": CATEGORY[item.category].color,
                          } as CSSProperties
                        }
                        onClick={() => onSelect(item)}
                        title={item.title_ko}
                      >
                        <i aria-hidden="true" />
                        {item.start_time && (
                          <time>{item.start_time.slice(0, 5)}</time>
                        )}
                        <span>{item.title_ko}</span>
                      </button>
                    ))}
                    {dateItems.length > 3 && (
                      <span className={styles.moreEvents}>
                        +{dateItems.length - 3}개 일정
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <footer className={styles.calendarFooter}>
        <div className={styles.legend}>
          {(Object.keys(CATEGORY) as Category[]).map((key) => (
            <span
              key={key}
              style={{ "--legend-color": CATEGORY[key].color } as CSSProperties}
            >
              <i />
              {CATEGORY[key].label}
            </span>
          ))}
        </div>
        <p>
          <span>
            <Clock3 aria-hidden="true" /> 시간
          </span>
          <span>
            <MapPin aria-hidden="true" /> 장소는 일정 편집에서 관리
          </span>
        </p>
      </footer>
    </section>
  );
}
