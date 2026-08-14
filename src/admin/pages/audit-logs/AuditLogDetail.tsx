import { useMemo } from "react";
import { ShieldCheck, X } from "lucide-react";
import styles from "@/styles/(admin)/pages/audit-logs/audit-logs.module.css";
import {
  auditFields,
  fieldLabel,
  formatAuditValue,
  operationLabel,
  tableLabel,
  type AuditLogGroup,
  type AuditLogRow,
  type AuditOperation,
} from "./audit-log-model";

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
  selected: AuditLogRow | null;
  selectedGroup: AuditLogGroup | null;
  onSelect: (log: AuditLogRow) => void;
  onClose: () => void;
};

export default function AuditLogDetail({
  selected,
  selectedGroup,
  onSelect,
  onClose,
}: Props) {
  const detailFields = useMemo(
    () => (selected ? auditFields(selected) : []),
    [selected],
  );

  return (
    <aside className={styles.detailPanel} aria-label="변경 상세">
      {selected ? (
        <>
          <header className={styles.detailHeading} data-tour-id="audit-detail">
            <div>
              <span
                className={`${styles.operation} ${operationClass(selected.operation)}`}
              >
                {operationLabel(selected.operation)}
              </span>
              <h2>{selected.record_label}</h2>
              <p>
                {tableLabel(selected.table_name)} · {selected.record_id}
              </p>
              <span className={styles.changeCount}>
                변경 필드 {detailFields.length}개
              </span>
            </div>
            <button type="button" onClick={onClose} aria-label="변경 상세 닫기">
              <X aria-hidden="true" />
            </button>
          </header>

          <dl className={styles.detailMeta}>
            <div>
              <dt>발생 시각</dt>
              <dd>
                {dateTimeFormatter.format(new Date(selected.occurred_at))}
              </dd>
            </div>
            <div>
              <dt>관리자</dt>
              <dd>{selected.actor_email || "시스템 작업"}</dd>
            </div>
            <div>
              <dt>트랜잭션</dt>
              <dd>{selected.transaction_id}</dd>
            </div>
          </dl>

          {selectedGroup && selectedGroup.entries.length > 1 && (
            <section className={styles.transactionRecords}>
              <h3>같은 작업의 변경 {selectedGroup.entries.length}건</h3>
              {selectedGroup.entries.map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  onClick={() => onSelect(entry)}
                  className={
                    entry.id === selected.id
                      ? styles.activeTransactionRecord
                      : undefined
                  }
                >
                  <span>{tableLabel(entry.table_name)}</span>
                  <b>{entry.record_label}</b>
                  <small>{operationLabel(entry.operation)}</small>
                </button>
              ))}
            </section>
          )}

          <section className={styles.changes}>
            <div className={styles.changeColumns} aria-hidden="true">
              <span>필드</span>
              <span>이전</span>
              <span>이후</span>
            </div>
            {detailFields.map(({ field, before, after }) => (
              <article key={field} className={styles.changeRow}>
                <h3>
                  {fieldLabel(field)}
                  <small>{field}</small>
                </h3>
                <pre
                  className={
                    selected.operation === "INSERT"
                      ? styles.notApplicable
                      : undefined
                  }
                >
                  {selected.operation === "INSERT"
                    ? "—"
                    : formatAuditValue(before)}
                </pre>
                <pre
                  className={
                    selected.operation === "DELETE"
                      ? styles.notApplicable
                      : undefined
                  }
                >
                  {selected.operation === "DELETE"
                    ? "—"
                    : formatAuditValue(after)}
                </pre>
              </article>
            ))}
            {!detailFields.length && (
              <p className={styles.noChanges}>
                값은 보안 정책에 따라 저장되지 않았습니다.
              </p>
            )}
          </section>
        </>
      ) : (
        <div className={styles.detailEmpty}>
          <span>
            <ShieldCheck aria-hidden="true" />
          </span>
          <b>변경 기록을 선택하세요.</b>
          <p>누가 어떤 값을 바꿨는지 필드 단위로 비교할 수 있습니다.</p>
          <small>감사 기록은 이 화면에서 수정하거나 삭제할 수 없습니다.</small>
        </div>
      )}
    </aside>
  );
}
