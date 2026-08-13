export type LocalizedLabel = { ko?: string; en?: string; ja?: string };
export type AuditionFieldType =
  | "short_text"
  | "long_text"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "file"
  | "consent";

export type AuditionCampaign = {
  id: string;
  title: string;
  description: string;
  description_i18n: LocalizedLabel;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditionFormField = {
  id: string;
  campaign_id: string;
  field_key: string;
  label_i18n: LocalizedLabel;
  help_text: string | null;
  field_type: AuditionFieldType;
  options: string[];
  required: boolean;
  max_length: number | null;
  max_file_size_mb: number | null;
  accepted_file_types: string[];
  sort_order: number;
  is_active: boolean;
  is_primary_label: boolean;
};

export type AuditionAnswer =
  | string
  | string[]
  | { path: string; name: string; size: number; mimeType: string };
export type AuditionSubmission = {
  id: string;
  campaign_id: string;
  user_id: string | null;
  answers: Record<string, AuditionAnswer>;
  form_snapshot: AuditionFormField[];
  status: "pending" | "reviewing" | "accepted" | "rejected";
  reviewer_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export function isCampaignOpen(
  campaign: Pick<AuditionCampaign, "is_active" | "starts_at" | "ends_at">,
  now = Date.now(),
) {
  return (
    campaign.is_active &&
    (!campaign.starts_at || Date.parse(campaign.starts_at) <= now) &&
    (!campaign.ends_at || Date.parse(campaign.ends_at) >= now)
  );
}

export function auditionTextareaRows(maxLength: number | null) {
  return Math.min(12, Math.max(4, Math.ceil((maxLength ?? 5000) / 750) + 3));
}

export function fieldLabel(
  field: Pick<AuditionFormField, "field_key" | "label_i18n">,
  locale: string,
) {
  return (
    field.label_i18n[locale as keyof LocalizedLabel]?.trim() ||
    field.label_i18n.ko?.trim() ||
    field.label_i18n.en?.trim() ||
    field.label_i18n.ja?.trim() ||
    field.field_key
  );
}

export function campaignDescription(
  campaign: Pick<AuditionCampaign, "description" | "description_i18n">,
  locale: string,
) {
  return (
    campaign.description_i18n?.[locale as keyof LocalizedLabel]?.trim() ||
    campaign.description_i18n?.ko?.trim() ||
    campaign.description_i18n?.en?.trim() ||
    campaign.description_i18n?.ja?.trim() ||
    campaign.description.trim()
  );
}
