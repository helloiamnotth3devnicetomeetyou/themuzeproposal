"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import styles from "@/styles/(admin)/pages/audit-logs/audit-logs.module.css";
import { supabase } from "@/core/supabase/client";
import AuditLogDetail from "./AuditLogDetail";
import AuditLogFilters from "./AuditLogFilters";
import AuditLogList from "./AuditLogList";
import {
  EMPTY_AUDIT_FILTERS,
  groupAuditLogs,
  type AuditLogFilters as AuditLogFilterState,
  type AuditLogRow,
} from "./audit-log-model";

const PAGE_SIZE = 10;
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

function localDateBoundary(value: string, addDays = 0) {
  const boundary = new Date(`${value}T00:00:00`);
  boundary.setDate(boundary.getDate() + addDays);
  return boundary.toISOString();
}

export default function AuditLogsAdminPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [draftFilters, setDraftFilters] =
    useState<AuditLogFilterState>(EMPTY_AUDIT_FILTERS);
  const [filters, setFilters] =
    useState<AuditLogFilterState>(EMPTY_AUDIT_FILTERS);
  const [selected, setSelected] = useState<AuditLogRow | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const groupedLogs = useMemo(() => groupAuditLogs(logs), [logs]);
  const selectedGroup = useMemo(
    () =>
      selected
        ? groupedLogs.find((group) =>
            group.entries.some((entry) => entry.id === selected.id),
          ) ?? null
        : null,
    [groupedLogs, selected],
  );

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    let query = supabase
      .from("admin_audit_logs")
      .select(AUDIT_SELECT, { count: "exact" })
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (filters.fromDate)
      query = query.gte("occurred_at", localDateBoundary(filters.fromDate));
    if (filters.toDate)
      query = query.lt("occurred_at", localDateBoundary(filters.toDate, 1));
    if (filters.actor.trim())
      query = query.ilike("actor_email", `%${filters.actor.trim()}%`);
    if (filters.tableName) query = query.eq("table_name", filters.tableName);
    if (filters.operation) query = query.eq("operation", filters.operation);
    if (filters.recordId.trim())
      query = query.ilike("record_id", `%${filters.recordId.trim()}%`);

    const { data, count, error: fetchError } = await query;
    if (fetchError) {
      setError(
        "변경 이력을 불러오지 못했습니다. 관리자 권한과 데이터베이스 마이그레이션 상태를 확인해 주세요.",
      );
      setLogs([]);
      setTotal(0);
    } else {
      const nextLogs = (data ?? []) as unknown as AuditLogRow[];
      setLogs(nextLogs);
      setTotal(count ?? 0);
      setSelected((current) =>
        current && nextLogs.some((log) => log.id === current.id)
          ? current
          : null,
      );
    }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    void Promise.resolve().then(loadLogs);
  }, [loadLogs]);

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

  const patchFilter = <K extends keyof AuditLogFilterState>(
    key: K,
    value: AuditLogFilterState[K],
  ) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const goPrevious = () => {
    setPage((current) => current - 1);
    setSelected(null);
  };

  const goNext = () => {
    setPage((current) => current + 1);
    setSelected(null);
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

      <AuditLogFilters
        draftFilters={draftFilters}
        activeFilterCount={activeFilterCount}
        onApply={applyFilters}
        onClear={clearFilters}
        onChange={patchFilter}
      />

      {error && (
        <div className={styles.error} role="alert">
          <b>!</b>
          <span>{error}</span>
          <button type="button" onClick={() => void loadLogs()}>
            다시 시도
          </button>
        </div>
      )}

      <div className={styles.workspace}>
        <AuditLogList
          groupedLogs={groupedLogs}
          selected={selected}
          page={page}
          totalPages={totalPages}
          total={total}
          loading={loading}
          onSelect={setSelected}
          onPrevious={goPrevious}
          onNext={goNext}
        />
        <AuditLogDetail
          selected={selected}
          selectedGroup={selectedGroup}
          onSelect={setSelected}
          onClose={() => setSelected(null)}
        />
      </div>
    </div>
  );
}
