"use client";

import { ArrowRight, Inbox, Mail, Search } from "lucide-react";
import CustomSelect from "@/core/components/form/CustomSelect";
import base from "@/styles/(admin)/pages/protect/protect-admin.module.css";
import styles from "@/styles/(admin)/pages/contact/contact-admin.module.css";
import { PAGE_SIZE } from "./useContactInquiries";
import type {
  ContactCategory,
  ContactInquiry,
  ContactSpamFilter,
  ContactStatus,
  ContactUrgencyFilter,
} from "./useContactInquiries";
import {
  formatDate,
  statuses,
  statusClass,
  statusLabel,
  typeLabels,
} from "./contact-utils";

type ContactListProps = {
  category: ContactCategory;
  categoryCounts: Record<ContactCategory, number>;
  error: string;
  listError: string;
  fetchInquiries: () => Promise<void>;
  filter: ContactStatus | "all";
  urgencyFilter: ContactUrgencyFilter;
  spamFilter: ContactSpamFilter;
  pendingAiCount: number;
  classifying: boolean;
  inquiries: ContactInquiry[];
  page: number;
  query: string;
  total: number;
  onCategoryChange: (category: ContactCategory) => void;
  onClearError: () => void;
  onFilterChange: (filter: ContactStatus | "all") => void;
  onUrgencyFilterChange: (filter: ContactUrgencyFilter) => void;
  onSpamFilterChange: (filter: ContactSpamFilter) => void;
  onClassifyPending: () => void;
  onOpenInquiry: (inquiry: ContactInquiry) => void;
  onPageChange: (page: number) => void;
  onQueryChange: (query: string) => void;
};

export default function ContactList({
  category,
  categoryCounts,
  error,
  listError,
  fetchInquiries,
  filter,
  urgencyFilter,
  spamFilter,
  pendingAiCount,
  classifying,
  inquiries,
  page,
  query,
  total,
  onCategoryChange,
  onClearError,
  onFilterChange,
  onUrgencyFilterChange,
  onSpamFilterChange,
  onClassifyPending,
  onOpenInquiry,
  onPageChange,
  onQueryChange,
}: ContactListProps) {
  const listFailure = error || listError;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (listFailure) {
    return (
      <div className={`${base.page} ${styles.fullPage}`}>
        <div className={`${base.error} ${styles.fullWidth}`} role="alert">
          <b>!</b>
          <span>{listFailure}</span>
          <button type="button" onClick={() => void fetchInquiries()}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${base.page} ${styles.fullPage}`}>
      {error && (
        <div className={`${base.error} ${styles.fullWidth}`} role="alert">
          <b>!</b>
          <span>{error}</span>
          <button type="button" onClick={onClearError}>
            닫기
          </button>
        </div>
      )}

      <section className={`${base.summary} ${styles.fullWidth}`}>
        <div>
          <span className={base.summaryIcon}>
            <Mail aria-hidden="true" />
          </span>
          <p>
            <small>전체 문의</small>
            <strong>{categoryCounts.general + categoryCounts.business}</strong>
          </p>
        </div>
        <div
          className={styles.summaryTabs}
          data-tour-id="contact-category"
          role="tablist"
          aria-label="문의 구분"
        >
          {(["general", "business"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={category === value}
              className={category === value ? styles.active : ""}
              onClick={() => onCategoryChange(value)}
            >
              <span>{value === "general" ? "일반 문의" : "Business"}</span>
              <strong>{categoryCounts[value]}</strong>
            </button>
          ))}
        </div>
        <p>
          문의는 우선순위와 읽음 상태를 기준으로 정렬됩니다. 미분류 문의는 AI로 처리할 수 있습니다.
        </p>
      </section>

      <section className={`${base.inbox} ${styles.fullWidth}`}>
        <header className={base.toolbar}>
          <div>
            <h1>문의 메일함</h1>
            <p>{category === "business" ? "Business" : "일반 문의"} · {total}건</p>
          </div>
          <button
            type="button"
            className={styles.classifyButton}
            disabled={!pendingAiCount || classifying}
            onClick={onClassifyPending}
          >
            {classifying ? "분류 중…" : `미분류 ${pendingAiCount}건 분류`}
          </button>
          <div className={base.filters} data-tour-id="contact-filters">
            <label className={base.search} data-tour-id="contact-search">
              <Search aria-hidden="true" />
              <span className="sr-only">문의 검색</span>
              <input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="이름, 이메일, 회사명, 내용 검색"
              />
            </label>
            <CustomSelect
              ariaLabel="처리 상태 필터"
              value={filter}
              onChange={(value) => onFilterChange(value as ContactStatus | "all")}
              options={[{ value: "all", label: "모든 상태" }, ...statuses]}
            />
            <CustomSelect
              ariaLabel="우선순위 필터"
              value={urgencyFilter}
              onChange={(value) => onUrgencyFilterChange(value as ContactUrgencyFilter)}
              options={[
                { value: "all", label: "전체 우선순위" },
                { value: "urgent", label: "긴급" },
                { value: "normal", label: "일반" },
              ]}
            />
            <CustomSelect
              ariaLabel="스팸 필터"
              value={spamFilter}
              onChange={(value) => onSpamFilterChange(value as ContactSpamFilter)}
              options={[
                { value: "all", label: "전체 분류" },
                { value: "normal", label: "정상" },
                { value: "spam", label: "스팸" },
              ]}
            />
          </div>
        </header>

        <div className={`${base.tableWrap} ${styles.mailList}`}>
          <div className={styles.mailHeader} aria-hidden="true">
            <span>접수일</span>
            <span>{category === "business" ? "회사 / 담당자" : "문의자"}</span>
            <span>문의 내용</span>
            <span>이메일</span>
            <span>우선순위</span>
            <span>상태</span>
            <span />
          </div>
          {inquiries.map((inquiry) => (
            <button
              key={inquiry.id}
              type="button"
              className={`${styles.mailRow} ${!inquiry.read_at ? styles.unread : ""} ${inquiry.is_likely_spam ? styles.spam : ""}`}
              aria-label={`${inquiry.contact_name} 문의 열기`}
              data-tour-id="contact-open"
              onClick={() => onOpenInquiry(inquiry)}
            >
              <span className={styles.mailCell} data-label="접수일">{formatDate(inquiry.created_at)}</span>
              <span className={styles.mailCell} data-label="문의자">
                <b>{inquiry.company_name || inquiry.contact_name}</b>
                <small>{inquiry.company_name ? inquiry.contact_name : typeLabels[inquiry.inquiry_type]}</small>
              </span>
              <span className={styles.mailCell} data-label="문의 내용">
                <b>{typeLabels[inquiry.inquiry_type] || "기타 문의"}</b>
                <small>{inquiry.message}</small>
              </span>
              <span className={styles.mailCell} data-label="이메일">{inquiry.email}</span>
              <span className={styles.mailCell} data-label="우선순위">
                <span className={styles.priority}>
                  {!inquiry.ai_classified_at ? "미분류" : inquiry.urgency === "urgent" || inquiry.urgency === "high" ? "긴급" : "일반"}
                </span>
                {inquiry.is_likely_spam && <small className={styles.spamLabel}>스팸 의심</small>}
              </span>
              <span className={styles.mailCell} data-label="상태">
                <span className={`${base.status} ${statusClass(inquiry.status)}`}><i />{statusLabel(inquiry.status)}</span>
                {!inquiry.read_at && <small className={styles.unreadLabel}>읽지 않음</small>}
              </span>
              <span className={styles.mailArrow} aria-hidden="true"><ArrowRight /></span>
            </button>
          ))}
          {!inquiries.length && (
            <div className={base.empty}>
              <Inbox aria-hidden="true" />
              <b>{total ? "조건에 맞는 문의가 없습니다." : "아직 접수된 문의가 없습니다."}</b>
              <span>{total ? "검색어나 필터를 바꿔 보세요." : "새 문의가 접수되면 여기에 표시됩니다."}</span>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <nav className={base.pagination} aria-label="문의 페이지">
            <button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
              이전
            </button>
            <span>{page} / {totalPages}</span>
            <button type="button" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
              다음
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
