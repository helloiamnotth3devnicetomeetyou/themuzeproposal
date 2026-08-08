"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, GripVertical, Inbox, Plus, Save, Trash2, Upload } from "lucide-react";
import FormField from "@/admin/components/content/FormField";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { AdminToast } from "@/admin/components/feedback/AdminFeedback";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import { loadAccountAvatarUrls } from "@/admin/utils/account-avatar";
import { supabase } from "@/core/supabase/client";
import { auditionTextareaRows, campaignDescription, fieldLabel, type AuditionCampaign, type AuditionFieldType, type AuditionFormField, type AuditionSubmission, type LocalizedLabel } from "@/core/auditions/types";

const FIELD_TYPES: Array<{ value: AuditionFieldType; label: string }> = [
  { value: "short_text", label: "짧은 답변" }, { value: "long_text", label: "긴 답변" },
  { value: "select", label: "드롭다운" }, { value: "radio", label: "단일 선택" },
  { value: "checkbox", label: "복수 선택" }, { value: "date", label: "날짜" },
  { value: "file", label: "파일" }, { value: "consent", label: "동의" },
];
const FILE_PRESETS = [
  { label: "이미지", hint: "JPG · PNG · WEBP · GIF", types: ["image/jpeg", "image/png", "image/webp", "image/gif"] },
  { label: "영상", hint: "MP4", types: ["video/mp4"] },
  { label: "음원", hint: "MP3", types: ["audio/mpeg"] },
  { label: "문서", hint: "PDF", types: ["application/pdf"] },
] as const;
const ALL_FILE_TYPES = FILE_PRESETS.flatMap((preset) => [...preset.types]);
const REVIEW_STATUSES = [{ value: "pending", label: "접수" }, { value: "reviewing", label: "심사중" }, { value: "accepted", label: "합격" }, { value: "rejected", label: "불합격" }];

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function blankField(campaignId: string, sortOrder: number): AuditionFormField {
  const id = crypto.randomUUID();
  return { id, campaign_id: campaignId, field_key: `field_${id.replaceAll("-", "")}`, label_i18n: { ko: "새 질문" }, help_text: null, field_type: "short_text", options: [], required: false, max_length: 255, max_file_size_mb: null, accepted_file_types: [], sort_order: sortOrder, is_active: true, is_primary_label: false };
}

function FieldPreview({ field, locale }: { field: AuditionFormField; locale: keyof LocalizedLabel }) {
  const label = fieldLabel(field, locale);
  const fileTypes = field.accepted_file_types.length ? field.accepted_file_types : ALL_FILE_TYPES;
  const fileHint = FILE_PRESETS.filter((preset) => preset.types.some((type) => fileTypes.includes(type))).map((preset) => preset.hint).join(" · ");
  return <div className="audition-preview-field"><label>{label}{field.required && " *"}</label>{field.help_text && field.field_type !== "consent" && <p>{field.help_text}</p>}
    {field.field_type === "short_text" && <input type="text" placeholder="답변을 입력하세요" disabled />}
    {field.field_type === "long_text" && <textarea rows={auditionTextareaRows(field.max_length)} placeholder="답변을 입력하세요" disabled />}
    {field.field_type === "select" && <select disabled defaultValue=""><option value="">선택하세요</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select>}
    {(field.field_type === "radio" || field.field_type === "checkbox") && <div className="audition-preview-options">{field.options.length ? field.options.map((option) => <label key={option}><input type={field.field_type} disabled /><span>{option}</span></label>) : <span>선택지를 추가하세요.</span>}</div>}
    {field.field_type === "date" && <input type="date" disabled />}
    {field.field_type === "file" && <div className="audition-preview-upload"><Upload aria-hidden="true" /><b>파일을 선택하거나 끌어놓으세요</b><span>{fileHint} · 최대 {field.max_file_size_mb ?? 20}MB</span></div>}
    {field.field_type === "consent" && <label className="audition-preview-consent"><input type="checkbox" disabled /><span>{field.help_text || label}</span></label>}
  </div>;
}

export function CampaignListAdmin() {
  const requestConfirm = useAdminConfirm();
  const [campaigns, setCampaigns] = useState<AuditionCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void supabase.from("audition_campaigns").select("*").order("created_at", { ascending: false }).then(({ data, error: loadError }) => {
      if (!active) return;
      if (loadError) setError(loadError.message); else setCampaigns((data ?? []) as AuditionCampaign[]);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
  const create = async () => {
    setError("");
    const { data, error: createError } = await supabase.from("audition_campaigns").insert({ title: "새 오디션", description: "", description_i18n: {}, is_active: false }).select().single();
    if (createError || !data) { setError(createError?.message || "캠페인을 만들지 못했습니다."); return; }
    const fields = [
      { ...blankField(data.id, 0), field_key: "name", label_i18n: { ko: "이름", en: "Name", ja: "氏名" }, required: true, is_primary_label: true },
      { ...blankField(data.id, 1), field_key: "email", label_i18n: { ko: "이메일", en: "Email", ja: "メール" }, required: true },
    ];
    const { error: fieldError } = await supabase.from("audition_form_fields").insert(fields);
    if (fieldError) { setError(fieldError.message); return; }
    window.location.assign(`/admin/auditions/campaigns/${data.id}/builder`);
  };
  const toggle = async (campaign: AuditionCampaign) => {
    if (!campaign.is_active && !await requestConfirm({ title: "오디션을 활성화할까요?", description: `활성화하면 '${campaign.title}' 캠페인이 공개 페이지에 즉시 노출됩니다. 모집 기간과 지원 폼을 다시 확인해 주세요.`, confirmLabel: "활성화" })) return;
    const { error: updateError } = await supabase.from("audition_campaigns").update({ is_active: !campaign.is_active }).eq("id", campaign.id);
    if (updateError) setError(updateError.message); else setCampaigns((current) => current.map((item) => item.id === campaign.id ? { ...item, is_active: !item.is_active } : item));
  };
  return <div className="audition-campaign-page"><header className="audition-campaign-heading"><div><h1>캠페인 관리</h1><p>캠페인별 지원서와 질문을 관리합니다.</p></div><button data-tour-id="audition-create" className="admin-btn admin-btn-primary" type="button" onClick={() => void create()}><Plus aria-hidden="true" /> 새 캠페인</button></header>
    {error && <div className="hero-admin-alert is-error" role="alert">{error}</div>}
    {loading ? <AdminSkeleton variant="cards" className="min-h-[180px]" rows={3} /> : <div className="audition-campaign-list" data-tour-id="audition-campaign-list">{campaigns.map((campaign) => <article key={campaign.id}><div><span className={`audition-session-badge ${campaign.is_active ? "is-open" : "is-closed"}`}>{campaign.is_active ? "ACTIVE" : "DRAFT"}</span><h2>{campaign.title}</h2><p>{campaign.description || "소개 없음"}</p></div><nav><button data-tour-id="audition-toggle" type="button" onClick={() => void toggle(campaign)}>{campaign.is_active ? "비활성화" : "활성화"}</button><Link data-tour-id="audition-review" href={`/admin/auditions/campaigns/${campaign.id}/submissions`}><span data-tour-id="audition-status-prerequisite"><Inbox aria-hidden="true" /> 심사</span></Link><Link data-tour-id="audition-builder" href={`/admin/auditions/campaigns/${campaign.id}/builder`}><span data-tour-id="audition-builder-prerequisite">폼 편집</span></Link></nav></article>)}</div>}
  </div>;
}

export function CampaignBuilderAdmin({ campaignId }: { campaignId: string }) {
  const requestConfirm = useAdminConfirm();
  const [campaign, setCampaign] = useState<AuditionCampaign | null>(null);
  const [fields, setFields] = useState<AuditionFormField[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [previewLocale, setPreviewLocale] = useState<keyof LocalizedLabel>("ko");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { void Promise.all([
    supabase.from("audition_campaigns").select("*").eq("id", campaignId).single(),
    supabase.from("audition_form_fields").select("*").eq("campaign_id", campaignId).order("sort_order"),
  ]).then(([campaignResult, fieldResult]) => { if (campaignResult.data) setCampaign(campaignResult.data as AuditionCampaign); if (fieldResult.data) { const activeFields = (fieldResult.data as AuditionFormField[]).filter((field) => field.is_active); setFields(activeFields); setSelectedFieldId(activeFields[0]?.id ?? ""); } setMessage(campaignResult.error?.message || fieldResult.error?.message || ""); }); }, [campaignId]);
  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? fields[0] ?? null;
  const patchCampaign = (patch: Partial<AuditionCampaign>) => setCampaign((current) => current ? { ...current, ...patch } : current);
  const setCampaignActive = async (active: boolean) => {
    if (active && !await requestConfirm({ title: "오디션을 활성화할까요?", description: "저장하면 이 캠페인이 공개 페이지에 노출됩니다. 모집 기간과 질문을 다시 확인해 주세요.", confirmLabel: "활성화" })) return;
    patchCampaign({ is_active: active });
  };
  const patchField = (id: string, patch: Partial<AuditionFormField>) => setFields((current) => current.map((field) => field.id === id ? { ...field, ...patch } : field));
  const toggleFilePreset = (types: readonly string[], checked: boolean) => {
    if (!selectedField) return;
    const current = selectedField.accepted_file_types.length ? selectedField.accepted_file_types : ALL_FILE_TYPES;
    const next = ALL_FILE_TYPES.filter((type) => checked ? current.includes(type) || types.includes(type) : current.includes(type) && !types.includes(type));
    if (next.length) patchField(selectedField.id, { accepted_file_types: next.length === ALL_FILE_TYPES.length ? [] : next });
  };
  const remove = (id: string) => { const index = fields.findIndex((field) => field.id === id); setFields((current) => current.filter((field) => field.id !== id)); setRemoved((current) => [...current, id]); if (selectedFieldId === id) setSelectedFieldId(fields[index + 1]?.id ?? fields[index - 1]?.id ?? ""); };
  const moveTo = (targetId: string) => { if (!dragging || dragging === targetId) return; setFields((current) => { const next = [...current]; const from = next.findIndex((field) => field.id === dragging); const to = next.findIndex((field) => field.id === targetId); const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; }); setDragging(null); };
  const save = async () => {
    const emailField = fields.find((field) => field.field_key === "email" || field.field_key === "applicant_email");
    const invalidOptions = fields.some((field) => ["select", "radio", "checkbox"].includes(field.field_type) && !field.options.length);
    const invalidLabel = fields.some((field) => !field.label_i18n.ko?.trim() && !field.label_i18n.en?.trim() && !field.label_i18n.ja?.trim());
    if (!campaign?.title.trim() || !emailField || emailField.field_type !== "short_text" || new Set(fields.map((field) => field.field_key)).size !== fields.length || fields.filter((field) => field.is_primary_label).length !== 1 || invalidOptions || invalidLabel) { setMessage("제목, 이메일 질문, 대표 라벨 1개와 선택형 질문의 선택지를 확인해 주세요."); return; }
    setSaving(true); setMessage("");
    const normalized = fields.map((field, index): AuditionFormField => ({ id: field.id, campaign_id: field.campaign_id, field_key: field.field_key, label_i18n: field.label_i18n, help_text: field.help_text, field_type: field.field_type, options: field.options, required: field.required, max_length: field.max_length, max_file_size_mb: field.max_file_size_mb, accepted_file_types: field.accepted_file_types, sort_order: index, is_active: true, is_primary_label: field.is_primary_label }));
    const results = await Promise.all([
      supabase.from("audition_campaigns").update({ title: campaign.title.trim(), description: campaign.description_i18n?.ko?.trim() || campaign.description, description_i18n: campaign.description_i18n ?? { ko: campaign.description }, is_active: campaign.is_active, starts_at: campaign.starts_at ? new Date(campaign.starts_at).toISOString() : null, ends_at: campaign.ends_at ? new Date(campaign.ends_at).toISOString() : null }).eq("id", campaignId),
      supabase.from("audition_form_fields").upsert(normalized),
      removed.length ? supabase.from("audition_form_fields").update({ is_active: false }).in("id", removed) : Promise.resolve({ error: null }),
    ]);
    const error = results.find((result) => result.error)?.error;
    setMessage(error?.message || "저장했습니다.");
    if (!error) { setFields(normalized); setRemoved([]); }
    setSaving(false);
  };
  if (!campaign) return message ? <div className="audition-campaign-page"><div className="hero-admin-alert is-error" role="alert">{message}</div><button type="button" className="admin-btn admin-btn-secondary" onClick={() => window.location.reload()}>다시 시도</button></div> : <AdminSkeleton variant="workbench" className="min-h-[420px]" />;
  return <div className="audition-campaign-page"><header className="audition-campaign-heading"><div><Link href="/admin/auditions/campaigns" className="audition-back"><ArrowLeft aria-hidden="true" /> 캠페인 목록</Link><h1>{campaign.title}</h1><p>질문을 끌어 순서를 바꾸고 저장하세요.</p></div><nav><Link className="admin-btn" href={`/admin/auditions/campaigns/${campaignId}/submissions`}><span data-tour-id="audition-status-prerequisite">지원서 심사</span></Link><button data-tour-id="audition-save" className="admin-btn admin-btn-primary" type="button" disabled={saving} onClick={() => void save()}><Save aria-hidden="true" /> {saving ? "저장 중…" : "저장"}</button></nav></header>
    {message && <div className="hero-admin-alert" role="status">{message}</div>}
    <div className="audition-builder-layout"><section className="audition-builder-editor">
      <div className="audition-builder-settings"><label>캠페인 제목<input className="admin-input" value={campaign.title} onChange={(event) => patchCampaign({ title: event.target.value })} /></label><div className="audition-campaign-description"><FormField label="소개" type="textarea" valueKo={campaign.description_i18n?.ko ?? campaign.description} valueEn={campaign.description_i18n?.en ?? ""} valueJa={campaign.description_i18n?.ja ?? ""} onChangeKo={(value) => patchCampaign({ description: value, description_i18n: { ...campaign.description_i18n, ko: value } })} onChangeEn={(value) => patchCampaign({ description_i18n: { ...campaign.description_i18n, en: value } })} onChangeJa={(value) => patchCampaign({ description_i18n: { ...campaign.description_i18n, ja: value } })} /></div><label>시작일<input className="admin-input" type="datetime-local" value={localDateTime(campaign.starts_at)} onChange={(event) => patchCampaign({ starts_at: event.target.value })} /></label><label>마감일<input className="admin-input" type="datetime-local" value={localDateTime(campaign.ends_at)} onChange={(event) => patchCampaign({ ends_at: event.target.value })} /></label><label className="audition-builder-check"><input type="checkbox" checked={campaign.is_active} onChange={(event) => void setCampaignActive(event.target.checked)} /> 공개 활성화</label></div>
      <div className="audition-question-workbench"><aside className="audition-question-list"><header><b>질문 목록</b><span>{fields.length}</span></header>{fields.map((field, index) => <div key={field.id} data-tour-id="audition-question-sort" className={`audition-question-item ${selectedField?.id === field.id ? "is-active" : ""}`} draggable onDragStart={() => setDragging(field.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveTo(field.id)}><GripVertical aria-hidden="true" /><button type="button" onClick={() => setSelectedFieldId(field.id)}><span>{index + 1}</span><b>{field.label_i18n.ko || field.label_i18n.en || field.label_i18n.ja || field.field_key}</b></button><button type="button" data-tour-id="audition-question-delete" onClick={() => remove(field.id)} aria-label="질문 삭제"><Trash2 aria-hidden="true" /></button></div>)}<button className="audition-add-field-btn" data-tour-id="audition-question-add" type="button" onClick={() => { const field = blankField(campaignId, fields.length); setFields((current) => [...current, field]); setSelectedFieldId(field.id); }}><Plus aria-hidden="true" /> <span data-tour-id="audition-builder-prerequisite">질문 추가</span></button></aside>
        <div className="audition-question-form">{selectedField ? <><header><div><h2>{selectedField.label_i18n.ko || "질문 설정"}</h2><p>언어 탭을 바꿔 각 언어의 질문을 입력하세요.</p></div></header><div className="audition-question-form-grid">
          <div className="audition-question-wide" data-tour-id="audition-question-type"><span className="audition-control-label">질문 유형</span><div className="audition-type-picker">{FIELD_TYPES.map((type) => <button type="button" className={selectedField.field_type === type.value ? "is-active" : ""} key={type.value} onClick={() => patchField(selectedField.id, { field_type: type.value })}>{type.label}</button>)}</div></div>
          <div className="audition-question-label"><FormField label="질문" valueKo={selectedField.label_i18n.ko ?? ""} valueEn={selectedField.label_i18n.en ?? ""} valueJa={selectedField.label_i18n.ja ?? ""} onChangeKo={(value) => patchField(selectedField.id, { label_i18n: { ...selectedField.label_i18n, ko: value } })} onChangeEn={(value) => patchField(selectedField.id, { label_i18n: { ...selectedField.label_i18n, en: value } })} onChangeJa={(value) => patchField(selectedField.id, { label_i18n: { ...selectedField.label_i18n, ja: value } })} /></div>
          <label className="audition-question-wide">{selectedField.field_type === "consent" ? "동의 문구 또는 약관 링크" : "도움말"}<input className="admin-input" value={selectedField.help_text ?? ""} onChange={(event) => patchField(selectedField.id, { help_text: event.target.value || null })} /></label>
          {(["select", "radio", "checkbox"] as string[]).includes(selectedField.field_type) && <label className="audition-question-wide">선택지 (줄바꿈)<textarea className="admin-input" value={selectedField.options.join("\n")} onChange={(event) => patchField(selectedField.id, { options: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} /></label>}
          {(selectedField.field_type === "short_text" || selectedField.field_type === "long_text") && <label>최대 글자 수<input className="admin-input" type="number" min="1" max="10000" value={selectedField.max_length ?? ""} onChange={(event) => patchField(selectedField.id, { max_length: Number(event.target.value) || null })} /></label>}
          {selectedField.field_type === "file" && <><label>파일당 최대 용량<input className="admin-input" type="number" min="1" max="100" value={selectedField.max_file_size_mb ?? 20} onChange={(event) => patchField(selectedField.id, { max_file_size_mb: Number(event.target.value) || 20 })} /><span>1~100MB 사이로 설정할 수 있습니다.</span></label><div className="audition-question-wide"><span className="audition-control-label">허용 파일 종류</span><div className="audition-file-preset-chips">{FILE_PRESETS.map((preset) => { const checked = preset.types.every((type) => !selectedField.accepted_file_types.length || selectedField.accepted_file_types.includes(type)); return <label className={`audition-file-preset-chip ${checked ? "is-active" : ""}`} key={preset.label}><input type="checkbox" checked={checked} onChange={(event) => toggleFilePreset(preset.types, event.target.checked)} /><b>{preset.label}</b><span>{preset.hint}</span></label>; })}</div></div></>}
          <label className="audition-builder-check"><input type="checkbox" checked={selectedField.required} onChange={(event) => patchField(selectedField.id, { required: event.target.checked })} /> 필수</label><label className="audition-builder-check"><input type="checkbox" checked={selectedField.is_primary_label} onChange={(event) => setFields((current) => current.map((item) => ({ ...item, is_primary_label: item.id === selectedField.id ? event.target.checked : false })))} /> 대표 라벨</label>
        </div></> : <p>질문을 추가해 주세요.</p>}</div></div>
    </section><aside className="audition-builder-preview"><div className="audition-preview-toolbar"><b>지원서 미리보기</b><div className="desk-lang-tabs" aria-label="미리보기 언어">{(["ko", "ja", "en"] as const).map((locale) => <button type="button" key={locale} className={previewLocale === locale ? "is-active" : ""} onClick={() => setPreviewLocale(locale)}>{locale === "ko" ? "KR" : locale === "ja" ? "JP" : "EN"}</button>)}</div></div><div className="audition-preview-paper"><header><h2>{campaign.title}</h2><p>{campaignDescription(campaign, previewLocale)}</p></header><div className="audition-preview-fields">{fields.map((field) => <div className="audition-preview-select" key={field.id}><FieldPreview field={field} locale={previewLocale} /></div>)}</div><button type="button" disabled>제출 내용 검토</button></div></aside></div>
  </div>;
}

export function SubmissionReviewAdmin({ campaignId }: { campaignId: string }) {
  const confirm = useAdminConfirm();
  const [campaign, setCampaign] = useState<AuditionCampaign | null>(null);
  const [submissions, setSubmissions] = useState<AuditionSubmission[]>([]);
  const [selected, setSelected] = useState<AuditionSubmission | null>(null);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [undoStatus, setUndoStatus] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    void Promise.all([supabase.from("audition_campaigns").select("*").eq("id", campaignId).single(), supabase.rpc("get_admin_audition_submissions", { p_campaign_id: campaignId })]).then(async ([c, s]) => {
      if (!active) return;
      if (c.data) setCampaign(c.data as AuditionCampaign);
      if (s.data) {
        const next = s.data as AuditionSubmission[];
        setSubmissions(next);
        const urls = await loadAccountAvatarUrls(next.map((submission) => submission.user_id));
        if (active) setAvatarUrls(urls);
      }
    });
    return () => { active = false; };
  }, [campaignId]);
  const filtered = useMemo(() => submissions.filter((item) => !query.trim() || JSON.stringify(item.answers).toLowerCase().includes(query.trim().toLowerCase())), [query, submissions]);
  useEffect(() => { if (!undoStatus) return; const timer = window.setTimeout(() => { setUndoStatus(null); setToast(""); }, 6000); return () => window.clearTimeout(timer); }, [undoStatus]);
  const open = async (submission: AuditionSubmission) => { setSelected(submission); setNote(submission.reviewer_notes || ""); const files = Object.values(submission.answers).filter((answer): answer is { path: string; name: string; size: number; mimeType: string } => typeof answer === "object" && !Array.isArray(answer) && "path" in answer); const pairs = await Promise.all(files.map(async (file) => [file.path, (await supabase.storage.from("audition-attachments").createSignedUrl(file.path, 900, { download: file.name })).data?.signedUrl || ""] as const)); setSigned(Object.fromEntries(pairs)); };
  const applyStatus = async (status: string) => { if (!selected) return; const { data: { user } } = await supabase.auth.getUser(); const patch = { status, reviewer_notes: note.trim() || null, reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() }; const { error } = await supabase.from("audition_submissions").update(patch).eq("id", selected.id); if (!error) { const next = { ...selected, ...patch } as AuditionSubmission; setSelected(next); setSubmissions((current) => current.map((item) => item.id === next.id ? next : item)); window.dispatchEvent(new Event("admin-inbox-changed")); } };
  const update = async (status: string) => { if (!selected || status === selected.status) return; if (["accepted", "rejected"].includes(status) && !await confirm({ title: status === "accepted" ? "합격으로 변경할까요?" : "불합격으로 변경할까요?", description: "심사 결과와 담당자가 즉시 기록됩니다.", confirmLabel: "심사 결과 변경" })) return; setUndoStatus(selected.status); await applyStatus(status); setToast("심사 상태를 변경했습니다."); };
  const undo = async () => { if (!undoStatus) return; await applyStatus(undoStatus); setUndoStatus(null); setToast("이전 심사 상태로 되돌렸습니다."); };
  if (selected) {
    const primary = selected.form_snapshot.find((field) => field.is_primary_label);
    const applicantName = primary ? String(selected.answers[primary.field_key] || "이름 없음") : "이름 없음";
    const emailField = selected.form_snapshot.find((field) => field.field_key === "email" || field.field_key === "applicant_email");
    const applicantEmail = emailField ? String(selected.answers[emailField.field_key] || "이메일 없음") : "이메일 없음";
    const avatarUrl = selected.user_id ? avatarUrls[selected.user_id] : undefined;
    return <div className="audition-campaign-page"><AdminToast message={toast} actionLabel={undoStatus ? "되돌리기" : undefined} onAction={undoStatus ? () => void undo() : undefined} /><button className="audition-back" type="button" onClick={() => setSelected(null)}><ArrowLeft aria-hidden="true" /> 지원서 목록</button><section className="audition-review-detail"><header><div className="audition-review-identity"><span className="audition-review-avatar">{avatarUrl ? <AdminAssetImage src={avatarUrl} alt={`${applicantName} 아바타`} sizes="56px" /> : <b aria-hidden="true">{(applicantEmail[0] || applicantName[0] || "A").toUpperCase()}</b>}</span><div><small>{campaign?.title}</small><h1>{applicantName}</h1><p>{applicantEmail}</p></div></div><span>{REVIEW_STATUSES.find((item) => item.value === selected.status)?.label}</span></header><dl>{selected.form_snapshot.map((field) => { const answer = selected.answers[field.field_key]; const file = typeof answer === "object" && !Array.isArray(answer) && "path" in answer ? answer : null; return <div key={field.id}><dt>{fieldLabel(field, "ko")}</dt><dd>{file ? <a href={signed[file.path] || undefined} target="_blank" rel="noreferrer">{file.name} <ExternalLink aria-hidden="true" /></a> : Array.isArray(answer) ? answer.join(", ") : String(answer || "-")}</dd></div>; })}</dl><label>심사 메모<textarea className="admin-input" value={note} onChange={(event) => setNote(event.target.value)} /></label><footer data-tour-id="audition-status">{REVIEW_STATUSES.map((status) => <button type="button" className={selected.status === status.value ? "is-active" : ""} key={status.value} onClick={() => void update(status.value)}>{status.label}</button>)}</footer></section></div>;
  }
  return <div className="audition-campaign-page"><header className="audition-campaign-heading"><div><Link href="/admin/auditions/campaigns" className="audition-back"><ArrowLeft aria-hidden="true" /> 캠페인 목록</Link><p className="audition-review-breadcrumb">캠페인 목록 · {campaign?.title} · 지원서 심사</p><h1>{campaign?.title || "지원서 심사"}</h1><p>{submissions.length}개의 지원서</p></div><input className="admin-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="답변 검색" /></header><div className="audition-review-list">{filtered.map((submission) => { const primary = submission.form_snapshot.find((field) => field.is_primary_label); return <button type="button" data-tour-id="audition-status-prerequisite" key={submission.id} onClick={() => void open(submission)}><span>{new Date(submission.created_at).toLocaleDateString("ko-KR")}</span><b>{primary ? String(submission.answers[primary.field_key] || "이름 없음") : submission.id.slice(0, 8)}</b><em>{REVIEW_STATUSES.find((item) => item.value === submission.status)?.label}</em></button>; })}</div></div>;
}
