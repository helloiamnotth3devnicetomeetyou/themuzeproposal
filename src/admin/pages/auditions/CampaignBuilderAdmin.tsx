"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import type { AdminLanguage } from "@/admin/components/content/AdminLanguageTabs";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import {
  type AuditionCampaign,
  type AuditionFormField,
} from "@/core/auditions/types";
import { supabase } from "@/core/supabase/client";
import { ALL_FILE_TYPES, blankField } from "./CampaignAdminShared";
import CampaignBuilderPreview from "./CampaignBuilderPreview";
import CampaignBuilderSettings from "./CampaignBuilderSettings";
import CampaignQuestionEditor from "./CampaignQuestionEditor";
import CampaignQuestionList from "./CampaignQuestionList";

export function CampaignBuilderAdmin({ campaignId }: { campaignId: string }) {
  const requestConfirm = useAdminConfirm();
  const [campaign, setCampaign] = useState<AuditionCampaign | null>(null);
  const [fields, setFields] = useState<AuditionFormField[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [language, setLanguage] = useState<AdminLanguage>("ko");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void Promise.all([
      supabase
        .from("audition_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single(),
      supabase
        .from("audition_form_fields")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("sort_order"),
    ]).then(([campaignResult, fieldResult]) => {
      if (campaignResult.data)
        setCampaign(campaignResult.data as AuditionCampaign);
      if (fieldResult.data) {
        const activeFields = (fieldResult.data as AuditionFormField[]).filter(
          (field) => field.is_active,
        );
        setFields(activeFields);
        setSelectedFieldId(activeFields[0]?.id ?? "");
      }
      setMessage(
        campaignResult.error?.message || fieldResult.error?.message || "",
      );
    });
  }, [campaignId]);

  const selectedField =
    fields.find((field) => field.id === selectedFieldId) ?? fields[0] ?? null;
  const patchCampaign = (patch: Partial<AuditionCampaign>) =>
    setCampaign((current) => (current ? { ...current, ...patch } : current));
  const setCampaignActive = async (active: boolean) => {
    if (
      active &&
      !(await requestConfirm({
        title: "오디션을 활성화할까요?",
        description:
          "저장하면 이 캠페인이 공개 페이지에 노출됩니다. 모집 기간과 질문을 다시 확인해 주세요.",
        confirmLabel: "활성화",
      }))
    )
      return;
    patchCampaign({ is_active: active });
  };
  const patchField = (id: string, patch: Partial<AuditionFormField>) =>
    setFields((current) =>
      current.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    );
  const setPrimaryLabel = (id: string, checked: boolean) =>
    setFields((current) =>
      current.map((field) => ({
        ...field,
        is_primary_label: field.id === id ? checked : false,
      })),
    );
  const toggleFilePreset = (types: readonly string[], checked: boolean) => {
    if (!selectedField) return;
    const current = selectedField.accepted_file_types.length
      ? selectedField.accepted_file_types
      : ALL_FILE_TYPES;
    const next = ALL_FILE_TYPES.filter((type) =>
      checked
        ? current.includes(type) || types.includes(type)
        : current.includes(type) && !types.includes(type),
    );
    if (next.length)
      patchField(selectedField.id, {
        accepted_file_types: next.length === ALL_FILE_TYPES.length ? [] : next,
      });
  };
  const remove = (id: string) => {
    const index = fields.findIndex((field) => field.id === id);
    setFields((current) => current.filter((field) => field.id !== id));
    setRemoved((current) => [...current, id]);
    if (selectedFieldId === id)
      setSelectedFieldId(fields[index + 1]?.id ?? fields[index - 1]?.id ?? "");
  };
  const moveTo = (targetId: string) => {
    if (!dragging || dragging === targetId) return;
    setFields((current) => {
      const next = [...current];
      const from = next.findIndex((field) => field.id === dragging);
      const to = next.findIndex((field) => field.id === targetId);
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setDragging(null);
  };
  const save = async () => {
    const emailFields = fields.filter(
      (field) =>
        field.field_key === "email" || field.field_key === "applicant_email",
    );
    const invalidOptions = fields.some(
      (field) =>
        ["select", "radio", "checkbox"].includes(field.field_type) &&
        !field.options.length,
    );
    const invalidLabel = fields.some(
      (field) =>
        !field.label_i18n.ko?.trim() &&
        !field.label_i18n.en?.trim() &&
        !field.label_i18n.ja?.trim(),
    );
    if (
      !campaign?.title.trim() ||
      emailFields.length !== 1 ||
      emailFields[0].field_type !== "short_text" ||
      new Set(fields.map((field) => field.field_key)).size !== fields.length ||
      fields.filter((field) => field.is_primary_label).length !== 1 ||
      invalidOptions ||
      invalidLabel
    ) {
      setMessage(
        "제목, 이메일 질문, 대표 라벨 1개와 선택형 질문의 선택지를 확인해 주세요.",
      );
      return;
    }
    setSaving(true);
    setMessage("");
    const normalized = fields.map((field, index): AuditionFormField => ({
      id: field.id,
      campaign_id: field.campaign_id,
      field_key: field.field_key,
      label_i18n: field.label_i18n,
      help_text: field.help_text,
      field_type: field.field_type,
      options: field.options,
      required: field.required,
      max_length: field.max_length,
      max_file_size_mb: field.max_file_size_mb,
      accepted_file_types: field.accepted_file_types,
      sort_order: index,
      is_active: true,
      is_primary_label: field.is_primary_label,
    }));
    const { data, error } = await supabase.rpc(
      "save_audition_campaign_checked",
      {
        p_campaign: {
          id: campaignId,
          title: campaign.title.trim(),
          description:
            campaign.description_i18n?.ko?.trim() || campaign.description,
          description_i18n: campaign.description_i18n ?? {
            ko: campaign.description,
          },
          is_active: campaign.is_active,
          starts_at: campaign.starts_at
            ? new Date(campaign.starts_at).toISOString()
            : null,
          ends_at: campaign.ends_at
            ? new Date(campaign.ends_at).toISOString()
            : null,
        },
        p_fields: normalized,
        p_removed_ids: removed,
        p_expected_updated_at: campaign.updated_at,
      },
    );
    setMessage(error?.message || "저장했습니다.");
    if (!error) {
      setCampaign((current) =>
        current ? { ...current, updated_at: data } : current,
      );
      setFields(normalized);
      setRemoved([]);
    }
    setSaving(false);
  };

  if (!campaign)
    return message ? (
      <div className="audition-campaign-page">
        <div className="hero-admin-alert is-error" role="alert">
          {message}
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => window.location.reload()}
        >
          다시 시도
        </button>
      </div>
    ) : (
      <AdminSkeleton variant="workbench" className="min-h-[420px]" />
    );

  return (
    <div className="audition-campaign-page">
      <header className="audition-campaign-heading">
        <div>
          <Link href="/admin/auditions/campaigns" className="audition-back">
            <ArrowLeft aria-hidden="true" /> 캠페인 목록
          </Link>
          <h1>{campaign.title}</h1>
          <p>질문을 끌어 순서를 바꾸고 저장하세요.</p>
        </div>
        <nav>
          <Link
            className="admin-btn"
            href={`/admin/auditions/campaigns/${campaignId}/submissions`}
          >
            <span data-tour-id="audition-status-prerequisite">지원서 심사</span>
          </Link>
          <button
            data-tour-id="audition-save"
            className="admin-btn admin-btn-primary"
            type="button"
            disabled={saving}
            onClick={() => void save()}
          >
            <Save aria-hidden="true" /> {saving ? "저장 중…" : "저장"}
          </button>
        </nav>
      </header>
      {message && (
        <div className="hero-admin-alert" role="status">
          {message}
        </div>
      )}
      <div className="audition-builder-layout">
        <section className="audition-builder-editor">
          <CampaignBuilderSettings
            campaign={campaign}
            language={language}
            onLanguageChange={setLanguage}
            onPatchCampaign={patchCampaign}
            onSetActive={setCampaignActive}
          />
          <div className="audition-question-workbench">
            <CampaignQuestionList
              fields={fields}
              selectedFieldId={selectedField?.id ?? ""}
              dragging={dragging}
              onDragStart={setDragging}
              onMoveTo={moveTo}
              onSelectField={setSelectedFieldId}
              onRemoveField={remove}
              onAddField={() => {
                const field = blankField(campaignId, fields.length);
                setFields((current) => [...current, field]);
                setSelectedFieldId(field.id);
              }}
            />
            <CampaignQuestionEditor
              selectedField={selectedField}
              language={language}
              onPatchField={patchField}
              onSetPrimaryLabel={setPrimaryLabel}
              onToggleFilePreset={toggleFilePreset}
            />
          </div>
        </section>
        <CampaignBuilderPreview
          campaign={campaign}
          fields={fields}
          language={language}
        />
      </div>
    </div>
  );
}
