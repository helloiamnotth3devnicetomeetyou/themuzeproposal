"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LuArrowLeft,
  LuArrowRight,
  LuExternalLink,
  LuFileImage,
  LuInbox,
  LuLink,
  LuPaperclip,
  LuSearch,
  LuShieldCheck,
} from "react-icons/lu";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import CustomSelect from "@/core/components/form/CustomSelect";
import { supabase } from "@/core/supabase/client";
import styles from "./protect-admin.module.css";

type ReportStatus = "pending" | "reviewing" | "resolved" | "rejected";
type ReportAttachment = { file_path: string; file_name: string };
type ProtectReport = {
  id: string;
  reporter_email: string | null;
  report_type: string;
  title: string;
  content: string;
  platform: string;
  post_url: string;
  posted_at: string;
  author_name: string;
  post_ip: string | null;
  protect_report_attachments: ReportAttachment[];
  status: string;
  admin_note: string | null;
  created_at: string;
  artists: { name: string } | null;
};

const statuses: Array<{ value: ReportStatus; label: string }> = [
  { value: "pending", label: "접수" },
  { value: "reviewing", label: "검토 중" },
  { value: "resolved", label: "처리 완료" },
  { value: "rejected", label: "종결" },
];

const reportTypeLabels: Record<string, string> = {
  defamation: "명예훼손 · 허위 사실",
  harassment: "악성 댓글 · 비방",
  impersonation: "사칭 · 계정 도용",
  copyright: "저작권 · 콘텐츠 침해",
  privacy: "개인정보 노출",
  other: "기타",
};

const statusLabel = (status: string) => statuses.find((item) => item.value === status)?.label || "접수";
const statusClass = (status: string) => styles[`status_${status}`] || styles.status_pending;
const formatDate = (value: string, detail = false) => new Intl.DateTimeFormat("ko-KR", detail
  ? { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
  : { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
const isImage = (name: string) => /\.(?:jpe?g|png|webp|gif)$/i.test(name);

export default function ProtectAdminPage() {
  const [reports, setReports] = useState<ProtectReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<ProtectReport | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("protect_reports")
      .select("*, artists(name), protect_report_attachments(file_path, file_name)")
      .order("created_at", { ascending: false })
      .overrideTypes<ProtectReport[], { merge: false }>();
    if (fetchError) setError(fetchError.message);
    else setReports(data ?? []);
    setLoading(false);
  };

  useEffect(() => { void Promise.resolve().then(fetchReports); }, []);

  const openReport = (report: ProtectReport) => {
    setNote(report.admin_note || "");
    setSignedUrls({});
    setViewing(report);
  };

  useEffect(() => {
    if (!viewing?.protect_report_attachments.length) return;

    let active = true;
    const signEvidence = async () => {
      const pairs = await Promise.all(viewing.protect_report_attachments.map(async ({ file_path }) => {
        const { data } = await supabase.storage.from("protect-evidence").createSignedUrl(file_path, 900);
        return [file_path, data?.signedUrl || ""] as const;
      }));
      if (active) setSignedUrls(Object.fromEntries(pairs));
    };
    void signEvidence();
    return () => { active = false; };
  }, [viewing]);

  const filteredReports = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesStatus = filter === "all" || report.status === filter;
      const searchTarget = `${report.title} ${report.reporter_email || ""} ${report.author_name} ${report.platform} ${report.artists?.name || ""}`.toLowerCase();
      return matchesStatus && (!keyword || searchTarget.includes(keyword));
    });
  }, [filter, query, reports]);

  const updateReport = async (changes: Partial<Pick<ProtectReport, "status" | "admin_note">>) => {
    if (!viewing) return;
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase.from("protect_reports").update(changes).eq("id", viewing.id);
    if (updateError) setError(updateError.message);
    else {
      const updated = { ...viewing, ...changes };
      setViewing(updated);
      setReports((current) => current.map((report) => report.id === viewing.id ? updated : report));
    }
    setSaving(false);
  };

  if (loading) return <LoadingIndicator label="권익 보호 접수함을 불러오는 중…" className="min-h-[320px]" />;

  if (viewing) {
    return (
      <div className={`${styles.page} ${styles.detailPage}`}>
        <button type="button" className={styles.back} onClick={() => setViewing(null)}><LuArrowLeft aria-hidden="true" /> 접수 목록</button>
        {error && <div className={styles.error} role="alert"><b>!</b><span>{error}</span><button type="button" onClick={() => setError("")}>닫기</button></div>}

        <article className={styles.detailCard}>
          <header className={styles.detailHeader}>
            <span className={styles.detailIcon}><LuShieldCheck aria-hidden="true" /></span>
            <div><p>{reportTypeLabels[viewing.report_type] || "기타"}</p><h1>{viewing.title}</h1><small>{formatDate(viewing.created_at, true)} 접수 · {viewing.id.slice(0, 8).toUpperCase()}</small></div>
            <span className={`${styles.status} ${statusClass(viewing.status)}`}><i />{statusLabel(viewing.status)}</span>
          </header>

          <div className={styles.detailBody}>
            <section>
              <div className={styles.sectionHeading}><span>REPORT</span><h2>제보 내용</h2></div>
              <p className={styles.reportContent}>{viewing.content}</p>
            </section>

            <section>
              <div className={styles.sectionHeading}><span>SOURCE</span><h2>게시물 정보</h2></div>
              <dl className={styles.infoGrid}>
                <div><dt>보호 대상</dt><dd>{viewing.artists?.name || "-"}</dd></div>
                <div><dt>플랫폼</dt><dd>{viewing.platform}</dd></div>
                <div><dt>게시 일자</dt><dd>{formatDate(viewing.posted_at)}</dd></div>
                <div><dt>게시물 작성자</dt><dd>{viewing.author_name}</dd></div>
                <div><dt>게시물 IP</dt><dd>{viewing.post_ip || "미입력"}</dd></div>
                <div><dt>제보 계정</dt><dd>{viewing.reporter_email || "확인 불가"}</dd></div>
              </dl>
              <a className={styles.sourceLink} href={viewing.post_url} target="_blank" rel="noreferrer"><LuLink aria-hidden="true" /><span><b>원문 게시물 열기</b><small>{viewing.post_url}</small></span><LuExternalLink aria-hidden="true" /></a>
            </section>

            <section>
              <div className={styles.sectionHeading}><span>EVIDENCE</span><h2>첨부 자료</h2></div>
              <div className={styles.evidenceGrid}>
                {viewing.protect_report_attachments.map(({ file_path, file_name }) => {
                  const url = signedUrls[file_path];
                  return <a key={file_path} className={styles.evidenceCard} href={url || undefined} target="_blank" rel="noreferrer" aria-disabled={!url}>
                    <span className={styles.evidencePreview}>
                      {url && isImage(file_name)
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={url} alt="" />
                        : isImage(file_name) ? <LuFileImage aria-hidden="true" /> : <LuPaperclip aria-hidden="true" />}
                    </span>
                    <span><b>{file_name}</b><small>{url ? "새 창에서 원본 열기" : "보안 링크 생성 중…"}</small></span>
                    <LuExternalLink aria-hidden="true" />
                  </a>;
                })}
              </div>
            </section>

            <section>
              <div className={styles.sectionHeading}><span>INTERNAL</span><h2>관리자 메모</h2></div>
              <textarea className={styles.adminNote} rows={5} value={note} onChange={(event) => setNote(event.target.value)} placeholder="검토 내용과 후속 조치를 기록해 주세요." />
              <div className={styles.noteActions}><span>관리자만 볼 수 있는 내부 기록입니다.</span><button type="button" disabled={saving || note === (viewing.admin_note || "")} onClick={() => void updateReport({ admin_note: note.trim() || null })}>메모 저장</button></div>
            </section>
          </div>

          <footer className={styles.statusBar}>
            <div><span>STATUS</span><b>처리 상태 변경</b></div>
            <div>{statuses.map((status) => <button key={status.value} type="button" disabled={saving} className={viewing.status === status.value ? styles.active : ""} onClick={() => void updateReport({ status: status.value })}>{status.label}</button>)}</div>
          </footer>
        </article>
      </div>
    );
  }

  const pendingCount = reports.filter((report) => report.status === "pending").length;
  const reviewingCount = reports.filter((report) => report.status === "reviewing").length;

  return (
    <div className={styles.page}>
      {error && <div className={styles.error} role="alert"><b>!</b><span>{error}</span><button type="button" onClick={() => setError("")}>닫기</button></div>}
      <section className={styles.summary}>
        <div><span className={styles.summaryIcon}><LuShieldCheck aria-hidden="true" /></span><p><small>전체 제보</small><strong>{reports.length}</strong></p></div>
        <dl><div><dt>새 제보</dt><dd>{pendingCount}</dd></div><div><dt>검토 중</dt><dd>{reviewingCount}</dd></div></dl>
        <p>접수된 권익 침해 내용과 비공개 증거 자료를 확인하고 처리 상태를 기록합니다.</p>
      </section>

      <section className={styles.inbox}>
        <header className={styles.toolbar}>
          <div><h1>권익 보호 접수함</h1><p>{filteredReports.length}건의 제보</p></div>
          <div className={styles.filters}>
            <label className={styles.search}><LuSearch aria-hidden="true" /><span className="sr-only">제보 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제목, 아티스트, 작성자 검색" /></label>
            <CustomSelect ariaLabel="처리 상태 필터" value={filter} onChange={setFilter} options={[{ value: "all", label: "모든 상태" }, ...statuses]} />
          </div>
        </header>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>접수일</th><th>보호 대상</th><th>제보 내용</th><th>플랫폼</th><th>상태</th><th><span className="sr-only">보기</span></th></tr></thead>
            <tbody>{filteredReports.map((report) => <tr key={report.id} tabIndex={0} onClick={() => openReport(report)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openReport(report); }}>
              <td>{formatDate(report.created_at)}</td>
              <td><b>{report.artists?.name || "-"}</b><small>{reportTypeLabels[report.report_type] || "기타"}</small></td>
              <td><b>{report.title}</b><small>{report.author_name}</small></td>
              <td>{report.platform}</td>
              <td><span className={`${styles.status} ${statusClass(report.status)}`}><i />{statusLabel(report.status)}</span></td>
              <td><button type="button" tabIndex={-1}>열기 <span><LuArrowRight aria-hidden="true" /></span></button></td>
            </tr>)}</tbody>
          </table>
          {!filteredReports.length && <div className={styles.empty}><LuInbox aria-hidden="true" /><b>{reports.length ? "조건에 맞는 제보가 없습니다." : "아직 접수된 제보가 없습니다."}</b><span>{reports.length ? "검색어나 상태 필터를 바꿔 보세요." : "새 제보가 접수되면 이곳에 표시됩니다."}</span></div>}
        </div>
      </section>
    </div>
  );
}
