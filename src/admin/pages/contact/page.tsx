"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LuArrowLeft,
  LuArrowRight,
  LuBriefcaseBusiness,
  LuExternalLink,
  LuInbox,
  LuMail,
  LuMessageSquareText,
  LuPaperclip,
  LuSearch,
  LuUserRound,
} from "react-icons/lu";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
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

export default function ContactAdminPage() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ContactCategory>("general");
  const [viewing, setViewing] = useState<ContactInquiry | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [note, setNote] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchInquiries = async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("contact_inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .overrideTypes<ContactInquiry[], { merge: false }>();
    if (fetchError) setError(fetchError.message);
    else setInquiries(data ?? []);
    setLoading(false);
  };

  useEffect(() => { void Promise.resolve().then(fetchInquiries); }, []);

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

  const categoryInquiries = useMemo(
    () => inquiries.filter((inquiry) => inquiry.category === category),
    [category, inquiries],
  );

  const filteredInquiries = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return categoryInquiries.filter((inquiry) => {
      const matchesStatus = filter === "all" || inquiry.status === filter;
      const searchTarget = [
        inquiry.contact_name,
        inquiry.email,
        inquiry.phone || "",
        inquiry.company_name || "",
        inquiry.message,
        typeLabels[inquiry.inquiry_type] || inquiry.inquiry_type,
      ].join(" ").toLowerCase();
      return matchesStatus && (!keyword || searchTarget.includes(keyword));
    });
  }, [categoryInquiries, filter, query]);

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
    }
    setSaving(false);
  };

  if (loading) {
    return <LoadingIndicator label="문의 내역을 불러오는 중..." className="min-h-[320px]" />;
  }

  if (viewing) {
    const isBusiness = viewing.category === "business";
    return (
      <div className={`${base.page} ${base.detailPage}`}>
        <button type="button" className={base.back} onClick={() => setViewing(null)}>
          <LuArrowLeft aria-hidden="true" /> 문의 목록
        </button>
        {error && (
          <div className={base.error} role="alert">
            <b>!</b><span>{error}</span>
            <button type="button" onClick={() => setError("")}>닫기</button>
          </div>
        )}

        <article className={base.detailCard}>
          <header className={base.detailHeader}>
            <span className={base.detailIcon}>
              {isBusiness ? <LuBriefcaseBusiness aria-hidden="true" /> : <LuMessageSquareText aria-hidden="true" />}
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
                <LuMail aria-hidden="true" />
                <span><b>이메일로 답변하기</b><small>{viewing.email}</small></span>
                <LuExternalLink aria-hidden="true" />
              </a>
            </section>

            {isBusiness && (
              <section>
                <div className={base.sectionHeading}><span>PROPOSAL</span><h2>제안서 첨부</h2></div>
                {viewing.attachment_path ? (
                  <div className={base.evidenceGrid}>
                    <a className={base.evidenceCard} href={attachmentUrl || undefined} target="_blank" rel="noreferrer" aria-disabled={!attachmentUrl}>
                      <span className={base.evidencePreview}><LuPaperclip aria-hidden="true" /></span>
                      <span><b>{viewing.attachment_name || "첨부 파일"}</b><small>{attachmentUrl ? `${formatBytes(viewing.attachment_size)} · 새 창에서 열기` : "보안 링크 생성 중..."}</small></span>
                      <LuExternalLink aria-hidden="true" />
                    </a>
                  </div>
                ) : <p className={styles.noAttachment}>첨부된 제안서가 없습니다.</p>}
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
            <div><span>STATUS</span><b>처리 상태 변경</b></div>
            <div>{statuses.map((status) => (
              <button key={status.value} type="button" disabled={saving} className={viewing.status === status.value ? base.active : ""} onClick={() => void updateInquiry({ status: status.value })}>{status.label}</button>
            ))}</div>
          </footer>
        </article>
      </div>
    );
  }

  const currentPending = categoryInquiries.filter((item) => item.status === "pending").length;
  const currentReviewing = categoryInquiries.filter((item) => item.status === "reviewing").length;

  return (
    <div className={base.page}>
      {error && (
        <div className={base.error} role="alert">
          <b>!</b><span>{error}</span>
          <button type="button" onClick={() => setError("")}>닫기</button>
        </div>
      )}

      <section className={base.summary}>
        <div>
          <span className={base.summaryIcon}><LuMail aria-hidden="true" /></span>
          <p><small>전체 문의</small><strong>{inquiries.length}</strong></p>
        </div>
        <dl>
          <div><dt>신규 접수</dt><dd>{currentPending}</dd></div>
          <div><dt>검토 중</dt><dd>{currentReviewing}</dd></div>
        </dl>
        <p>일반 문의와 비즈니스 제안을 분리해 확인하고, 담당자가 답변 상태와 내부 메모를 관리합니다.</p>
      </section>

      <section className={base.inbox}>
        <div className={styles.categoryTabs} role="tablist" aria-label="문의 구분">
          <button type="button" role="tab" aria-selected={category === "general"} className={category === "general" ? styles.active : ""} onClick={() => { setCategory("general"); setQuery(""); setFilter("all"); }}>
            <LuUserRound aria-hidden="true" /><span>일반 문의</span><small>{inquiries.filter((item) => item.category === "general").length}</small>
          </button>
          <button type="button" role="tab" aria-selected={category === "business"} className={category === "business" ? styles.active : ""} onClick={() => { setCategory("business"); setQuery(""); setFilter("all"); }}>
            <LuBriefcaseBusiness aria-hidden="true" /><span>Business</span><small>{inquiries.filter((item) => item.category === "business").length}</small>
          </button>
        </div>

        <header className={base.toolbar}>
          <div><span>{category === "business" ? "BUSINESS" : "GENERAL"}</span><h1>{category === "business" ? "비즈니스 제안" : "일반 문의"}</h1><p>{filteredInquiries.length}건의 문의</p></div>
          <div className={base.filters}>
            <label className={base.search}>
              <LuSearch aria-hidden="true" />
              <span className="sr-only">문의 검색</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 이메일, 회사명, 내용 검색" />
            </label>
            <CustomSelect ariaLabel="처리 상태 필터" value={filter} onChange={setFilter} options={[{ value: "all", label: "모든 상태" }, ...statuses]} />
          </div>
        </header>

        <div className={base.tableWrap}>
          <table className={base.table}>
            <thead><tr><th>접수일</th><th>{category === "business" ? "회사 / 담당자" : "문의자"}</th><th>문의 내용</th><th>이메일</th><th>상태</th><th><span className="sr-only">보기</span></th></tr></thead>
            <tbody>{filteredInquiries.map((inquiry) => (
              <tr key={inquiry.id} tabIndex={0} onClick={() => openInquiry(inquiry)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openInquiry(inquiry); }}>
                <td>{formatDate(inquiry.created_at)}</td>
                <td><b>{inquiry.company_name || inquiry.contact_name}</b><small>{inquiry.company_name ? inquiry.contact_name : typeLabels[inquiry.inquiry_type]}</small></td>
                <td><b>{typeLabels[inquiry.inquiry_type] || "기타 문의"}</b><small>{inquiry.message}</small></td>
                <td>{inquiry.email}</td>
                <td><span className={`${base.status} ${statusClass(inquiry.status)}`}><i />{statusLabel(inquiry.status)}</span></td>
                <td><button type="button" tabIndex={-1}>열기 <span><LuArrowRight aria-hidden="true" /></span></button></td>
              </tr>
            ))}</tbody>
          </table>
          {!filteredInquiries.length && (
            <div className={base.empty}>
              <LuInbox aria-hidden="true" />
              <b>{categoryInquiries.length ? "조건에 맞는 문의가 없습니다." : "아직 접수된 문의가 없습니다."}</b>
              <span>{categoryInquiries.length ? "검색어나 상태 필터를 바꿔 보세요." : "새 문의가 접수되면 이곳에 표시됩니다."}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
