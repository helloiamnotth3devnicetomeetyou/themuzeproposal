"use client";

import { ArrowRight, Inbox, Mail, Search } from "lucide-react";
import CustomSelect from "@/core/components/form/CustomSelect";
import {
  PAGE_SIZE,
} from "./useContactInquiries";
import type {
  ContactCategory,
  ContactInquiry,
  ContactStatus,
} from "./useContactInquiries";
import {
  formatDate,
  statuses,
  statusClass,
  statusLabel,
  typeLabels,
} from "./contact-utils";
import base from "@/styles/(admin)/pages/protect/protect-admin.module.css";
import styles from "@/styles/(admin)/pages/contact/contact-admin.module.css";

type ContactListProps = {
  category: ContactCategory;
  categoryCounts: Record<ContactCategory, number>;
  error: string;
  listError: string;
  fetchInquiries: () => Promise<void>;
  filter: ContactStatus | "all";
  inquiries: ContactInquiry[];
  page: number;
  query: string;
  total: number;
  onCategoryChange: (category: ContactCategory) => void;
  onClearError: () => void;
  onFilterChange: (filter: ContactStatus | "all") => void;
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
  inquiries,
  page,
  query,
  total,
  onCategoryChange,
  onClearError,
  onFilterChange,
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
          <button
            data-tour-id="contact-category-general"
            type="button"
            role="tab"
            aria-selected={category === "general"}
            className={category === "general" ? styles.active : ""}
            onClick={() => onCategoryChange("general")}
          >
            <span>일반 문의</span>
            <strong>{categoryCounts.general}</strong>
          </button>
          <button
            data-tour-id="contact-category-business"
            type="button"
            role="tab"
            aria-selected={category === "business"}
            className={category === "business" ? styles.active : ""}
            onClick={() => onCategoryChange("business")}
          >
            <span>Business</span>
            <strong>{categoryCounts.business}</strong>
          </button>
        </div>
        <p>
          {category === "business"
            ? "협업·광고·제휴 제안을 검토하고 담당자 응대 상태를 기록합니다."
            : "팬과 고객이 남긴 일반 문의를 확인하고 답변 상태를 기록합니다."}
        </p>
      </section>

      <section className={`${base.inbox} ${styles.fullWidth}`}>
        <header className={base.toolbar}>
          <div>
            <h1>문의 접수함</h1>
            <p>
              {category === "business" ? "Business" : "일반 문의"} · {total}건
            </p>
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
            <span data-tour-id="contact-status-filter">
              <CustomSelect
                ariaLabel="처리 상태 필터"
                value={filter}
                onChange={(value) =>
                  onFilterChange(value as ContactStatus | "all")
                }
                options={[{ value: "all", label: "모든 상태" }, ...statuses]}
              />
            </span>
          </div>
        </header>

        <div className={base.tableWrap}>
          <table className={base.table}>
            <thead>
              <tr>
                <th>접수일</th>
                <th>{category === "business" ? "회사 / 담당자" : "문의자"}</th>
                <th>문의 내용</th>
                <th>이메일</th>
                <th>상태</th>
                <th>
                  <span className="sr-only">보기</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr
                  key={inquiry.id}
                  tabIndex={0}
                  onClick={() => onOpenInquiry(inquiry)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ")
                      onOpenInquiry(inquiry);
                  }}
                >
                  <td data-label="접수일">{formatDate(inquiry.created_at)}</td>
                  <td data-label="문의자">
                    <b>{inquiry.company_name || inquiry.contact_name}</b>
                    <small>
                      {inquiry.company_name
                        ? inquiry.contact_name
                        : typeLabels[inquiry.inquiry_type]}
                    </small>
                  </td>
                  <td data-label="문의 내용">
                    <b>{typeLabels[inquiry.inquiry_type] || "기타 문의"}</b>
                    <small>{inquiry.message}</small>
                  </td>
                  <td data-label="이메일">{inquiry.email}</td>
                  <td data-label="상태">
                    <span
                      className={`${base.status} ${statusClass(inquiry.status)}`}
                    >
                      <i />
                      {statusLabel(inquiry.status)}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      data-tour-id="contact-open"
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
          {!inquiries.length && (
            <div className={base.empty}>
              <Inbox aria-hidden="true" />
              <b>
                {total
                  ? "조건에 맞는 문의가 없습니다."
                  : "아직 접수된 문의가 없습니다."}
              </b>
              <span>
                {total
                  ? "검색어나 상태 필터를 바꿔 보세요."
                  : "새 문의가 접수되면 이곳에 표시됩니다."}
              </span>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <nav className={base.pagination} aria-label="문의 페이지">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              이전
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              다음
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
