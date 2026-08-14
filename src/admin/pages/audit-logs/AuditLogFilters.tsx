import { FormEvent } from "react";
import { Filter, Search, X } from "lucide-react";
import styles from "@/styles/(admin)/pages/audit-logs/audit-logs.module.css";
import {
  AUDIT_TABLES,
  tableLabel,
  type AuditLogFilters as AuditLogFiltersState,
} from "./audit-log-model";

type Props = {
  draftFilters: AuditLogFiltersState;
  activeFilterCount: number;
  onApply: (event: FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
  onChange: <K extends keyof AuditLogFiltersState>(
    key: K,
    value: AuditLogFiltersState[K],
  ) => void;
};

export default function AuditLogFilters({
  draftFilters,
  activeFilterCount,
  onApply,
  onClear,
  onChange,
}: Props) {
  return (
    <form
      className={styles.filters}
      data-tour-id="audit-filters"
      onSubmit={onApply}
    >
      <div className={styles.filterHeading}>
        <span>
          <Filter aria-hidden="true" /> 조회 조건
        </span>
        {activeFilterCount > 0 && <b>{activeFilterCount}개 적용 중</b>}
      </div>
      <div className={styles.filterGrid} data-tour-id="audit-filter-fields">
        <label>
          <span>시작일</span>
          <input
            type="date"
            value={draftFilters.fromDate}
            onChange={(event) => onChange("fromDate", event.target.value)}
          />
        </label>
        <label>
          <span>종료일</span>
          <input
            type="date"
            value={draftFilters.toDate}
            onChange={(event) => onChange("toDate", event.target.value)}
          />
        </label>
        <label>
          <span>관리자 이메일</span>
          <input
            type="search"
            value={draftFilters.actor}
            onChange={(event) => onChange("actor", event.target.value)}
            placeholder="admin@themuze.kr"
          />
        </label>
        <label>
          <span>대상 테이블</span>
          <select
            value={draftFilters.tableName}
            onChange={(event) => onChange("tableName", event.target.value)}
          >
            <option value="">전체 테이블</option>
            {AUDIT_TABLES.map((table) => (
              <option key={table} value={table}>
                {tableLabel(table)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>작업</span>
          <select
            value={draftFilters.operation}
            onChange={(event) =>
              onChange(
                "operation",
                event.target.value as AuditLogFiltersState["operation"],
              )
            }
          >
            <option value="">전체 작업</option>
            <option value="INSERT">생성</option>
            <option value="UPDATE">수정</option>
            <option value="DELETE">삭제</option>
          </select>
        </label>
        <label>
          <span>레코드 ID</span>
          <input
            type="search"
            value={draftFilters.recordId}
            onChange={(event) => onChange("recordId", event.target.value)}
            placeholder="UUID 또는 설정 키"
          />
        </label>
      </div>
      <div className={styles.filterActions}>
        <button
          type="button"
          data-tour-id="audit-reset"
          onClick={onClear}
          disabled={
            !activeFilterCount && !Object.values(draftFilters).some(Boolean)
          }
        >
          <X aria-hidden="true" /> 초기화
        </button>
        <button type="submit" data-tour-id="audit-search">
          <Search aria-hidden="true" /> 이력 조회
        </button>
      </div>
    </form>
  );
}
