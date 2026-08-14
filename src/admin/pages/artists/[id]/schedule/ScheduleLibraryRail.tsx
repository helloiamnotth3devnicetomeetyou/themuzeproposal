import { Plus } from "lucide-react";
import styles from "@/styles/(admin)/pages/artist-schedule/schedule-admin.module.css";
import {
  CATEGORY,
  type ScheduleDraft,
  type ScheduleRow,
} from "./schedule-editor-model";

interface ScheduleLibraryRailProps {
  artistName: string;
  calendarTitle: string;
  monthItems: ScheduleRow[];
  draft: ScheduleDraft | null;
  onAdd: () => void;
  onSelect: (item: ScheduleRow) => void;
}

export default function ScheduleLibraryRail({
  artistName,
  calendarTitle,
  monthItems,
  draft,
  onAdd,
  onSelect,
}: ScheduleLibraryRailProps) {
  return (
    <>
      <div className="content-rail-heading" data-tour-id="schedule-add">
        <div>
          <h2>일정 캘린더</h2>
        </div>
        <button type="button" onClick={onAdd} aria-label="일정 추가">
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
              onClick={() => onSelect(item)}
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
}
