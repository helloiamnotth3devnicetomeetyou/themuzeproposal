"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, Filter, History, Search, ShieldCheck, X } from "lucide-react";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { supabase } from "@/core/supabase/client";
import styles from "@/styles/(admin)/pages/audit-logs/audit-logs.module.css";
import {
  AUDIT_TABLES,
  EMPTY_AUDIT_FILTERS,
  auditFields,
  fieldLabel,
  formatAuditValue,
  operationLabel,
  tableLabel,
  type AuditLogFilters,
  type AuditLogRow,
  type AuditOperation,
} from "./audit-log-model";

const PAGE_SIZE = 50;
const AUDIT_SELECT = [
  "id",
  "occurred_at",
  "actor_id",
  "actor_email",
  "operation",
  "table_name",
  "record_id",
  "record_label",
  "changed_fields",
  "before_values",
  "after_values",
  "transaction_id",
].join(",");

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function localDateBoundary(value: string, addDays = 0) {
  const boundary = new Date(`${value}T00:00:00`);
  boundary.setDate(boundary.getDate() + addDays);
  return boundary.toISOString();
}

function operationClass(operation: AuditOperation) {
  if (operation === "INSERT") return styles.operationInsert;
  if (operation === "DELETE") return styles.operationDelete;
  return styles.operationUpdate;
}

export default function AuditLogsAdminPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [draftFilters, setDraftFilters] = useState<AuditLogFilters>(EMPTY_AUDIT_FILTERS);
  const [filters, setFilters] = useState<AuditLogFilters>(EMPTY_AUDIT_FILTERS);
  const [selected, setSelected] = useState<AuditLogRow | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    let query = supabase
      .from("admin_audit_logs")
      .select(AUDIT_SELECT, { count: "exact" })
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (filters.fromDate) query = query.gte("occurred_at", localDateBoundary(filters.fromDate));
    if (filters.toDate) query = query.lt("occurred_at", localDateBoundary(filters.toDate, 1));
    if (filters.actor.trim()) query = query.ilike("actor_email", `%${filters.actor.trim()}%`);
    if (filters.tableName) query = query.eq("table_name", filters.tableName);
    if (filters.operation) query = query.eq("operation", filters.operation);
    if (filters.recordId.trim()) query = query.ilike("record_id", `%${filters.recordId.trim()}%`);

    const { data, count, error: fetchError } = await query;
    if (fetchError) {
      setError("변경 이력을 불러오지 못했습니다. 관리자 권한과 데이터베이스 마이그레이션 상태를 확인해 주세요.");
      setLogs([]);
      setTotal(0);
    } else {
      const nextLogs = (data ?? []) as unknown as AuditLogRow[];
      setLogs(nextLogs);
      setTotal(count ?? 0);
      setSelected((current) => current && nextLogs.some((log) => log.id === current.id) ? current : null);
    }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    void Promise.resolve().then(loadLogs);
  }, [loadLogs]);

  const detailFields = useMemo(() => selected ? auditFields(selected) : [], [selected]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSelected(null);
    setFilters({ ...draftFilters });
  };

  const clearFilters = () => {
    setDraftFilters(EMPTY_AUDIT_FILTERS);
    setFilters(EMPTY_AUDIT_FILTERS);
    setPage(1);
    setSelected(null);
  };

  const patchFilter = <K extends keyof AuditLogFilters>(key: K, value: AuditLogFilters[K]) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>관리자 변경 이력</h1>
          <p>관리자와 시스템이 콘텐츠에 남긴 변경을 시간순으로 확인합니다.</p>
        </div>
        <div className={styles.ledgerSummary} aria-live="polite">
          <span>IMMUTABLE LEDGER</span>
          <strong>{total.toLocaleString("ko-KR")}</strong>
          <small>필터 결과</small>
        </div>
      </header>

      <form className={styles.filters} onSubmit={applyFilters}>
        <div className={styles.filterHeading}>
          <span><Filter aria-hidden="true" /> 조회 조건</span>
          {activeFilterCount > 0 && <b>{activeFilterCount}개 적용 중</b>}
        </div>
        <div className={styles.filterGrid}>
          <label>
            <span>시작일</span>
            <input type="date" value={draftFilters.fromDate} onChange={(event) => patchFilter("fromDate", event.target.value)} />
          </label>
          <label>
            <span>종료일</span>
            <input type="date" value={draftFilters.toDate} onChange={(event) => patchFilter("toDate", event.target.value)} />
          </label>
          <label>
            <span>관리자 이메일</span>
            <input type="search" value={draftFilters.actor} onChange={(event) => patchFilter("actor", event.target.value)} placeholder="admin@themuze.kr" />
          </label>
          <label>
            <span>대상 종류</span>
            <select value={draftFilters.tableName} onChange={(event) => patchFilter("tableName", event.target.value)}>
              <option value="">전체 대상</option>
              {AUDIT_TABLES.map((table) => <option key={table} value={table}>{tableLabel(table)}</option>)}
            </select>
          </label>
          <label>
            <span>작업</span>
            <select value={draftFilters.operation} onChange={(event) => patchFilter("operation", event.target.value as AuditLogFilters["operation"])}>
              <option value="">전체 작업</option>
              <option value="INSERT">생성</option>
              <option value="UPDATE">수정</option>
              <option value="DELETE">삭제</option>
            </select>
          </label>
          <label>
            <span>대상 ID</span>
            <input type="search" value={draftFilters.recordId} onChange={(event) => patchFilter("recordId", event.target.value)} placeholder="UUID 또는 설정 키" />
          </label>
        </div>
        <div className={styles.filterActions}>
          <button type="button" onClick={clearFilters} disabled={!activeFilterCount && !Object.values(draftFilters).some(Boolean)}>
            <X aria-hidden="true" /> 초기화
          </button>
          <button type="submit"><Search aria-hidden="true" /> 이력 조회</button>
        </div>
      </form>

      {error && (
        <div className={styles.error} role="alert">
          <b>!</b><span>{error}</span><button type="button" onClick={() => void loadLogs()}>다시 시도</button>
        </div>
      )}

      <div className={styles.workspace}>
        <section className={styles.logPanel} aria-label="변경 이력 목록">
          <div className={styles.panelHeading}>
            <div>
              <History aria-hidden="true" />
              <span><b>변경 기록</b><small>최신 작업부터 표시</small></span>
            </div>
            <span>{page} / {totalPages}</span>
          </div>

          {loading ? (
            <LoadingIndicator label="변경 이력을 불러오는 중..." className={styles.loading} />
          ) : logs.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>발생 시각</th>
                    <th>관리자</th>
                    <th>작업</th>
                    <th>대상</th>
                    <th><span className="sr-only">상세</span></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className={selected?.id === log.id ? styles.selectedRow : undefined}>
                      <td>
                        <span className={styles.time}><Clock3 aria-hidden="true" />{dateTimeFormatter.format(new Date(log.occurred_at))}</span>
                        <small>LOG #{String(log.id).padStart(6, "0")}</small>
                      </td>
                      <td><b>{log.actor_email || "시스템 작업"}</b><small>{log.actor_id ? log.actor_id.slice(0, 8).toUpperCase() : "SERVICE"}</small></td>
                      <td><span className={`${styles.operation} ${operationClass(log.operation)}`}>{operationLabel(log.operation)}</span></td>
                      <td><b>{log.record_label}</b><small>{tableLabel(log.table_name)} · {log.record_id}</small></td>
                      <td><button type="button" onClick={() => setSelected(log)} aria-label={`${log.record_label} 변경 상세 보기`}><ChevronRight aria-hidden="true" /></button></td>
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
            <span>{total ? `${((page - 1) * PAGE_SIZE + 1).toLocaleString("ko-KR")}–${Math.min(page * PAGE_SIZE, total).toLocaleString("ko-KR")} / ${total.toLocaleString("ko-KR")}` : "0건"}</span>
            <div>
              <button type="button" disabled={page <= 1 || loading} onClick={() => { setPage((current) => current - 1); setSelected(null); }} aria-label="이전 페이지"><ChevronLeft aria-hidden="true" /></button>
              <button type="button" disabled={page >= totalPages || loading} onClick={() => { setPage((current) => current + 1); setSelected(null); }} aria-label="다음 페이지"><ChevronRight aria-hidden="true" /></button>
            </div>
          </footer>
        </section>

        <aside className={styles.detailPanel} aria-label="변경 상세">
          {selected ? (
            <>
              <header className={styles.detailHeading}>
                <div>
                  <span className={`${styles.operation} ${operationClass(selected.operation)}`}>{operationLabel(selected.operation)}</span>
                  <h2>{selected.record_label}</h2>
                  <p>{tableLabel(selected.table_name)} · {selected.record_id}</p>
                </div>
                <button type="button" onClick={() => setSelected(null)} aria-label="변경 상세 닫기"><X aria-hidden="true" /></button>
              </header>

              <dl className={styles.detailMeta}>
                <div><dt>발생 시각</dt><dd>{dateTimeFormatter.format(new Date(selected.occurred_at))}</dd></div>
                <div><dt>관리자</dt><dd>{selected.actor_email || "시스템 작업"}</dd></div>
                <div><dt>트랜잭션</dt><dd>{selected.transaction_id}</dd></div>
              </dl>

              <section className={styles.changes}>
                <div className={styles.changeColumns} aria-hidden="true"><span>필드</span><span>이전</span><span>이후</span></div>
                {detailFields.map(({ field, before, after }) => (
                  <article key={field} className={styles.changeRow}>
                    <h3>{fieldLabel(field)}<small>{field}</small></h3>
                    <pre className={selected.operation === "INSERT" ? styles.notApplicable : undefined}>{selected.operation === "INSERT" ? "—" : formatAuditValue(before)}</pre>
                    <pre className={selected.operation === "DELETE" ? styles.notApplicable : undefined}>{selected.operation === "DELETE" ? "—" : formatAuditValue(after)}</pre>
                  </article>
                ))}
                {!detailFields.length && <p className={styles.noChanges}>값은 보안 정책에 따라 저장되지 않았습니다.</p>}
              </section>
            </>
          ) : (
            <div className={styles.detailEmpty}>
              <span><ShieldCheck aria-hidden="true" /></span>
              <b>변경 기록을 선택하세요.</b>
              <p>누가 어떤 값을 바꿨는지 필드 단위로 비교할 수 있습니다.</p>
              <small>감사 기록은 이 화면에서 수정하거나 삭제할 수 없습니다.</small>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
