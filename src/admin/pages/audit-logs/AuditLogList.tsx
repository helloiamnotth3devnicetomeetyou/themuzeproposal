import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  History,
} from "lucide-react";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import styles from "@/styles/(admin)/pages/audit-logs/audit-logs.module.css";
import {
  operationLabel,
  fieldLabel,
  tableLabel,
  type AuditLogGroup,
  type AuditLogRow,
  type AuditOperation,
} from "./audit-log-model";

const PAGE_SIZE = 10;

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function operationClass(operation: AuditOperation) {
  if (operation === "INSERT") return styles.operationInsert;
  if (operation === "DELETE") return styles.operationDelete;
  return styles.operationUpdate;
}

function relativeTime(value: string) {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.round(hours / 24)}일 전`;
}

type Props = {
  groupedLogs: AuditLogGroup[];
  selected: AuditLogRow | null;
  page: number;
  totalPages: number;
  total: number;
  loading: boolean;
  onSelect: (log: AuditLogRow) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export default function AuditLogList({
  groupedLogs,
  selected,
  page,
  totalPages,
  total,
  loading,
  onSelect,
  onPrevious,
  onNext,
}: Props) {
  return (
    <section className={styles.logPanel} aria-label="변경 이력 목록">
      <div className={styles.panelHeading}>
        <div>
          <History aria-hidden="true" />
          <span>
            <b>변경 기록</b>
            <small>최신 작업부터 표시 · 변경 필드를 바로 확인하세요</small>
          </span>
        </div>
        <span>
          {page} / {totalPages}
        </span>
      </div>

      {loading ? (
        <AdminSkeleton variant="table" className={styles.loading} rows={5} />
      ) : groupedLogs.length ? (
        <div className={styles.eventList} role="list">
          {groupedLogs.map(({ primary: log, entries }) => (
            <button
              type="button"
              key={log.id}
              data-tour-id="audit-open"
              className={`${styles.eventCard} ${selected?.id === log.id ? styles.selectedEvent : ""}`}
              onClick={() => onSelect(log)}
              aria-label={`${log.record_label} 변경 상세 보기`}
            >
              <span className={styles.eventTime}>
                <Clock3 aria-hidden="true" />
                <b>{relativeTime(log.occurred_at)}</b>
                <small>{dateTimeFormatter.format(new Date(log.occurred_at))}</small>
              </span>
              <span className={styles.eventAction}>
                <span
                  className={`${styles.operation} ${operationClass(log.operation)}`}
                >
                  {operationLabel(log.operation)}
                </span>
                <small>{tableLabel(log.table_name)}</small>
              </span>
              <span className={styles.eventTarget}>
                <b>
                  {log.record_label}
                  {entries.length > 1 && (
                    <span className={styles.transactionCount}>
                      +{entries.length - 1}
                    </span>
                  )}
                </b>
                <small>
                  {log.changed_fields.length
                    ? log.changed_fields.slice(0, 2).map(fieldLabel).join(", ")
                    : "변경값 보호"}
                  {log.changed_fields.length > 2
                    ? ` 외 ${log.changed_fields.length - 2}`
                    : ""}
                </small>
              </span>
              <ChevronRight aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <History aria-hidden="true" />
          <b>조건에 맞는 변경 이력이 없습니다.</b>
          <span>필터를 조정하거나 감사 로그가 기록된 뒤 다시 확인해 주세요.</span>
        </div>
      )}

      <footer className={styles.pagination}>
        <span>
          {total
            ? `${((page - 1) * PAGE_SIZE + 1).toLocaleString("ko-KR")}–${Math.min(page * PAGE_SIZE, total).toLocaleString("ko-KR")} / ${total.toLocaleString("ko-KR")}`
            : "0건"}
        </span>
        <div>
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={onPrevious}
            aria-label="이전 페이지"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={onNext}
            aria-label="다음 페이지"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </footer>
    </section>
  );
}
