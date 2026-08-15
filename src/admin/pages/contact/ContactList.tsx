"use client";

import { BrainCircuit, Inbox, Search } from "lucide-react";
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
  refreshing: boolean;
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
  refreshing,
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

  return (
    <div className={`${base.page} ${styles.fullPage}`}>
      {listFailure && (
        <div className={`${base.error} ${styles.fullWidth}`} role="alert">
          <b>!</b>
          <span>{listFailure}</span>
          <button
            type="button"
            onClick={() => {
              onClearError();
              void fetchInquiries();
            }}
          >
            다시 시도
          </button>
        </div>
      )}

      <section className={`${base.inbox} ${styles.fullWidth}`}>
        <header className={base.toolbar}>
          <div className={base.toolbarTop}>
            <div className={base.titleBlock}>
              <h1>문의 메일함</h1>
              <p>검색 결과 {total}건</p>
            </div>
            <div
              className={base.categoryTabs}
              data-tour-id="contact-category"
              aria-label="문의 구분"
            >
              {(["general", "business"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={category === value}
                  className={category === value ? base.active : ""}
                  onClick={() => onCategoryChange(value)}
                >
                  <span>{value === "general" ? "일반 문의" : "Business"}</span>
                  <strong>{categoryCounts[value]}</strong>
                </button>
              ))}
            </div>
          </div>
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
            <button
              type="button"
              className={base.classifyButton}
              disabled={!pendingAiCount || classifying}
              onClick={onClassifyPending}
            >
              <BrainCircuit aria-hidden="true" />
              {classifying
                ? "분류 중"
                : `전체 미분류 ${pendingAiCount}건 분류`}
            </button>
          </div>
        </header>

        <div
          className={base.tableWrap}
          aria-busy={refreshing}
        >
          {refreshing && <span className={base.refreshBar} aria-hidden="true" />}
          {inquiries.map((inquiry) => (
            <button
              key={inquiry.id}
              type="button"
              className={`${base.mailRow} ${!inquiry.read_at ? base.unread : ""} ${inquiry.is_likely_spam ? styles.spam : ""}`}
              aria-label={`${inquiry.contact_name} 문의 열기`}
              data-tour-id="contact-open"
              onClick={() => onOpenInquiry(inquiry)}
            >
              <span className={`${base.mailCell} ${base.mailSender}`}>
                <b>{inquiry.company_name || inquiry.contact_name}</b>
                <small>{inquiry.company_name ? inquiry.contact_name : inquiry.email}</small>
              </span>
              <span className={`${base.mailCell} ${base.mailSubject}`}>
                <b>{typeLabels[inquiry.inquiry_type] || "기타 문의"}</b>
                <small>{inquiry.message}</small>
              </span>
              <span className={`${base.mailCell} ${base.mailMeta}`}>
                {inquiry.company_name ? inquiry.email : typeLabels[inquiry.inquiry_type]}
              </span>
              <span className={`${base.mailCell} ${base.mailBadges}`}>
                <span className={styles.priority}>
                  {!inquiry.ai_classified_at ? "미분류" : inquiry.urgency === "urgent" || inquiry.urgency === "high" ? "긴급" : "일반"}
                </span>
                {inquiry.is_likely_spam && <small className={styles.spamLabel}>스팸 의심</small>}
                <span className={`${base.status} ${statusClass(inquiry.status)}`}><i />{statusLabel(inquiry.status)}</span>
              </span>
              <time className={base.mailDate} dateTime={inquiry.created_at}>
                {formatDate(inquiry.created_at)}
              </time>
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
