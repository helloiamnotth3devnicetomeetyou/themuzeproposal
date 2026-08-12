"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, FileImage, Inbox, Link, Paperclip, Search, ShieldCheck } from "lucide-react";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { AdminToast } from "@/admin/components/feedback/AdminFeedback";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import CustomSelect from "@/core/components/form/CustomSelect";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import { loadAccountAvatarUrls } from "@/admin/utils/account-avatar";
import { supabase } from "@/core/supabase/client";
import styles from "@/styles/(admin)/pages/protect/protect-admin.module.css";

type ReportStatus = "pending" | "reviewing" | "resolved" | "rejected";
type ReportAttachment = { file_path: string; file_name: string };
type ProtectReport = {
  id: string;
  user_id: string;
  artist_id: string;
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
type ProtectReportRow = Omit<ProtectReport, "artists" | "protect_report_attachments">;

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
const PAGE_SIZE = 20;
const searchTerm = (value: string) => value.trim().replace(/[%,_()]/g, " ");

export default function ProtectAdminPage() {
  const confirm = useAdminConfirm();
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<ProtectReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<ProtectReport | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const requestedFilter = statuses.find((status) => status.value === searchParams.get("status"))?.value ?? "all";
  const [filter, setFilter] = useState(requestedFilter);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState({ pending: 0, reviewing: 0 });
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [undoStatus, setUndoStatus] = useState<ReportStatus | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!undoStatus) return;
    const timer = window.setTimeout(() => { setUndoStatus(null); setToast(""); }, 6000);
    return () => window.clearTimeout(timer);
  }, [undoStatus]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    const keyword = searchTerm(debouncedQuery);
    const request = supabase
      .rpc("get_admin_protect_reports", {
        p_status: filter === "all" ? null : filter,
        p_search: keyword || null,
      }, { count: "exact" })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      .overrideTypes<ProtectReportRow[], { merge: false }>();
    const [{ data, count, error: fetchError }, pending, reviewing] = await Promise.all([
      request,
      supabase.from("protect_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("protect_reports").select("id", { count: "exact", head: true }).eq("status", "reviewing"),
    ]);
    if (fetchError) setError(fetchError.message);
    else {
      const reportRows = (data ?? []) as unknown as ProtectReportRow[];
      const reportIds = reportRows.map((report) => report.id);
      const artistIds = [...new Set(reportRows.map((report) => report.artist_id))];
      const [attachmentResult, artistResult] = await Promise.all([
        reportIds.length
          ? supabase.from("protect_report_attachments").select("report_id,file_path,file_name").in("report_id", reportIds)
          : Promise.resolve({ data: [], error: null }),
        artistIds.length
          ? supabase.from("artists").select("id,name").in("id", artistIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (attachmentResult.error || artistResult.error) {
        setError(attachmentResult.error?.message || artistResult.error?.message || "신고 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }
      const attachmentsByReport = new Map<string, ReportAttachment[]>();
      for (const attachment of attachmentResult.data ?? []) {
        const current = attachmentsByReport.get(attachment.report_id) ?? [];
        current.push({ file_path: attachment.file_path, file_name: attachment.file_name });
        attachmentsByReport.set(attachment.report_id, current);
      }
      const artistsById = new Map((artistResult.data ?? []).map((artist) => [artist.id, { name: artist.name }]));
      const nextReports = reportRows.map((report) => ({
        ...report,
        artists: artistsById.get(report.artist_id) ?? null,
        protect_report_attachments: attachmentsByReport.get(report.id) ?? [],
      }));
      setReports(nextReports);
      setTotal(count ?? 0);
      setStatusCounts({ pending: pending.count ?? 0, reviewing: reviewing.count ?? 0 });
      setAvatarUrls(await loadAccountAvatarUrls(nextReports.map((report) => report.user_id)));
    }
    setLoading(false);
  }, [debouncedQuery, filter, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedQuery(query); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchReports(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchReports]);

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
      window.dispatchEvent(new Event("admin-inbox-changed"));
    }
    setSaving(false);
  };

  const changeStatus = async (status: ReportStatus) => {
    if (!viewing || status === viewing.status) return;
    if (["resolved", "rejected"].includes(status) && !await confirm({ title: status === "resolved" ? "처리 완료로 변경할까요?" : "신고를 종결할까요?", description: "처리 상태가 즉시 반영됩니다.", confirmLabel: "상태 변경" })) return;
    setUndoStatus(viewing.status as ReportStatus);
    await updateReport({ status });
    setToast("처리 상태를 변경했습니다.");
  };

  const undoLastStatus = async () => {
    if (!undoStatus) return;
    await updateReport({ status: undoStatus });
    setUndoStatus(null);
    setToast("이전 처리 상태로 되돌렸습니다.");
  };

  if (loading) return <AdminSkeleton variant="inbox" className="min-h-[320px]" rows={5} />;

  if (viewing) {
    return (
      <div className={`${styles.page} ${styles.detailPage}`}>
        <AdminToast message={toast} actionLabel={undoStatus ? "되돌리기" : undefined} onAction={undoStatus ? () => void undoLastStatus() : undefined} />
        <button type="button" className={styles.back} onClick={() => setViewing(null)}><ArrowLeft aria-hidden="true" /> 접수 목록</button>
        {error && <div className={styles.error} role="alert"><b>!</b><span>{error}</span><button type="button" onClick={() => setError("")}>닫기</button></div>}

        <article className={styles.detailCard} data-tour-id="protect-workspace">
          <header className={styles.detailHeader}>
            <span className={styles.detailIcon}>{avatarUrls[viewing.user_id] ? <AdminAssetImage src={avatarUrls[viewing.user_id]} alt="제보자 아바타" sizes="56px" /> : <b aria-hidden="true">{(viewing.reporter_email?.[0] || "A").toUpperCase()}</b>}</span>
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
              <a className={styles.sourceLink} data-tour-id="protect-source" href={viewing.post_url} target="_blank" rel="noreferrer"><Link aria-hidden="true" /><span><b>원문 게시물 열기</b><small>{viewing.post_url}</small></span><ExternalLink aria-hidden="true" /></a>
            </section>

            <section data-tour-id="protect-evidence">
              <div className={styles.sectionHeading}><span>EVIDENCE</span><h2>첨부 자료</h2></div>
              <div className={styles.evidenceGrid}>
                {viewing.protect_report_attachments.map(({ file_path, file_name }) => {
                  const url = signedUrls[file_path];
                  return <a key={file_path} className={styles.evidenceCard} href={url || undefined} target="_blank" rel="noreferrer" aria-disabled={!url}>
                    <span className={styles.evidencePreview}>
                      {url && isImage(file_name)
                        ? <AdminAssetImage src={url} alt="" sizes="96px" />
                        : isImage(file_name) ? <FileImage aria-hidden="true" /> : <Paperclip aria-hidden="true" />}
                    </span>
                    <span><b>{file_name}</b><small>{url ? "새 창에서 원본 열기" : "보안 링크 생성 중…"}</small></span>
                    <ExternalLink aria-hidden="true" />
                  </a>;
                })}
              </div>
            </section>

            <section data-tour-id="protect-memo">
              <div className={styles.sectionHeading}><span>INTERNAL</span><h2>관리자 메모</h2></div>
              <textarea className={styles.adminNote} rows={5} value={note} onChange={(event) => setNote(event.target.value)} placeholder="검토 내용과 후속 조치를 기록해 주세요." />
              <div className={styles.noteActions}><span>관리자만 볼 수 있는 내부 기록입니다.</span><button type="button" disabled={saving || note === (viewing.admin_note || "")} onClick={() => void updateReport({ admin_note: note.trim() || null })}>메모 저장</button></div>
            </section>
          </div>

          <footer className={styles.statusBar} data-tour-id="protect-status">
            <div><span>STATUS</span><b>처리 상태 변경</b><small>상태와 관리자 메모는 즉시 반영됩니다.</small></div>
            <div>{statuses.map((status) => <button key={status.value} type="button" disabled={saving} className={viewing.status === status.value ? styles.active : ""} onClick={() => void changeStatus(status.value)}>{status.label}</button>)}</div>
          </footer>
        </article>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className={styles.page}>
      {error && <div className={styles.error} role="alert"><b>!</b><span>{error}</span><button type="button" onClick={() => setError("")}>닫기</button></div>}
      <section className={styles.summary}>
        <div><span className={styles.summaryIcon}><ShieldCheck aria-hidden="true" /></span><p><small>전체 제보</small><strong>{total}</strong></p></div>
        <dl><div><dt>새 제보</dt><dd>{statusCounts.pending}</dd></div><div><dt>검토 중</dt><dd>{statusCounts.reviewing}</dd></div></dl>
        <p>접수된 권익 침해 내용과 비공개 증거 자료를 확인하고 처리 상태를 기록합니다.</p>
      </section>

      <section className={styles.inbox}>
        <header className={styles.toolbar}>
          <div><h1>권익 보호 접수함</h1><p>{total}건의 제보</p></div>
          <div className={styles.filters} data-tour-id="protect-filters">
            <label className={styles.search} data-tour-id="protect-search"><Search aria-hidden="true" /><span className="sr-only">제보 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제목, 아티스트, 작성자 검색" /></label>
            <span data-tour-id="protect-status-filter"><CustomSelect ariaLabel="처리 상태 필터" value={filter} onChange={(value) => { setFilter(value); setPage(1); }} options={[{ value: "all", label: "모든 상태" }, ...statuses]} /></span>
          </div>
        </header>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>접수일</th><th>보호 대상</th><th>제보 내용</th><th>플랫폼</th><th>상태</th><th><span className="sr-only">보기</span></th></tr></thead>
            <tbody>{reports.map((report) => <tr key={report.id} tabIndex={0} onClick={() => openReport(report)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openReport(report); }}>
              <td data-label="접수일">{formatDate(report.created_at)}</td>
              <td data-label="보호 대상"><b>{report.artists?.name || "-"}</b><small>{reportTypeLabels[report.report_type] || "기타"}</small></td>
              <td data-label="제보 내용"><b>{report.title}</b><small>{report.author_name}</small></td>
              <td data-label="플랫폼">{report.platform}</td>
              <td data-label="상태"><span className={`${styles.status} ${statusClass(report.status)}`}><i />{statusLabel(report.status)}</span></td>
              <td><button type="button" data-tour-id="protect-open" tabIndex={-1}>열기 <span><ArrowRight aria-hidden="true" /></span></button></td>
            </tr>)}</tbody>
          </table>
          {!reports.length && <div className={styles.empty}><Inbox aria-hidden="true" /><b>{total ? "조건에 맞는 제보가 없습니다." : "아직 접수된 제보가 없습니다."}</b><span>{total ? "검색어나 상태 필터를 바꿔 보세요." : "새 제보가 접수되면 이곳에 표시됩니다."}</span></div>}
        </div>
        {totalPages > 1 && <nav className={styles.pagination} aria-label="신고 페이지">
          <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>이전</button>
          <span>{page} / {totalPages}</span>
          <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>다음</button>
        </nav>}
      </section>
    </div>
  );
}
