"use client";

import { BrainCircuit, Inbox, Search } from "lucide-react";
import CustomSelect from "@/core/components/form/CustomSelect";
import styles from "@/styles/(admin)/pages/protect/protect-admin.module.css";
import {
  type ProtectReport,
  type ReportFilter,
  type ReportSeverityFilter,
  type ReportStatus,
} from "./protect-types";
import { severityClass, severityLabel } from "./protect-types";

type StatusOption = { value: ReportStatus; label: string };

type ProtectReportListProps = {
  reports: ProtectReport[];
  total: number;
  statusCounts: { pending: number; reviewing: number };
  unclassifiedCount: number;
  classifying: boolean;
  refreshing: boolean;
  query: string;
  filter: ReportFilter;
  severityFilter: ReportSeverityFilter;
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
  onSeverityFilterChange: (value: ReportSeverityFilter) => void;
  onPageChange: (change: (current: number) => number) => void;
  onOpenReport: (report: ProtectReport) => void;
  onClearError: () => void;
  onClassifyPending: () => void;
};

export default function ProtectReportList({
  reports,
  total,
  statusCounts,
  unclassifiedCount,
  classifying,
  refreshing,
  query,
  filter,
  severityFilter,
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
  onSeverityFilterChange,
  onPageChange,
  onOpenReport,
  onClearError,
  onClassifyPending,
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
      <section className={styles.inbox}>
        <header className={styles.toolbar}>
          <div className={styles.toolbarTop}>
            <div className={styles.titleBlock}>
              <h1>권익 보호 접수함</h1>
              <p>
                <span>검색 결과 {total}건</span>
                <span>새 제보 {statusCounts.pending}건</span>
                <span>검토 중 {statusCounts.reviewing}건</span>
              </p>
            </div>
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
            <span data-tour-id="protect-severity-filter">
              <CustomSelect
                ariaLabel="우선순위 필터"
                value={severityFilter}
                onChange={(value) =>
                  onSeverityFilterChange(value as ReportSeverityFilter)
                }
                options={[
                  { value: "all", label: "모든 우선순위" },
                  { value: "critical", label: "긴급" },
                  { value: "high", label: "높음" },
                  { value: "normal", label: "일반" },
                  { value: "low", label: "낮음" },
                ]}
              />
            </span>
            <button
              type="button"
              className={styles.classifyButton}
              disabled={classifying || unclassifiedCount < 1}
              onClick={onClassifyPending}
            >
              <BrainCircuit aria-hidden="true" />
              {classifying
                ? "분류 중"
                : `전체 미분류 ${unclassifiedCount}건 분류`}
            </button>
          </div>
        </header>

        <div className={styles.tableWrap} aria-busy={refreshing}>
          {refreshing && <span className={styles.refreshBar} aria-hidden="true" />}
          <ul className={styles.mailList} aria-label="권익 보호 신고">
            {reports.map((report) => (
              <li key={report.id} className={styles.mailListItem}>
                <button
                  type="button"
                  className={`${styles.mailRow} ${
                    !report.read_at ? styles.unread : ""
                  }`}
                  aria-label={`${report.title} 신고 열기`}
                  data-tour-id="protect-open"
                  onClick={() => onOpenReport(report)}
                >
                  <span className={`${styles.mailCell} ${styles.mailTarget}`}>
                    <b>{report.artists?.name || "-"}</b>
                    <small>{report.author_name}</small>
                  </span>
                  <span className={`${styles.mailCell} ${styles.mailContent}`}>
                    <b>{report.title}</b>
                    <small>{report.content}</small>
                  </span>
                  <span className={`${styles.mailCell} ${styles.mailPlatform}`}>
                    {reportTypeLabels[report.report_type] || "기타"} / {report.platform}
                  </span>
                  <span className={`${styles.mailCell} ${styles.mailBadges}`}>
                    <span
                      className={`${styles.severity} ${
                        styles[
                          severityClass(
                            report.ai_classified_at
                              ? report.severity
                              : "pending",
                          )
                        ]
                      }`}
                    >
                      {report.ai_classified_at ? (
                        <>
                          <i /> {severityLabel(report.severity)}
                        </>
                      ) : (
                        <>
                          <BrainCircuit aria-hidden="true" /> 분류 중
                        </>
                      )}
                    </span>
                    <span
                      className={`${styles.status} ${statusClass(report.status)}`}
                    >
                      <i />
                      {statusLabel(report.status)}
                    </span>
                  </span>
                  <time className={styles.mailDate} dateTime={report.created_at}>
                    {formatDate(report.created_at)}
                  </time>
                </button>
              </li>
            ))}
          </ul>
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
