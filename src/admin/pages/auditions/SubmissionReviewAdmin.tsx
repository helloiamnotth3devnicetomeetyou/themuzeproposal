"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import { AdminToast } from "@/admin/components/feedback/AdminFeedback";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import { loadAccountAvatarUrls } from "@/admin/utils/account-avatar";
import { fetchSignedFileUrl } from "@/admin/utils/signed-file-url";
import { supabase } from "@/core/supabase/client";
import {
  fieldLabel,
  type AuditionCampaign,
  type AuditionSubmission,
} from "@/core/auditions/types";
import { REVIEW_STATUSES } from "./CampaignAdminShared";

export function SubmissionReviewAdmin({ campaignId }: { campaignId: string }) {
  const confirm = useAdminConfirm();
  const [campaign, setCampaign] = useState<AuditionCampaign | null>(null);
  const [submissions, setSubmissions] = useState<AuditionSubmission[]>([]);
  const [selected, setSelected] = useState<AuditionSubmission | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [note, setNote] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [undoStatus, setUndoStatus] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const fetchSubmissions = async () => {
    const { data } = await supabase.rpc("get_admin_audition_submissions", {
      p_campaign_id: campaignId,
    });
    if (data) setSubmissions(data as AuditionSubmission[]);
  };
  useEffect(() => {
    let active = true;
    void Promise.all([
      supabase
        .from("audition_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single(),
      supabase.rpc("get_admin_audition_submissions", {
        p_campaign_id: campaignId,
      }),
    ]).then(async ([c, s]) => {
      if (!active) return;
      if (c.data) setCampaign(c.data as AuditionCampaign);
      if (s.data) {
        const next = s.data as AuditionSubmission[];
        setSubmissions(next);
        const urls = await loadAccountAvatarUrls(
          next.map((submission) => submission.user_id),
        );
        if (active) setAvatarUrls(urls);
      }
    });
    return () => {
      active = false;
    };
  }, [campaignId]);
  const filtered = useMemo(
    () =>
      submissions.filter(
        (item) =>
          (statusFilter === "all" || item.status === statusFilter) &&
          (!query.trim() ||
            JSON.stringify(item.answers)
              .toLowerCase()
              .includes(query.trim().toLowerCase())),
      ),
    [query, statusFilter, submissions],
  );
  useEffect(() => {
    if (!undoStatus) return;
    const timer = window.setTimeout(() => {
      setUndoStatus(null);
      setToast("");
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [undoStatus]);
  const open = async (submission: AuditionSubmission) => {
    setSelected(submission);
    setNote(submission.reviewer_notes || "");
    const files = Object.values(submission.answers).filter(
      (
        answer,
      ): answer is {
        path: string;
        name: string;
        size: number;
        mimeType: string;
      } =>
        typeof answer === "object" &&
        !Array.isArray(answer) &&
        "path" in answer,
    );
    const pairs = await Promise.all(
      files.map(
        async (file) =>
          [
            file.path,
            await fetchSignedFileUrl(
              "audition-attachments",
              file.path,
              file.name,
            ),
          ] as const,
      ),
    );
    setSigned(Object.fromEntries(pairs));
  };
  const applyStatus = async (status: string) => {
    if (!selected) return false;
    setSavingReview(true);
    const { data, error } = await supabase.rpc("review_audition_submission", {
      p_submission_id: selected.id,
      p_status: status,
      p_reviewer_notes: note.trim() || null,
      p_expected_updated_at: selected.updated_at,
    });
    setSavingReview(false);
    const patch = Array.isArray(data) ? data[0] : data;
    if (error || !patch) {
      if (error?.code === "P0003") {
        setToast(
          "다른 관리자가 먼저 수정했습니다. 최신 내용을 불러온 뒤 다시 저장해 주세요.",
        );
        setSelected(null);
        void fetchSubmissions();
      } else {
        setToast("저장하지 못했습니다.");
      }
      return false;
    }
    const next = { ...selected, ...patch } as AuditionSubmission;
    setSelected(next);
    setSubmissions((current) =>
      current.map((item) => (item.id === next.id ? next : item)),
    );
    window.dispatchEvent(new Event("admin-inbox-changed"));
    return true;
  };
  const update = async (status: string) => {
    if (!selected || status === selected.status) return;
    if (
      ["accepted", "rejected"].includes(status) &&
      !(await confirm({
        title:
          status === "accepted"
            ? "합격으로 변경할까요?"
            : "불합격으로 변경할까요?",
        description: "심사 결과와 담당자가 즉시 기록됩니다.",
        confirmLabel: "심사 결과 변경",
      }))
    )
      return;
    const previousStatus = selected.status;
    if (await applyStatus(status)) {
      setUndoStatus(previousStatus);
      setToast("심사 상태를 변경했습니다.");
    }
  };
  const saveNote = async () => {
    if (selected && (await applyStatus(selected.status)))
      setToast("심사 메모를 저장했습니다.");
  };
  const undo = async () => {
    if (!undoStatus) return;
    if (await applyStatus(undoStatus)) {
      setUndoStatus(null);
      setToast("이전 심사 상태로 되돌렸습니다.");
    }
  };
  if (selected) {
    const primary = selected.form_snapshot.find(
      (field) => field.is_primary_label,
    );
    const applicantName = primary
      ? String(selected.answers[primary.field_key] || "이름 없음")
      : "이름 없음";
    const emailField = selected.form_snapshot.find(
      (field) =>
        field.field_key === "email" || field.field_key === "applicant_email",
    );
    const applicantEmail = emailField
      ? String(selected.answers[emailField.field_key] || "이메일 없음")
      : "이메일 없음";
    const avatarUrl = selected.user_id
      ? avatarUrls[selected.user_id]
      : undefined;
    return (
      <div className="audition-campaign-page">
        <AdminToast
          message={toast}
          actionLabel={undoStatus ? "되돌리기" : undefined}
          onAction={undoStatus ? () => void undo() : undefined}
        />
        <button
          className="audition-back"
          type="button"
          onClick={() => setSelected(null)}
        >
          <ArrowLeft aria-hidden="true" /> 지원서 목록
        </button>
        <section className="audition-review-detail">
          <header>
            <div className="audition-review-identity">
              <span className="audition-review-avatar">
                {avatarUrl ? (
                  <AdminAssetImage
                    src={avatarUrl}
                    alt={`${applicantName} 아바타`}
                    sizes="56px"
                  />
                ) : (
                  <b aria-hidden="true">
                    {(
                      applicantEmail[0] ||
                      applicantName[0] ||
                      "A"
                    ).toUpperCase()}
                  </b>
                )}
              </span>
              <div>
                <small>{campaign?.title}</small>
                <h1>{applicantName}</h1>
                <p>{applicantEmail}</p>
              </div>
            </div>
            <span>
              {
                REVIEW_STATUSES.find((item) => item.value === selected.status)
                  ?.label
              }
            </span>
          </header>
          <dl>
            {selected.form_snapshot.map((field) => {
              const answer = selected.answers[field.field_key];
              const file =
                typeof answer === "object" &&
                !Array.isArray(answer) &&
                "path" in answer
                  ? answer
                  : null;
              return (
                <div key={field.id}>
                  <dt>{fieldLabel(field, "ko")}</dt>
                  <dd>
                    {file ? (
                      <a
                        href={signed[file.path] || undefined}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {file.name} <ExternalLink aria-hidden="true" />
                      </a>
                    ) : Array.isArray(answer) ? (
                      answer.join(", ")
                    ) : (
                      String(answer || "-")
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
          <label>
            심사 메모
            <textarea
              className="admin-input"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <button
            className="admin-btn admin-btn-secondary"
            type="button"
            disabled={
              savingReview || note.trim() === (selected.reviewer_notes || "")
            }
            onClick={() => void saveNote()}
          >
            <Save aria-hidden="true" /> {savingReview ? "저장 중" : "메모 저장"}
          </button>
          <footer data-tour-id="audition-status">
            {REVIEW_STATUSES.map((status) => (
              <button
                type="button"
                disabled={savingReview}
                className={selected.status === status.value ? "is-active" : ""}
                key={status.value}
                onClick={() => void update(status.value)}
              >
                {status.label}
              </button>
            ))}
          </footer>
        </section>
      </div>
    );
  }
  return (
    <div className="audition-campaign-page">
      <header className="audition-campaign-heading">
        <div>
          <Link href="/admin/auditions/campaigns" className="audition-back">
            <ArrowLeft aria-hidden="true" /> 캠페인 목록
          </Link>
          <p className="audition-review-breadcrumb">
            캠페인 목록 · {campaign?.title} · 지원서 심사
          </p>
          <h1>{campaign?.title || "지원서 심사"}</h1>
          <p>
            {filtered.length} / {submissions.length}개의 지원서
          </p>
        </div>
        <div className="audition-review-tools">
          <input
            className="admin-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="답변 검색"
          />
          <select
            className="admin-input"
            aria-label="심사 상태 필터"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">모든 상태</option>
            {REVIEW_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </header>
      <div className="audition-review-list">
        {filtered.map((submission) => {
          const primary = submission.form_snapshot.find(
            (field) => field.is_primary_label,
          );
          return (
            <button
              type="button"
              data-tour-id="audition-status-prerequisite"
              key={submission.id}
              onClick={() => void open(submission)}
            >
              <span>
                {new Date(submission.created_at).toLocaleDateString("ko-KR")}
              </span>
              <b>
                {primary
                  ? String(submission.answers[primary.field_key] || "이름 없음")
                  : submission.id.slice(0, 8)}
              </b>
              <em>
                {
                  REVIEW_STATUSES.find(
                    (item) => item.value === submission.status,
                  )?.label
                }
              </em>
            </button>
          );
        })}
        {!filtered.length && (
          <p className="audition-review-empty">
            조건에 맞는 지원서가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
