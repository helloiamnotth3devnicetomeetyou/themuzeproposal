import { Upload } from "lucide-react";
import {
  auditionTextareaRows,
  fieldLabel,
  type AuditionCampaign,
  type AuditionFieldType,
  type AuditionFormField,
  type LocalizedLabel,
} from "@/core/auditions/types";

export const FIELD_TYPES: Array<{ value: AuditionFieldType; label: string }> = [
  { value: "short_text", label: "짧은 답변" },
  { value: "long_text", label: "긴 답변" },
  { value: "select", label: "드롭다운" },
  { value: "radio", label: "단일 선택" },
  { value: "checkbox", label: "복수 선택" },
  { value: "date", label: "날짜" },
  { value: "file", label: "파일" },
  { value: "consent", label: "동의" },
];
export const FILE_PRESETS = [
  {
    label: "이미지",
    hint: "JPG · PNG · WEBP · GIF",
    types: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  { label: "영상", hint: "MP4", types: ["video/mp4"] },
  { label: "음원", hint: "MP3", types: ["audio/mpeg"] },
  { label: "문서", hint: "PDF", types: ["application/pdf"] },
] as const;
export const ALL_FILE_TYPES = FILE_PRESETS.flatMap((preset) => [
  ...preset.types,
]);
export const REVIEW_STATUSES = [
  { value: "pending", label: "접수" },
  { value: "reviewing", label: "심사중" },
  { value: "accepted", label: "합격" },
  { value: "rejected", label: "불합격" },
];

export function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}
export function campaignPeriod(campaign: AuditionCampaign) {
  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat("ko-KR", {
          month: "short",
          day: "numeric",
        }).format(new Date(value))
      : null;
  const start = date(campaign.starts_at);
  const end = date(campaign.ends_at);
  return start && end
    ? `${start} — ${end}`
    : start
      ? `${start} 시작`
      : end
        ? `${end} 마감`
        : "기간 미설정";
}

export function blankField(
  campaignId: string,
  sortOrder: number,
): AuditionFormField {
  const id = crypto.randomUUID();
  return {
    id,
    campaign_id: campaignId,
    field_key: `field_${id.replaceAll("-", "")}`,
    label_i18n: { ko: "새 질문" },
    help_text: null,
    field_type: "short_text",
    options: [],
    required: false,
    max_length: 255,
    max_file_size_mb: null,
    accepted_file_types: [],
    sort_order: sortOrder,
    is_active: true,
    is_primary_label: false,
  };
}

export function attachmentPaths(rows: Array<{ answers?: unknown }>) {
  const paths = new Set<string>();
  for (const { answers } of rows) {
    if (!answers || typeof answers !== "object" || Array.isArray(answers))
      continue;
    for (const answer of Object.values(answers as Record<string, unknown>)) {
      if (
        answer &&
        typeof answer === "object" &&
        !Array.isArray(answer) &&
        typeof (answer as { path?: unknown }).path === "string"
      ) {
        paths.add((answer as { path: string }).path);
      }
    }
  }
  return [...paths];
}

export function FieldPreview({
  field,
  locale,
}: {
  field: AuditionFormField;
  locale: keyof LocalizedLabel;
}) {
  const label = fieldLabel(field, locale);
  const fileTypes = field.accepted_file_types.length
    ? field.accepted_file_types
    : ALL_FILE_TYPES;
  const fileHint = FILE_PRESETS.filter((preset) =>
    preset.types.some((type) => fileTypes.includes(type)),
  )
    .map((preset) => preset.hint)
    .join(" · ");
  return (
    <div className="audition-preview-field">
      <label>
        {label}
        {field.required && " *"}
      </label>
      {field.help_text && field.field_type !== "consent" && (
        <p>{field.help_text}</p>
      )}
      {field.field_type === "short_text" && (
        <input type="text" placeholder="답변을 입력하세요" disabled />
      )}
      {field.field_type === "long_text" && (
        <textarea
          rows={auditionTextareaRows(field.max_length)}
          placeholder="답변을 입력하세요"
          disabled
        />
      )}
      {field.field_type === "select" && (
        <select disabled defaultValue="">
          <option value="">선택하세요</option>
          {field.options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      )}
      {(field.field_type === "radio" || field.field_type === "checkbox") && (
        <div className="audition-preview-options">
          {field.options.length ? (
            field.options.map((option) => (
              <label key={option}>
                <input type={field.field_type} disabled />
                <span>{option}</span>
              </label>
            ))
          ) : (
            <span>선택지를 추가하세요.</span>
          )}
        </div>
      )}
      {field.field_type === "date" && <input type="date" disabled />}
      {field.field_type === "file" && (
        <div className="audition-preview-upload">
          <Upload aria-hidden="true" />
          <b>파일을 선택하거나 끌어놓으세요</b>
          <span>
            {fileHint} · 최대 {field.max_file_size_mb ?? 20}MB
          </span>
        </div>
      )}
      {field.field_type === "consent" && (
        <label className="audition-preview-consent">
          <input type="checkbox" disabled />
          <span>{field.help_text || label}</span>
        </label>
      )}
    </div>
  );
}
