"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import { loadAccountAvatarUrls } from "@/admin/utils/account-avatar";
import { fetchSignedFileUrl } from "@/admin/utils/signed-file-url";
import { supabase } from "@/core/supabase/client";
import styles from "@/styles/(admin)/pages/protect/protect-admin.module.css";
import ProtectReportDetail from "./ProtectReportDetail";
import ProtectReportList from "./ProtectReportList";
import {
  type ProtectReport,
  type ProtectReportRow,
  type ReportAttachment,
  type ReportFilter,
  type ReportStatus,
} from "./protect-types";

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

const statusLabel = (status: string) =>
  statuses.find((item) => item.value === status)?.label || "접수";
const statusClass = (status: string) =>
  styles[`status_${status}`] || styles.status_pending;
const formatDate = (value: string, detail = false) =>
  new Intl.DateTimeFormat(
    "ko-KR",
    detail
      ? {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      : { year: "numeric", month: "2-digit", day: "2-digit" },
  ).format(new Date(value));
const isImage = (name: string) => /.(?:jpe?g|png|webp|gif)$/i.test(name);
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
  const requestedFilter: ReportFilter =
    statuses.find((status) => status.value === searchParams.get("status"))
      ?.value ?? "all";
  const [filter, setFilter] = useState<ReportFilter>(requestedFilter);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    reviewing: 0,
  });
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [undoStatus, setUndoStatus] = useState<ReportStatus | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!undoStatus) return;
    const timer = window.setTimeout(() => {
      setUndoStatus(null);
      setToast("");
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [undoStatus]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    const keyword = searchTerm(debouncedQuery);
    const request = supabase
      .rpc(
        "get_admin_protect_reports",
        {
          p_status: filter === "all" ? null : filter,
          p_search: keyword || null,
        },
        { count: "exact" },
      )
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      .overrideTypes<ProtectReportRow[], { merge: false }>();
    const [{ data, count, error: fetchError }, pending, reviewing] =
      await Promise.all([
        request,
        supabase
          .from("protect_reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("protect_reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "reviewing"),
      ]);
    if (fetchError) setError(fetchError.message);
    else {
      const reportRows = (data ?? []) as unknown as ProtectReportRow[];
      const reportIds = reportRows.map((report) => report.id);
      const artistIds = [
        ...new Set(reportRows.map((report) => report.artist_id)),
      ];
      const [attachmentResult, artistResult] = await Promise.all([
        reportIds.length
          ? supabase
              .from("protect_report_attachments")
              .select("report_id,file_path,file_name")
              .in("report_id", reportIds)
          : Promise.resolve({ data: [], error: null }),
        artistIds.length
          ? supabase.from("artists").select("id,name").in("id", artistIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (attachmentResult.error || artistResult.error) {
        setError(
          attachmentResult.error?.message ||
            artistResult.error?.message ||
            "신고 정보를 불러오지 못했습니다.",
        );
        setLoading(false);
        return;
      }
      const attachmentsByReport = new Map<string, ReportAttachment[]>();
      for (const attachment of attachmentResult.data ?? []) {
        const current = attachmentsByReport.get(attachment.report_id) ?? [];
        current.push({
          file_path: attachment.file_path,
          file_name: attachment.file_name,
        });
        attachmentsByReport.set(attachment.report_id, current);
      }
      const artistsById = new Map(
        (artistResult.data ?? []).map((artist) => [
          artist.id,
          { name: artist.name },
        ]),
      );
      const nextReports = reportRows.map((report) => ({
        ...report,
        artists: artistsById.get(report.artist_id) ?? null,
        protect_report_attachments: attachmentsByReport.get(report.id) ?? [],
      }));
      setReports(nextReports);
      setTotal(count ?? 0);
      setStatusCounts({
        pending: pending.count ?? 0,
        reviewing: reviewing.count ?? 0,
      });
      setAvatarUrls(
        await loadAccountAvatarUrls(
          nextReports.map((report) => report.user_id),
        ),
      );
    }
    setLoading(false);
  }, [debouncedQuery, filter, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchReports();
    }, 0);
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
      const pairs = await Promise.all(
        viewing.protect_report_attachments.map(async ({ file_path }) => {
          const url = await fetchSignedFileUrl("protect-evidence", file_path);
          return [file_path, url] as const;
        }),
      );
      if (active) setSignedUrls(Object.fromEntries(pairs));
    };
    void signEvidence();
    return () => {
      active = false;
    };
  }, [viewing]);

  const updateReport = async (
    changes: Partial<Pick<ProtectReport, "status" | "admin_note">>,
  ) => {
    if (!viewing) return;
    setSaving(true);
    setError("");
    const { data, error: updateError } = await supabase.rpc(
      "review_protect_report",
      {
        p_report_id: viewing.id,
        p_status: changes.status ?? viewing.status,
        p_admin_note:
          changes.admin_note !== undefined
            ? changes.admin_note
            : viewing.admin_note,
        p_expected_updated_at: viewing.updated_at,
      },
    );
    const patch = Array.isArray(data) ? data[0] : data;
    if (updateError || !patch) {
      if (updateError?.code === "P0003") {
        setError(
          "다른 관리자가 먼저 수정했습니다. 최신 내용을 불러온 뒤 다시 저장해 주세요.",
        );
        setViewing(null);
        setUndoStatus(null);
        setToast("");
        void fetchReports();
      } else {
        setError(updateError?.message || "신고를 저장하지 못했습니다.");
      }
    } else {
      const updated = { ...viewing, ...patch };
      setViewing(updated);
      setReports((current) =>
        current.map((report) => (report.id === viewing.id ? updated : report)),
      );
      window.dispatchEvent(new Event("admin-inbox-changed"));
    }
    setSaving(false);
    return !updateError && Boolean(patch);
  };

  const changeStatus = async (status: ReportStatus) => {
    if (!viewing || status === viewing.status) return;
    if (
      ["resolved", "rejected"].includes(status) &&
      !(await confirm({
        title:
          status === "resolved"
            ? "처리 완료로 변경할까요?"
            : "신고를 종결할까요?",
        description: "처리 상태가 즉시 반영됩니다.",
        confirmLabel: "상태 변경",
      }))
    )
      return;
    const previousStatus = viewing.status as ReportStatus;
    if (!(await updateReport({ status }))) return;
    setUndoStatus(previousStatus);
    setToast("처리 상태를 변경했습니다.");
  };

  const undoLastStatus = async () => {
    if (!undoStatus) return;
    if (!(await updateReport({ status: undoStatus }))) return;
    setUndoStatus(null);
    setToast("이전 처리 상태로 되돌렸습니다.");
  };

  if (loading)
    return <AdminSkeleton variant="inbox" className="min-h-[320px]" rows={5} />;

  if (viewing) {
    return (
      <ProtectReportDetail
        viewing={viewing}
        avatarUrl={avatarUrls[viewing.user_id]}
        signedUrls={signedUrls}
        error={error}
        toast={toast}
        undoStatus={undoStatus}
        note={note}
        saving={saving}
        statuses={statuses}
        reportTypeLabels={reportTypeLabels}
        statusLabel={statusLabel}
        statusClass={statusClass}
        formatDate={formatDate}
        isImage={isImage}
        onBack={() => setViewing(null)}
        onClearError={() => setError("")}
        onUndoStatus={() => void undoLastStatus()}
        onNoteChange={setNote}
        onSaveNote={() => void updateReport({ admin_note: note.trim() || null })}
        onChangeStatus={(status) => void changeStatus(status)}
      />
    );
  }

  return (
    <ProtectReportList
      reports={reports}
      total={total}
      statusCounts={statusCounts}
      query={query}
      filter={filter}
      page={page}
      pageSize={PAGE_SIZE}
      error={error}
      statuses={statuses}
      reportTypeLabels={reportTypeLabels}
      statusLabel={statusLabel}
      statusClass={statusClass}
      formatDate={formatDate}
      onQueryChange={setQuery}
      onFilterChange={(value) => {
        setFilter(value);
        setPage(1);
      }}
      onPageChange={setPage}
      onOpenReport={openReport}
      onClearError={() => setError("")}
    />
  );
}
