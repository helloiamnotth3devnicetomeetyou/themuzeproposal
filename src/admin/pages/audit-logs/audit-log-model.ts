export type AuditOperation = "INSERT" | "UPDATE" | "DELETE";

export type AuditValues = Record<string, unknown>;

export type AuditLogRow = {
  id: number;
  occurred_at: string;
  actor_id: string | null;
  actor_email: string | null;
  operation: AuditOperation;
  table_name: string;
  record_id: string;
  record_label: string;
  changed_fields: string[];
  before_values: AuditValues | null;
  after_values: AuditValues | null;
  transaction_id: number | string;
};

export type AuditLogFilters = {
  fromDate: string;
  toDate: string;
  actor: string;
  tableName: string;
  operation: "" | AuditOperation;
  recordId: string;
};

export const EMPTY_AUDIT_FILTERS: AuditLogFilters = {
  fromDate: "",
  toDate: "",
  actor: "",
  tableName: "",
  operation: "",
  recordId: "",
};

export const AUDIT_TABLES = [
  "site_settings",
  "artists",
  "artist_members",
  "albums",
  "tracks",
  "notices",
  "artist_schedules",
  "artist_gallery",
  "artist_scenes",
  "artist_scene_members",
  "home_hero_slides",
  "contact_inquiries",
  "protect_reports",
  "audition_submissions",
  "profiles",
] as const;

const TABLE_LABELS: Record<string, string> = {
  site_settings: "사이트 설정",
  artists: "아티스트",
  artist_members: "멤버",
  albums: "앨범",
  tracks: "트랙",
  notices: "공지",
  artist_schedules: "일정",
  artist_gallery: "갤러리",
  artist_scenes: "아티스트 장면",
  artist_scene_members: "장면 멤버 영역",
  home_hero_slides: "메인 앨범",
  contact_inquiries: "문의",
  protect_reports: "권익 보호 신고",
  audition_submissions: "오디션 지원",
  profiles: "관리자 권한",
};

const FIELD_LABELS: Record<string, string> = {
  id: "ID",
  key: "설정 키",
  slug: "공개 경로",
  name: "이름",
  name_ko: "한국어 이름",
  name_en: "영문 이름",
  name_ja: "일문 이름",
  eng_name: "영문 이름",
  title: "제목",
  title_ko: "한국어 제목",
  title_en: "영문 제목",
  title_ja: "일문 제목",
  status: "상태",
  admin_note: "관리자 메모",
  notes: "관리자 메모",
  is_admin: "관리자 권한",
  is_active: "활성 상태",
  is_published: "공개 상태",
  published_at: "공개 시각",
  sort_order: "노출 순서",
  value: "설정 값",
  category: "분류",
  inquiry_type: "문의 유형",
  report_type: "신고 유형",
  artist_id: "아티스트 ID",
  album_id: "앨범 ID",
  member_id: "멤버 ID",
  scene_id: "장면 ID",
  event_date: "일정 날짜",
  start_time: "시작 시각",
  release_date: "발매일",
  track_number: "트랙 번호",
  is_title: "타이틀곡",
  color: "대표 색상",
  image_url: "이미지",
  logo_url: "로고",
  cover_url: "커버",
  hero_image_url: "히어로 이미지",
  link_url: "연결 주소",
};

export function tableLabel(tableName: string) {
  return TABLE_LABELS[tableName] ?? tableName;
}

export function fieldLabel(field: string) {
  return FIELD_LABELS[field] ?? field;
}

export function operationLabel(operation: AuditOperation) {
  if (operation === "INSERT") return "생성";
  if (operation === "DELETE") return "삭제";
  return "수정";
}

export function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "없음";
  if (typeof value === "boolean") return value ? "사용" : "사용 안 함";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export function auditFields(row: AuditLogRow) {
  const keys = row.changed_fields.length
    ? row.changed_fields
    : Array.from(new Set([
      ...Object.keys(row.before_values ?? {}),
      ...Object.keys(row.after_values ?? {}),
    ])).sort();

  return keys.map((field) => ({
    field,
    before: row.before_values?.[field],
    after: row.after_values?.[field],
  }));
}

