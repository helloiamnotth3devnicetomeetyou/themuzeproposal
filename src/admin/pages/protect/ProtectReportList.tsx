"use client";

import { ArrowRight, Inbox, Search, ShieldCheck } from "lucide-react";
import CustomSelect from "@/core/components/form/CustomSelect";
import styles from "@/styles/(admin)/pages/protect/protect-admin.module.css";
import {
  type ProtectReport,
  type ReportFilter,
  type ReportStatus,
} from "./protect-types";

type StatusOption = { value: ReportStatus; label: string };

type ProtectReportListProps = {
  reports: ProtectReport[];
  total: number;
  statusCounts: { pending: number; reviewing: number };
  query: string;
  filter: ReportFilter;
  page: number;
  pageSize: number;
  error: string;
  statuses: StatusOption[];
  reportTypeLabels: Record<string, string>;
  statusLabel: (status: string) => string;
  statusClass: (status: string) => string;
  formatDate: (value: string, detail?: boolean) => string;
  onQueryChange: (value: string) => void;
  onFilterChange: (value: ReportFilter) => void;
  onPageChange: (change: (current: number) => number) => void;
  onOpenReport: (report: ProtectReport) => void;
  onClearError: () => void;
};

export default function ProtectReportList({
  reports,
  total,
  statusCounts,
  query,
  filter,
  page,
  pageSize,
  error,
  statuses,
  reportTypeLabels,
  statusLabel,
  statusClass,
  formatDate,
  onQueryChange,
  onFilterChange,
  onPageChange,
  onOpenReport,
  onClearError,
}: ProtectReportListProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={styles.page}>
      {error && (
        <div className={styles.error} role="alert">
          <b>!</b>
          <span>{error}</span>
          <button type="button" onClick={onClearError}>
            닫기
          </button>
        </div>
      )}
      <section className={styles.summary}>
        <div>
          <span className={styles.summaryIcon}>
            <ShieldCheck aria-hidden="true" />
          </span>
          <p>
            <small>전체 제보</small>
            <strong>{total}</strong>
          </p>
        </div>
        <dl>
          <div>
            <dt>새 제보</dt>
            <dd>{statusCounts.pending}</dd>
          </div>
          <div>
            <dt>검토 중</dt>
            <dd>{statusCounts.reviewing}</dd>
          </div>
        </dl>
        <p>
          접수된 권익 침해 내용과 비공개 증거 자료를 확인하고 처리 상태를
          기록합니다.
        </p>
      </section>

      <section className={styles.inbox}>
        <header className={styles.toolbar}>
          <div>
            <h1>권익 보호 접수함</h1>
            <p>{total}건의 제보</p>
          </div>
          <div className={styles.filters} data-tour-id="protect-filters">
            <label className={styles.search} data-tour-id="protect-search">
              <Search aria-hidden="true" />
              <span className="sr-only">제보 검색</span>
              <input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="제목, 아티스트, 작성자 검색"
              />
            </label>
            <span data-tour-id="protect-status-filter">
              <CustomSelect
                ariaLabel="처리 상태 필터"
                value={filter}
                onChange={(value) => onFilterChange(value as ReportFilter)}
                options={[{ value: "all", label: "모든 상태" }, ...statuses]}
              />
            </span>
          </div>
        </header>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>접수일</th>
                <th>보호 대상</th>
                <th>제보 내용</th>
                <th>플랫폼</th>
                <th>상태</th>
                <th>
                  <span className="sr-only">보기</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.id}
                  tabIndex={0}
                  onClick={() => onOpenReport(report)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ")
                      onOpenReport(report);
                  }}
                >
                  <td data-label="접수일">{formatDate(report.created_at)}</td>
                  <td data-label="보호 대상">
                    <b>{report.artists?.name || "-"}</b>
                    <small>
                      {reportTypeLabels[report.report_type] || "기타"}
                    </small>
                  </td>
                  <td data-label="제보 내용">
                    <b>{report.title}</b>
                    <small>{report.author_name}</small>
                  </td>
                  <td data-label="플랫폼">{report.platform}</td>
                  <td data-label="상태">
                    <span
                      className={`${styles.status} ${statusClass(report.status)}`}
                    >
                      <i />
                      {statusLabel(report.status)}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      data-tour-id="protect-open"
                      tabIndex={-1}
                    >
                      열기{" "}
                      <span>
                        <ArrowRight aria-hidden="true" />
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!reports.length && (
            <div className={styles.empty}>
              <Inbox aria-hidden="true" />
              <b>
                {total
                  ? "조건에 맞는 제보가 없습니다."
                  : "아직 접수된 제보가 없습니다."}
              </b>
              <span>
                {total
                  ? "검색어나 상태 필터를 바꿔 보세요."
                  : "새 제보가 접수되면 이곳에 표시됩니다."}
              </span>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <nav className={styles.pagination} aria-label="신고 페이지">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => onPageChange((current) => current - 1)}
            >
              이전
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => onPageChange((current) => current + 1)}
            >
              다음
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
