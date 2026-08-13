"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import FormField from "@/admin/components/content/FormField";
import AdminLanguageTabs, {
  type AdminLanguage,
} from "@/admin/components/content/AdminLanguageTabs";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import { supabase } from "@/core/supabase/client";
import {
  campaignDescription,
  type AuditionCampaign,
  type AuditionFormField,
} from "@/core/auditions/types";
import {
  ALL_FILE_TYPES,
  FIELD_TYPES,
  FILE_PRESETS,
  FieldPreview,
  blankField,
  localDateTime,
} from "./CampaignAdminShared";

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
    const { data, error } = await supabase.rpc("save_audition_campaign_checked", {
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
    });
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
          <AdminLanguageTabs
            activeLang={language}
            onChange={setLanguage}
            values={{
              ko: campaign.description_i18n?.ko ?? campaign.description,
              en: campaign.description_i18n?.en,
              ja: campaign.description_i18n?.ja,
            }}
          />
          <div className="audition-builder-settings">
            <label>
              캠페인 제목
              <input
                className="admin-input"
                value={campaign.title}
                onChange={(event) =>
                  patchCampaign({ title: event.target.value })
                }
              />
            </label>
            <div className="audition-campaign-description">
              <FormField
                activeLang={language}
                label="소개"
                type="textarea"
                valueKo={campaign.description_i18n?.ko ?? campaign.description}
                valueEn={campaign.description_i18n?.en ?? ""}
                valueJa={campaign.description_i18n?.ja ?? ""}
                onChangeKo={(value) =>
                  patchCampaign({
                    description: value,
                    description_i18n: {
                      ...campaign.description_i18n,
                      ko: value,
                    },
                  })
                }
                onChangeEn={(value) =>
                  patchCampaign({
                    description_i18n: {
                      ...campaign.description_i18n,
                      en: value,
                    },
                  })
                }
                onChangeJa={(value) =>
                  patchCampaign({
                    description_i18n: {
                      ...campaign.description_i18n,
                      ja: value,
                    },
                  })
                }
              />
            </div>
            <label>
              시작일
              <input
                className="admin-input"
                type="datetime-local"
                value={localDateTime(campaign.starts_at)}
                onChange={(event) =>
                  patchCampaign({ starts_at: event.target.value })
                }
              />
            </label>
            <label>
              마감일
              <input
                className="admin-input"
                type="datetime-local"
                value={localDateTime(campaign.ends_at)}
                onChange={(event) =>
                  patchCampaign({ ends_at: event.target.value })
                }
              />
            </label>
            <label className="audition-builder-check">
              <input
                type="checkbox"
                checked={campaign.is_active}
                onChange={(event) =>
                  void setCampaignActive(event.target.checked)
                }
              />{" "}
              공개 활성화
            </label>
          </div>
          <div className="audition-question-workbench">
            <aside className="audition-question-list">
              <header>
                <b>질문 목록</b>
                <span>{fields.length}</span>
              </header>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  data-tour-id="audition-question-sort"
                  className={`audition-question-item ${selectedField?.id === field.id ? "is-active" : ""}`}
                  draggable
                  onDragStart={() => setDragging(field.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => moveTo(field.id)}
                >
                  <GripVertical aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => setSelectedFieldId(field.id)}
                  >
                    <span>{index + 1}</span>
                    <b>
                      {field.label_i18n.ko ||
                        field.label_i18n.en ||
                        field.label_i18n.ja ||
                        field.field_key}
                    </b>
                  </button>
                  <button
                    type="button"
                    data-tour-id="audition-question-delete"
                    onClick={() => remove(field.id)}
                    aria-label="질문 삭제"
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              ))}
              <button
                className="audition-add-field-btn"
                data-tour-id="audition-question-add"
                type="button"
                onClick={() => {
                  const field = blankField(campaignId, fields.length);
                  setFields((current) => [...current, field]);
                  setSelectedFieldId(field.id);
                }}
              >
                <Plus aria-hidden="true" />{" "}
                <span data-tour-id="audition-builder-prerequisite">
                  질문 추가
                </span>
              </button>
            </aside>
            <div className="audition-question-form">
              {selectedField ? (
                <>
                  <header>
                    <div>
                      <h2>{selectedField.label_i18n.ko || "질문 설정"}</h2>
                      <p>언어 탭을 바꿔 각 언어의 질문을 입력하세요.</p>
                    </div>
                  </header>
                  <div className="audition-question-form-grid">
                    <div
                      className="audition-question-wide"
                      data-tour-id="audition-question-type"
                    >
                      <span className="audition-control-label">질문 유형</span>
                      <div className="audition-type-picker">
                        {FIELD_TYPES.map((type) => (
                          <button
                            type="button"
                            className={
                              selectedField.field_type === type.value
                                ? "is-active"
                                : ""
                            }
                            key={type.value}
                            onClick={() =>
                              patchField(selectedField.id, {
                                field_type: type.value,
                              })
                            }
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="audition-question-label">
                      <FormField
                        activeLang={language}
                        label="질문"
                        valueKo={selectedField.label_i18n.ko ?? ""}
                        valueEn={selectedField.label_i18n.en ?? ""}
                        valueJa={selectedField.label_i18n.ja ?? ""}
                        onChangeKo={(value) =>
                          patchField(selectedField.id, {
                            label_i18n: {
                              ...selectedField.label_i18n,
                              ko: value,
                            },
                          })
                        }
                        onChangeEn={(value) =>
                          patchField(selectedField.id, {
                            label_i18n: {
                              ...selectedField.label_i18n,
                              en: value,
                            },
                          })
                        }
                        onChangeJa={(value) =>
                          patchField(selectedField.id, {
                            label_i18n: {
                              ...selectedField.label_i18n,
                              ja: value,
                            },
                          })
                        }
                      />
                    </div>
                    <label className="audition-question-wide">
                      {selectedField.field_type === "consent"
                        ? "동의 문구 또는 약관 링크"
                        : "도움말"}
                      <input
                        className="admin-input"
                        value={selectedField.help_text ?? ""}
                        onChange={(event) =>
                          patchField(selectedField.id, {
                            help_text: event.target.value || null,
                          })
                        }
                      />
                    </label>
                    {(["select", "radio", "checkbox"] as string[]).includes(
                      selectedField.field_type,
                    ) && (
                      <label className="audition-question-wide">
                        선택지 (줄바꿈)
                        <textarea
                          className="admin-input"
                          value={selectedField.options.join("\n")}
                          onChange={(event) =>
                            patchField(selectedField.id, {
                              options: event.target.value
                                .split("\n")
                                .map((item) => item.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </label>
                    )}
                    {(selectedField.field_type === "short_text" ||
                      selectedField.field_type === "long_text") && (
                      <label>
                        최대 글자 수
                        <input
                          className="admin-input"
                          type="number"
                          min="1"
                          max="10000"
                          value={selectedField.max_length ?? ""}
                          onChange={(event) =>
                            patchField(selectedField.id, {
                              max_length: Number(event.target.value) || null,
                            })
                          }
                        />
                      </label>
                    )}
                    {selectedField.field_type === "file" && (
                      <>
                        <label>
                          파일당 최대 용량
                          <input
                            className="admin-input"
                            type="number"
                            min="1"
                            max="30"
                            value={selectedField.max_file_size_mb ?? 20}
                            onChange={(event) =>
                              patchField(selectedField.id, {
                                max_file_size_mb: Math.min(
                                  30,
                                  Number(event.target.value) || 20,
                                ),
                              })
                            }
                          />
                          <span>1~30MB 사이로 설정할 수 있습니다.</span>
                        </label>
                        <div className="audition-question-wide">
                          <span className="audition-control-label">
                            허용 파일 종류
                          </span>
                          <div className="audition-file-preset-chips">
                            {FILE_PRESETS.map((preset) => {
                              const checked = preset.types.every(
                                (type) =>
                                  !selectedField.accepted_file_types.length ||
                                  selectedField.accepted_file_types.includes(
                                    type,
                                  ),
                              );
                              return (
                                <label
                                  className={`audition-file-preset-chip ${checked ? "is-active" : ""}`}
                                  key={preset.label}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(event) =>
                                      toggleFilePreset(
                                        preset.types,
                                        event.target.checked,
                                      )
                                    }
                                  />
                                  <b>{preset.label}</b>
                                  <span>{preset.hint}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                    <label className="audition-builder-check">
                      <input
                        type="checkbox"
                        checked={selectedField.required}
                        onChange={(event) =>
                          patchField(selectedField.id, {
                            required: event.target.checked,
                          })
                        }
                      />{" "}
                      필수
                    </label>
                    <label className="audition-builder-check">
                      <input
                        type="checkbox"
                        checked={selectedField.is_primary_label}
                        onChange={(event) =>
                          setFields((current) =>
                            current.map((item) => ({
                              ...item,
                              is_primary_label:
                                item.id === selectedField.id
                                  ? event.target.checked
                                  : false,
                            })),
                          )
                        }
                      />{" "}
                      대표 라벨
                    </label>
                  </div>
                </>
              ) : (
                <p>질문을 추가해 주세요.</p>
              )}
            </div>
          </div>
        </section>
        <aside className="audition-builder-preview">
          <div className="audition-preview-toolbar">
            <b>지원서 미리보기</b>
          </div>
          <div className="audition-preview-paper">
            <header>
              <h2>{campaign.title}</h2>
              <p>{campaignDescription(campaign, language)}</p>
            </header>
            <div className="audition-preview-fields">
              {fields.map((field) => (
                <div className="audition-preview-select" key={field.id}>
                  <FieldPreview field={field} locale={language} />
                </div>
              ))}
            </div>
            <button type="button" disabled>
              제출 내용 검토
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
