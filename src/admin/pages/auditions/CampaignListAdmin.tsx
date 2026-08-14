"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Inbox, Plus, Trash2 } from "lucide-react";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import { deleteAdminAssets } from "@/admin/utils/delete-admin-assets";
import { supabase } from "@/core/supabase/client";
import { type AuditionCampaign } from "@/core/auditions/types";
import { blankField, campaignPeriod } from "./CampaignAdminShared";

export function CampaignListAdmin() {
  const requestConfirm = useAdminConfirm();
  const [campaigns, setCampaigns] = useState<AuditionCampaign[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteCampaign, setDeleteCampaign] = useState<AuditionCampaign | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    let active = true;
    void Promise.all([
      supabase
        .from("audition_campaigns")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("audition_submissions").select("campaign_id"),
    ])
      .then(
        ([
          { data, error: loadError },
          { data: submissions, error: submissionError },
        ]) => {
          if (!active) return;
          if (loadError || submissionError)
            setError(
              (loadError || submissionError)?.message ||
                "캠페인을 불러오지 못했습니다.",
            );
          else {
            setCampaigns((data ?? []) as AuditionCampaign[]);
            setSubmissionCounts(
              (submissions ?? []).reduce<Record<string, number>>(
                (counts, submission) => ({
                  ...counts,
                  [submission.campaign_id]:
                    (counts[submission.campaign_id] ?? 0) + 1,
                }),
                {},
              ),
            );
          }
          setLoading(false);
        },
      )
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "캠페인을 불러오지 못했습니다.",
        );
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const create = async () => {
    setError("");
    const draftCampaignId = crypto.randomUUID();
    const fields = [
      {
        ...blankField(draftCampaignId, 0),
        field_key: "name",
        label_i18n: { ko: "이름", en: "Name", ja: "氏名" },
        required: true,
        is_primary_label: true,
      },
      {
        ...blankField(draftCampaignId, 1),
        field_key: "email",
        label_i18n: { ko: "이메일", en: "Email", ja: "メール" },
        required: true,
      },
    ];
    const { data, error: createError } = await supabase.rpc(
      "create_audition_campaign",
      {
        p_campaign: {
          title: "새 오디션",
          description: "",
          description_i18n: {},
          is_active: false,
        },
        p_fields: fields,
      },
    );
    if (createError || !data) {
      setError(createError?.message || "캠페인을 만들지 못했습니다.");
      return;
    }
    window.location.assign(`/admin/auditions/campaigns/${String(data)}/builder`);
  };
  const toggle = async (campaign: AuditionCampaign) => {
    if (
      !campaign.is_active &&
      !(await requestConfirm({
        title: "오디션을 활성화할까요?",
        description: `활성화하면 '${campaign.title}' 캠페인이 공개 페이지에 즉시 노출됩니다. 모집 기간과 지원 폼을 다시 확인해 주세요.`,
        confirmLabel: "활성화",
      }))
    )
      return;
    const { data, error: updateError } = await supabase
      .from("audition_campaigns")
      .update({ is_active: !campaign.is_active })
      .eq("id", campaign.id)
      .eq("updated_at", campaign.updated_at)
      .select("updated_at")
      .maybeSingle();
    if (updateError || !data) setError(updateError?.message || "다른 관리자가 이미 수정했습니다. 새로고침 후 다시 시도하세요.");
    else
      setCampaigns((current) =>
        current.map((item) =>
          item.id === campaign.id
            ? { ...item, is_active: !item.is_active, updated_at: data.updated_at }
            : item,
        ),
      );
  };
  const remove = async () => {
    if (!deleteCampaign) return;
    const campaign = deleteCampaign;
    setError("");
    setDeleting(true);
    try {
      const { data: deleted, error: deleteError } = await supabase.rpc(
        "delete_audition_campaign",
        { p_campaign_id: campaign.id },
      );
      if (deleteError) {
        setError(deleteError.message);
        return;
      }
      const pathRow = (deleted as Array<{ attachment_paths?: unknown }> | null)?.[0];
      const paths = Array.isArray(pathRow?.attachment_paths)
        ? pathRow.attachment_paths.filter(
            (path): path is string => typeof path === "string",
          )
        : [];
      for (let index = 0; index < paths.length; index += 100) {
        if (
          !(await deleteAdminAssets(
            "audition-attachments",
            paths.slice(index, index + 100),
          ))
        ) {
          setError("지원서 첨부파일 일부를 삭제하지 못했습니다.");
          break;
        }
      }
      setCampaigns((current) =>
        current.filter((item) => item.id !== campaign.id),
      );
      setSubmissionCounts((current) => {
        const next = { ...current };
        delete next[campaign.id];
        return next;
      });
      setDeleteCampaign(null);
    } finally {
      setDeleting(false);
    }
  };
  return (
    <div className="audition-campaign-page">
      <header className="audition-campaign-heading">
        <div>
          <h1>캠페인 관리</h1>
          <p>캠페인별 지원서와 질문을 관리합니다.</p>
        </div>
        <button
          data-tour-id="audition-create"
          className="admin-btn admin-btn-primary"
          type="button"
          onClick={() => void create()}
        >
          <Plus aria-hidden="true" /> 새 캠페인
        </button>
      </header>
      {error && (
        <div className="hero-admin-alert is-error" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <AdminSkeleton variant="cards" className="min-h-[180px]" rows={3} />
      ) : (
        <div
          className="audition-campaign-list"
          data-tour-id="audition-campaign-list"
        >
          {campaigns.map((campaign) => (
            <article key={campaign.id}>
              <div>
                <span
                  className={`audition-session-badge ${campaign.is_active ? "is-open" : "is-closed"}`}
                >
                  {campaign.is_active ? "공개 중" : "비공개"}
                </span>
                <h2>{campaign.title}</h2>
                <p>{campaign.description || "소개 없음"}</p>
                <small>
                  {campaignPeriod(campaign)} · 지원{" "}
                  {submissionCounts[campaign.id] ?? 0}건
                </small>
              </div>
              <nav>
                <button
                  data-tour-id="audition-toggle"
                  type="button"
                  onClick={() => void toggle(campaign)}
                >
                  {campaign.is_active ? "비활성화" : "활성화"}
                </button>
                <Link
                  data-tour-id="audition-review"
                  href={`/admin/auditions/campaigns/${campaign.id}/submissions`}
                >
                  <span data-tour-id="audition-status-prerequisite">
                    <Inbox aria-hidden="true" /> 심사
                  </span>
                </Link>
                <Link
                  data-tour-id="audition-builder"
                  href={`/admin/auditions/campaigns/${campaign.id}/builder`}
                >
                  <span data-tour-id="audition-builder-prerequisite">
                    폼 편집
                  </span>
                </Link>
                <button
                  data-tour-id="audition-delete"
                  className="audition-campaign-delete"
                  type="button"
                  onClick={() => setDeleteCampaign(campaign)}
                >
                  <Trash2 aria-hidden="true" />
                  삭제
                </button>
              </nav>
            </article>
          ))}
        </div>
      )}
      {deleteCampaign && (
        <DeleteConfirmDialog
          title="오디션을 삭제할까요?"
          description="질문과 지원서 기록을 모두 삭제합니다. 삭제 후에는 복구할 수 없습니다."
          confirmValue={deleteCampaign.title}
          valueLabel="오디션 이름"
          busy={deleting}
          onCancel={() => setDeleteCampaign(null)}
          onConfirm={() => void remove()}
        />
      )}
    </div>
  );
}
