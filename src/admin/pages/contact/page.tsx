"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, ExternalLink, Inbox, Mail, MessageSquareText, Paperclip, Search } from "lucide-react";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import CustomSelect from "@/core/components/form/CustomSelect";
import { supabase } from "@/core/supabase/client";
import base from "@/styles/(admin)/pages/protect/protect-admin.module.css";
import styles from "@/styles/(admin)/pages/contact/contact-admin.module.css";

type ContactCategory = "general" | "business";
type ContactStatus = "pending" | "reviewing" | "answered" | "closed";
type ContactInquiry = {
  id: string;
  user_id: string | null;
  category: ContactCategory;
  inquiry_type: string;
  company_name: string | null;
  contact_name: string;
  phone: string | null;
  email: string;
  message: string;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  status: ContactStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

const statuses: Array<{ value: ContactStatus; label: string }> = [
  { value: "pending", label: "접수" },
  { value: "reviewing", label: "검토 중" },
  { value: "answered", label: "답변 완료" },
  { value: "closed", label: "종결" },
];

const typeLabels: Record<string, string> = {
  account: "계정 문의",
  notice_event: "공지·이벤트 문의",
  goods_md: "굿즈·MD 문의",
  site_error: "사이트 오류 신고",
  other: "기타",
  brand_collaboration: "브랜드 협업",
  advertising_sponsorship: "광고·협찬 제안",
  md_licensing: "MD·상품화 제안",
  performance_event: "공연·행사 섭외",
  other_business: "기타 비즈니스 제안",
};

const statusLabel = (status: ContactStatus) =>
  statuses.find((item) => item.value === status)?.label || "접수";
const statusClass = (status: ContactStatus) => {
  if (status === "answered") return base.status_resolved;
  if (status === "closed") return base.status_rejected;
  return base[`status_${status}`] || base.status_pending;
};
const formatDate = (value: string, detail = false) => new Intl.DateTimeFormat(
  "ko-KR",
  detail
    ? { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    : { year: "numeric", month: "2-digit", day: "2-digit" },
).format(new Date(value));
const formatBytes = (value: number | null) =>
  value ? `${(value / 1024 / 1024).toFixed(1)}MB` : "";
const PAGE_SIZE = 20;
const searchTerm = (value: string) => value.trim().replace(/[%,_()]/g, " ");

export default function ContactAdminPage() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ContactCategory>("general");
  const [viewing, setViewing] = useState<ContactInquiry | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<ContactCategory, number>>({ general: 0, business: 0 });
  const [note, setNote] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    setError("");
    let request = supabase
      .from("contact_inquiries")
      .select("*", { count: "exact" })
      .eq("category", category)
      .order("created_at", { ascending: false });
    if (filter !== "all") request = request.eq("status", filter);
    const keyword = searchTerm(debouncedQuery);
    if (keyword) request = request.or(`contact_name.ilike.%${keyword}%,email.ilike.%${keyword}%,phone.ilike.%${keyword}%,company_name.ilike.%${keyword}%,message.ilike.%${keyword}%`);
    const [{ data, count, error: fetchError }, general, business] = await Promise.all([
      request.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1).overrideTypes<ContactInquiry[], { merge: false }>(),
      supabase.from("contact_inquiries").select("id", { count: "exact", head: true }).eq("category", "general"),
      supabase.from("contact_inquiries").select("id", { count: "exact", head: true }).eq("category", "business"),
    ]);
    if (fetchError) setError(fetchError.message);
    else {
      setInquiries(data ?? []);
      setTotal(count ?? 0);
      setCategoryCounts({ general: general.count ?? 0, business: business.count ?? 0 });
    }
    setLoading(false);
  }, [category, debouncedQuery, filter, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedQuery(query); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchInquiries(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchInquiries]);

  const openInquiry = (inquiry: ContactInquiry) => {
    setNote(inquiry.admin_note || "");
    setAttachmentUrl("");
    setViewing(inquiry);
  };

  useEffect(() => {
    if (!viewing?.attachment_path) return;
    let active = true;
    const signAttachment = async () => {
      const { data } = await supabase.storage
        .from("contact-attachments")
        .createSignedUrl(viewing.attachment_path!, 900);
      if (active) setAttachmentUrl(data?.signedUrl || "");
    };
    void signAttachment();
    return () => { active = false; };
  }, [viewing]);

  const updateInquiry = async (
    changes: Partial<Pick<ContactInquiry, "status" | "admin_note">>,
  ) => {
    if (!viewing) return;
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase
      .from("contact_inquiries")
      .update(changes)
      .eq("id", viewing.id);
    if (updateError) {
      setError(updateError.message);
    } else {
      const updated = { ...viewing, ...changes };
      setViewing(updated);
      setInquiries((current) => current.map((item) => item.id === viewing.id ? updated : item));
      window.dispatchEvent(new Event("admin-inbox-changed"));
    }
    setSaving(false);
  };

  if (loading) {
    return <AdminSkeleton variant="inbox" className="min-h-[320px]" rows={5} />;
  }

  if (viewing) {
    const isBusiness = viewing.category === "business";
    return (
      <div className={`${base.page} ${base.detailPage} ${styles.fullPage}`}>
        <button type="button" className={`${base.back} ${styles.fullWidth}`} onClick={() => setViewing(null)}>
          <ArrowLeft aria-hidden="true" /> 문의 목록
        </button>
        {error && (
          <div className={`${base.error} ${styles.fullWidth}`} role="alert">
            <b>!</b><span>{error}</span>
            <button type="button" onClick={() => setError("")}>닫기</button>
          </div>
        )}

        <article className={`${base.detailCard} ${styles.fullWidth}`} data-tour-id="contact-workspace">
          <header className={base.detailHeader}>
            <span className={base.detailIcon}>
              {isBusiness ? <BriefcaseBusiness aria-hidden="true" /> : <MessageSquareText aria-hidden="true" />}
            </span>
            <div>
              <p>{typeLabels[viewing.inquiry_type] || "기타 문의"}</p>
              <h1>{viewing.company_name || viewing.contact_name}님의 문의</h1>
              <small>{formatDate(viewing.created_at, true)} 접수 · {viewing.id.slice(0, 8).toUpperCase()}</small>
            </div>
            <span className={`${base.status} ${statusClass(viewing.status)}`}><i />{statusLabel(viewing.status)}</span>
          </header>

          <div className={base.detailBody}>
            <section>
              <div className={base.sectionHeading}><span>MESSAGE</span><h2>{isBusiness ? "제안 내용" : "문의 내용"}</h2></div>
              <p className={base.reportContent}>{viewing.message}</p>
            </section>

            <section>
              <div className={base.sectionHeading}><span>CONTACT</span><h2>문의자 정보</h2></div>
              <dl className={base.infoGrid}>
                <div><dt>{isBusiness ? "담당자" : "이름"}</dt><dd>{viewing.contact_name}</dd></div>
                <div><dt>문의 유형</dt><dd>{typeLabels[viewing.inquiry_type] || viewing.inquiry_type}</dd></div>
                {isBusiness && <div><dt>회사명 / 소속</dt><dd>{viewing.company_name || "-"}</dd></div>}
                <div><dt>연락처</dt><dd>{viewing.phone || "미입력"}</dd></div>
                <div><dt>로그인 제출</dt><dd>{viewing.user_id ? "로그인 계정" : "비회원"}</dd></div>
              </dl>
              <a className={base.sourceLink} href={`mailto:${viewing.email}`}>
                <Mail aria-hidden="true" />
                <span><b>이메일로 답변하기</b><small>{viewing.email}</small></span>
                <ExternalLink aria-hidden="true" />
              </a>
            </section>

            {isBusiness && (
              <section>
                <div className={base.sectionHeading}><span>PROPOSAL</span><h2>제안서 첨부</h2></div>
                {viewing.attachment_path ? (
                  <div className={base.evidenceGrid}>
                    <a className={base.evidenceCard} href={attachmentUrl || undefined} target="_blank" rel="noreferrer" aria-disabled={!attachmentUrl}>
                      <span className={base.evidencePreview}><Paperclip aria-hidden="true" /></span>
                      <span><b>{viewing.attachment_name || "첨부 파일"}</b><small>{attachmentUrl ? `${formatBytes(viewing.attachment_size)} · 새 창에서 열기` : "보안 링크 생성 중..."}</small></span>
                      <ExternalLink aria-hidden="true" />
                    </a>
                  </div>
                ) : <p className={styles.noAttachment}>첨부된 제안서가 없습니다.</p>}
              </section>
            )}

            {!isBusiness && (
              <section>
                <div className={base.sectionHeading}><span>SUBMISSION</span><h2>접수 정보</h2></div>
                <dl className={base.infoGrid}>
                  <div><dt>접수일</dt><dd>{formatDate(viewing.created_at, true)}</dd></div>
                  <div><dt>접수 번호</dt><dd>{viewing.id.slice(0, 8).toUpperCase()}</dd></div>
                  <div><dt>접수 경로</dt><dd>{viewing.user_id ? "로그인 계정" : "비회원"}</dd></div>
                  <div><dt>개인정보 동의</dt><dd>동의 완료</dd></div>
                </dl>
              </section>
            )}

            <section>
              <div className={base.sectionHeading}><span>INTERNAL</span><h2>관리자 메모</h2></div>
              <textarea className={base.adminNote} rows={5} value={note} onChange={(event) => setNote(event.target.value)} placeholder="검토 내용과 후속 조치를 기록해 주세요." />
              <div className={base.noteActions}>
                <span>관리자만 볼 수 있는 내부 기록입니다.</span>
                <button type="button" disabled={saving || note === (viewing.admin_note || "")} onClick={() => void updateInquiry({ admin_note: note.trim() || null })}>메모 저장</button>
              </div>
            </section>
          </div>

          <footer className={base.statusBar}>
            <div><span>STATUS</span><b>처리 상태 변경</b><small>상태와 관리자 메모는 즉시 반영됩니다.</small></div>
            <div>{statuses.map((status) => (
              <button key={status.value} type="button" disabled={saving} className={viewing.status === status.value ? base.active : ""} onClick={() => void updateInquiry({ status: status.value })}>{status.label}</button>
            ))}</div>
          </footer>
        </article>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className={`${base.page} ${styles.fullPage}`}>
      {error && (
        <div className={`${base.error} ${styles.fullWidth}`} role="alert">
          <b>!</b><span>{error}</span>
          <button type="button" onClick={() => setError("")}>닫기</button>
        </div>
      )}

      <section className={`${base.summary} ${styles.fullWidth}`}>
        <div>
          <span className={base.summaryIcon}><Mail aria-hidden="true" /></span>
          <p><small>전체 문의</small><strong>{categoryCounts.general + categoryCounts.business}</strong></p>
        </div>
        <div className={styles.summaryTabs} data-tour-id="contact-category" role="tablist" aria-label="문의 구분">
          <button
            type="button"
            role="tab"
            aria-selected={category === "general"}
            className={category === "general" ? styles.active : ""}
            onClick={() => { setCategory("general"); setQuery(""); setFilter("all"); setPage(1); }}
          >
            <span>일반 문의</span><strong>{categoryCounts.general}</strong>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={category === "business"}
            className={category === "business" ? styles.active : ""}
            onClick={() => { setCategory("business"); setQuery(""); setFilter("all"); setPage(1); }}
          >
            <span>Business</span><strong>{categoryCounts.business}</strong>
          </button>
        </div>
        <p>{category === "business" ? "협업·광고·제휴 제안을 검토하고 담당자 응대 상태를 기록합니다." : "팬과 고객이 남긴 일반 문의를 확인하고 답변 상태를 기록합니다."}</p>
      </section>

      <section className={`${base.inbox} ${styles.fullWidth}`}>
        <header className={base.toolbar}>
          <div><h1>문의 접수함</h1><p>{category === "business" ? "Business" : "일반 문의"} · {total}건</p></div>
          <div className={base.filters} data-tour-id="contact-filters">
            <label className={base.search}>
              <Search aria-hidden="true" />
              <span className="sr-only">문의 검색</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 이메일, 회사명, 내용 검색" />
            </label>
            <CustomSelect ariaLabel="처리 상태 필터" value={filter} onChange={(value) => { setFilter(value); setPage(1); }} options={[{ value: "all", label: "모든 상태" }, ...statuses]} />
          </div>
        </header>

        <div className={base.tableWrap}>
          <table className={base.table}>
            <thead><tr><th>접수일</th><th>{category === "business" ? "회사 / 담당자" : "문의자"}</th><th>문의 내용</th><th>이메일</th><th>상태</th><th><span className="sr-only">보기</span></th></tr></thead>
            <tbody>{inquiries.map((inquiry) => (
              <tr key={inquiry.id} tabIndex={0} onClick={() => openInquiry(inquiry)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openInquiry(inquiry); }}>
                <td data-label="접수일">{formatDate(inquiry.created_at)}</td>
                <td data-label="문의자"><b>{inquiry.company_name || inquiry.contact_name}</b><small>{inquiry.company_name ? inquiry.contact_name : typeLabels[inquiry.inquiry_type]}</small></td>
                <td data-label="문의 내용"><b>{typeLabels[inquiry.inquiry_type] || "기타 문의"}</b><small>{inquiry.message}</small></td>
                <td data-label="이메일">{inquiry.email}</td>
                <td data-label="상태"><span className={`${base.status} ${statusClass(inquiry.status)}`}><i />{statusLabel(inquiry.status)}</span></td>
                <td><button type="button" data-tour-id="contact-open" tabIndex={-1}>열기 <span><ArrowRight aria-hidden="true" /></span></button></td>
              </tr>
            ))}</tbody>
          </table>
          {!inquiries.length && (
            <div className={base.empty}>
              <Inbox aria-hidden="true" />
              <b>{total ? "조건에 맞는 문의가 없습니다." : "아직 접수된 문의가 없습니다."}</b>
              <span>{total ? "검색어나 상태 필터를 바꿔 보세요." : "새 문의가 접수되면 이곳에 표시됩니다."}</span>
            </div>
          )}
        </div>
        {totalPages > 1 && <nav className={base.pagination} aria-label="문의 페이지">
          <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>이전</button>
          <span>{page} / {totalPages}</span>
          <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>다음</button>
        </nav>}
      </section>
    </div>
  );
}
