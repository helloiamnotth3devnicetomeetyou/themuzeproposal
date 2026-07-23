"use client";

import { useEffect, useMemo, useState } from "react";
import { LuArrowLeft, LuArrowRight, LuExternalLink, LuInbox, LuMail, LuPhone, LuSearch, LuUserRound } from "react-icons/lu";
import LoadingIndicator from "@/components/LoadingIndicator";
import CustomSelect from "@/components/ui/CustomSelect";
import { supabase } from "@/lib/supabase";

type AuditionStatus = "pending" | "reviewing" | "accepted" | "rejected";
type Submission = {
  id: string;
  name: string | null;
  email: string | null;
  contact: string | null;
  category: string | null;
  birth: string | null;
  gender: string | null;
  intro: string | null;
  link: string | null;
  status: string | null;
  created_at: string;
};

const statuses: Array<{ value: AuditionStatus; label: string }> = [
  { value: "pending", label: "접수" },
  { value: "reviewing", label: "검토 중" },
  { value: "accepted", label: "합격" },
  { value: "rejected", label: "불합격" },
];

const statusLabel = (status: string | null) => statuses.find((item) => item.value === status)?.label || "접수";
const statusClass = (status: string | null) => status && statuses.some((item) => item.value === status) ? `is-${status}` : "is-pending";
const formatDate = (value: string, detail = false) => new Intl.DateTimeFormat("ko-KR", detail ? { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" } : { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));

export default function AuditionsAdmin() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Submission | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchSubmissions = async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase.from("audition_submissions").select("*").order("created_at", { ascending: false });
    if (fetchError) setError(fetchError.message);
    else setSubmissions((data ?? []) as Submission[]);
    setLoading(false);
  };

  useEffect(() => { void Promise.resolve().then(fetchSubmissions); }, []);

  const filteredSubmissions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return submissions.filter((submission) => {
      const matchesStatus = filter === "all" || (submission.status || "pending") === filter;
      const matchesQuery = !keyword || `${submission.name || ""} ${submission.email || ""} ${submission.contact || ""} ${submission.category || ""}`.toLowerCase().includes(keyword);
      return matchesStatus && matchesQuery;
    });
  }, [filter, query, submissions]);

  const pendingCount = submissions.filter((submission) => !submission.status || submission.status === "pending").length;
  const reviewingCount = submissions.filter((submission) => submission.status === "reviewing").length;

  const updateStatus = async (id: string, status: AuditionStatus) => {
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase.from("audition_submissions").update({ status }).eq("id", id);
    if (updateError) setError(updateError.message);
    else {
      setSubmissions((current) => current.map((item) => item.id === id ? { ...item, status } : item));
      setViewing((current) => current?.id === id ? { ...current, status } : current);
    }
    setSaving(false);
  };

  if (loading) return <LoadingIndicator label="지원서 목록을 불러오는 중…" className="min-h-[320px] bg-[var(--bg-card)]" />;

  if (viewing) {
    return (
      <div className="audition-admin-page audition-admin-detail">
        <button type="button" className="audition-back" onClick={() => setViewing(null)}><LuArrowLeft aria-hidden="true" /> 지원서 목록</button>
        {error && <div className="hero-admin-alert is-error" role="alert"><b>!</b><span>{error}</span><button type="button" onClick={() => setError("")}>닫기</button></div>}
        <section className="audition-detail-card">
          <header className="audition-detail-header">
            <span className="audition-detail-avatar"><LuUserRound aria-hidden="true" /></span>
            <div><p>{viewing.category || "지원 분야 미지정"}</p><h2>{viewing.name || "이름 없음"}</h2><small>{formatDate(viewing.created_at, true)} 접수</small></div>
            <span className={`audition-status ${statusClass(viewing.status)}`}><i />{statusLabel(viewing.status)}</span>
          </header>

          <div className="audition-contact-strip">
            <a href={viewing.email ? `mailto:${viewing.email}` : undefined} aria-disabled={!viewing.email}><LuMail aria-hidden="true" /><span><small>이메일</small><b>{viewing.email || "미입력"}</b></span></a>
            <a href={viewing.contact ? `tel:${viewing.contact}` : undefined} aria-disabled={!viewing.contact}><LuPhone aria-hidden="true" /><span><small>연락처</small><b>{viewing.contact || "미입력"}</b></span></a>
          </div>

          <div className="audition-detail-body">
            <section>
              <div className="audition-section-heading"><h3>지원자 정보</h3></div>
              <dl className="audition-info-grid">
                <div><dt>지원 분야</dt><dd>{viewing.category || "-"}</dd></div>
                <div><dt>생년월일</dt><dd>{viewing.birth || "-"}</dd></div>
                <div><dt>성별</dt><dd>{viewing.gender || "-"}</dd></div>
                <div><dt>접수일</dt><dd>{formatDate(viewing.created_at)}</dd></div>
              </dl>
            </section>
            <section>
              <div className="audition-section-heading"><h3>자기소개</h3></div>
              <p className="audition-intro">{viewing.intro || "작성된 자기소개가 없습니다."}</p>
            </section>
            {viewing.link && <section>
              <div className="audition-section-heading"><h3>오디션 자료</h3></div>
              <a className="audition-media-link" href={viewing.link} target="_blank" rel="noreferrer"><span><LuExternalLink aria-hidden="true" /></span><div><b>첨부 링크 열기</b><small>{viewing.link}</small></div><em>새 창에서 보기 →</em></a>
            </section>}
          </div>

          <footer className="audition-status-bar">
            <div><span>STATUS</span><b>지원 상태 변경</b></div>
            <div>{statuses.map((status) => <button key={status.value} type="button" disabled={saving} className={(viewing.status || "pending") === status.value ? "is-active" : ""} onClick={() => void updateStatus(viewing.id, status.value)}>{status.label}</button>)}</div>
          </footer>
        </section>
      </div>
    );
  }

  return (
    <div className="audition-admin-page">
      {error && <div className="hero-admin-alert is-error" role="alert"><b>!</b><span>{error}</span><button type="button" onClick={() => setError("")}>닫기</button></div>}
      <section className="audition-inbox-summary">
        <div><span className="audition-summary-icon"><LuInbox aria-hidden="true" /></span><p><small>전체 지원서</small><strong>{submissions.length}</strong></p></div>
        <dl><div><dt>새 지원서</dt><dd>{pendingCount}</dd></div><div><dt>검토 중</dt><dd>{reviewingCount}</dd></div></dl>
        <p>지원자 정보와 첨부 자료를 확인하고<br />검토 상태를 기록할 수 있습니다.</p>
      </section>

      <section className="audition-inbox-panel">
        <header className="audition-inbox-toolbar">
          <div><h2>지원서 보관함</h2><p>{filteredSubmissions.length}개의 지원서</p></div>
          <div className="audition-inbox-filters">
            <label className="audition-search"><LuSearch aria-hidden="true" /><span className="sr-only">지원서 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 이메일, 지원 분야 검색" /></label>
            <CustomSelect ariaLabel="지원 상태 필터" value={filter} onChange={setFilter} options={[{ value: "all", label: "모든 상태" }, ...statuses]} />
          </div>
        </header>

        <div className="audition-table-wrap">
          <table className="audition-table">
            <thead><tr><th>접수일</th><th>지원자</th><th>지원 분야</th><th>연락처</th><th>상태</th><th><span className="sr-only">보기</span></th></tr></thead>
            <tbody>
              {filteredSubmissions.map((submission) => (
                <tr key={submission.id} tabIndex={0} onClick={() => setViewing(submission)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setViewing(submission); }}>
                  <td><span className="audition-date">{formatDate(submission.created_at)}</span></td>
                  <td><b>{submission.name || "이름 없음"}</b><small>{submission.email || "이메일 미입력"}</small></td>
                  <td>{submission.category || "-"}</td>
                  <td>{submission.contact || "-"}</td>
                  <td><span className={`audition-status ${statusClass(submission.status)}`}><i />{statusLabel(submission.status)}</span></td>
                  <td><button type="button" tabIndex={-1}>열기 <span><LuArrowRight aria-hidden="true" /></span></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredSubmissions.length && <div className="hero-admin-empty"><LuInbox aria-hidden="true" /><b>{submissions.length ? "조건에 맞는 지원서가 없습니다." : "아직 접수된 지원서가 없습니다."}</b><span>{submissions.length ? "검색어나 상태 필터를 바꿔 보세요." : "새 지원서가 접수되면 이곳에 표시됩니다."}</span></div>}
        </div>
      </section>
    </div>
  );
}
