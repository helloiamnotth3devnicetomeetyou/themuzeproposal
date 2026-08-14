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
  tableLabel,
  type AuditLogGroup,
  type AuditLogRow,
  type AuditOperation,
} from "./audit-log-model";

const PAGE_SIZE = 50;

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
            <small>최신 작업부터 표시</small>
          </span>
        </div>
        <span>
          {page} / {totalPages}
        </span>
      </div>

      {loading ? (
        <AdminSkeleton variant="table" className={styles.loading} rows={5} />
      ) : groupedLogs.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>발생 시각</th>
                <th>관리자</th>
                <th>작업</th>
                <th>대상</th>
                <th>
                  <span className="sr-only">상세</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedLogs.map(({ primary: log, entries }) => (
                <tr
                  key={log.id}
                  className={
                    selected?.id === log.id ? styles.selectedRow : undefined
                  }
                >
                  <td>
                    <span className={styles.time}>
                      <Clock3 aria-hidden="true" />
                      {dateTimeFormatter.format(new Date(log.occurred_at))}
                    </span>
                    <small>LOG #{String(log.id).padStart(6, "0")}</small>
                  </td>
                  <td>
                    <b>{log.actor_email || "시스템 작업"}</b>
                    <small>
                      {log.actor_id
                        ? log.actor_id.slice(0, 8).toUpperCase()
                        : "SERVICE"}
                    </small>
                  </td>
                  <td>
                    <span
                      className={`${styles.operation} ${operationClass(log.operation)}`}
                    >
                      {operationLabel(log.operation)}
                    </span>
                  </td>
                  <td>
                    <b>
                      {log.record_label}
                      {entries.length > 1 ? ` 외 ${entries.length - 1}건` : ""}
                    </b>
                    <small>
                      {tableLabel(log.table_name)} · {log.record_id.slice(0, 8)}{" "}
                      <button
                        type="button"
                        className={styles.copyId}
                        onClick={() =>
                          void navigator.clipboard.writeText(log.record_id)
                        }
                      >
                        ID 복사
                      </button>
                    </small>
                  </td>
                  <td>
                    <button
                      type="button"
                      data-tour-id="audit-open"
                      onClick={() => onSelect(log)}
                      aria-label={`${log.record_label} 변경 상세 보기`}
                    >
                      <ChevronRight aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
