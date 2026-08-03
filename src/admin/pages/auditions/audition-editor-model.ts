// ─── Audition Form Field ─────────────────────────────────────────────────────

export type AuditionFieldType =
  | "text"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "file"
  | "page_break"; // 페이지 구분선

export type AuditionField = {
  id: string;
  type: AuditionFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // for select / radio / checkbox
  accept?: string;    // for file (e.g. "image/*,application/pdf")
  pageTitle?: string; // for page_break
};

// ─── Audition Status ─────────────────────────────────────────────────────────

export type AuditionStatus = "tba" | "open" | "closed" | "reviewing" | "done";

export const AUDITION_STATUS_OPTIONS: Array<{ value: AuditionStatus; label: string; description: string }> = [
  { value: "tba",       label: "TBA",    description: "공고 예정" },
  { value: "open",      label: "OPEN",   description: "접수 중" },
  { value: "closed",    label: "마감",   description: "접수 마감" },
  { value: "reviewing", label: "심사 중", description: "심사 진행 중" },
  { value: "done",      label: "완료",   description: "결과 발표" },
];

export const AUDITION_STATUS_LABEL: Record<AuditionStatus, string> = {
  tba:       "TBA",
  open:      "접수 중",
  closed:    "마감",
  reviewing: "심사 중",
  done:      "완료",
};

// ─── Audition Session (DB row) ────────────────────────────────────────────────

export type AuditionSession = {
  id: string;
  title: string;
  status: AuditionStatus;
  start_at: string | null;
  end_at: string | null;
  categories: string[];
  form_schema: AuditionField[];          // default / shared form
  category_forms: Record<string, AuditionField[]>; // per-category overrides
  created_at: string;
  updated_at: string;
};

// ─── Audition Draft (editable in admin) ──────────────────────────────────────

export type AuditionDraft = {
  title: string;
  status: AuditionStatus;
  start_at: string;
  end_at: string;
  categories: string[];
  form_schema: AuditionField[];          // default / shared form
  category_forms: Record<string, AuditionField[]>; // per-category overrides
};

export const EMPTY_AUDITION_DRAFT: AuditionDraft = {
  title: "오디션",
  status: "tba",
  start_at: "",
  end_at: "",
  categories: [],
  form_schema: [],
  category_forms: {},
};

// ─── Field Type Metadata ──────────────────────────────────────────────────────

export const FIELD_TYPE_OPTIONS: Array<{ value: AuditionFieldType; label: string }> = [
  { value: "text",       label: "단답형 텍스트" },
  { value: "textarea",   label: "장문형 텍스트" },
  { value: "select",     label: "드롭다운 선택" },
  { value: "radio",      label: "단일 선택 (라디오)" },
  { value: "checkbox",   label: "복수 선택 (체크박스)" },
  { value: "date",       label: "날짜" },
  { value: "file",       label: "파일 / 이미지 첨부" },
  { value: "page_break", label: "다음 페이지 구분선" },
];

export const FIELD_TYPE_BADGE: Record<AuditionFieldType, string> = {
  text:       "단답형",
  textarea:   "장문형",
  select:     "드롭다운",
  radio:      "단일 선택",
  checkbox:   "복수 선택",
  date:       "날짜",
  file:       "파일 첨부",
  page_break: "페이지 구분",
};

export const FIELD_HAS_OPTIONS: Record<AuditionFieldType, boolean> = {
  text:       false,
  textarea:   false,
  select:     true,
  radio:      true,
  checkbox:   true,
  date:       false,
  file:       false,
  page_break: false,
};

// ─── Submission (DB row) ──────────────────────────────────────────────────────

export type AuditionSubmission = {
  id: string;
  audition_id: string | null;
  user_id: string | null;
  name: string | null;
  email: string | null;
  contact: string | null;
  category: string | null;
  birth: string | null;
  gender: string | null;
  intro: string | null;
  link: string | null;
  answers: Record<string, string | string[]>;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Submission status (review side) ─────────────────────────────────────────

export type SubmissionStatus = "pending" | "reviewing" | "accepted" | "rejected";

export const SUBMISSION_STATUSES: Array<{ value: SubmissionStatus; label: string }> = [
  { value: "pending",   label: "접수" },
  { value: "reviewing", label: "검토 중" },
  { value: "accepted",  label: "합격" },
  { value: "rejected",  label: "불합격" },
];

export const submissionStatusLabel = (status: string | null): string =>
  SUBMISSION_STATUSES.find((s) => s.value === status)?.label ?? "접수";

export const submissionStatusClass = (status: string | null): string =>
  status && SUBMISSION_STATUSES.some((s) => s.value === status) ? `is-${status}` : "is-pending";
