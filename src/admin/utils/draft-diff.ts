export type DraftDiffKind = "change" | "add" | "delete" | "order";

export type DraftDiffItem = {
  kind: DraftDiffKind;
  field: string;
  before: string;
  after: string;
};

const DEFAULT_FIELD_LABELS: Record<string, string> = {
  id: "식별값",
  name: "이름",
  engName: "영문명",
  jaName: "일본어명",
  type: "유형",
  debutDate: "데뷔일",
  imageUrl: "대표 이미지",
  logoUrl: "로고",
  color: "대표 색상",
  descKo: "소개 (한국어)",
  descEn: "소개 (영어)",
  descJa: "소개 (일본어)",
  socialLinks: "공식 계정",
  isActive: "공개 상태",
  roleKo: "역할 (한국어)",
  roleEn: "역할 (영어)",
  roleJa: "역할 (일본어)",
  birth: "생년월일",
  mbti: "MBTI",
  bioKo: "프로필 소개 (한국어)",
  bioEn: "프로필 소개 (영어)",
  bioJa: "프로필 소개 (일본어)",
  eventDate: "일정 날짜",
  startTime: "시작 시간",
  category: "분류",
  title: "제목",
  titleKo: "제목 (한국어)",
  titleEn: "제목 (영어)",
  titleJa: "제목 (일본어)",
  descriptionKo: "설명 (한국어)",
  descriptionEn: "설명 (영어)",
  descriptionJa: "설명 (일본어)",
  location: "장소 (한국어)",
  locationEn: "장소 (영어)",
  locationJa: "장소 (일본어)",
  linkUrl: "관련 링크",
  isPublished: "공개 상태",
  sortOrder: "노출 순서",
  content: "내용",
  date: "게시일",
  published: "공개 상태",
  artist_id: "아티스트",
  title_ko: "제목 (한국어)",
  title_en: "제목 (영어)",
  title_ja: "제목 (일본어)",
  release_date: "발매일",
  cover_url: "커버 이미지",
  hero_image_url: "메인 이미지",
  typo_logo_url: "타이포 로고",
  spotify_id: "Spotify ID",
  youtube_url: "YouTube 링크",
  description_ko: "소개 (한국어)",
  description_en: "소개 (영어)",
  description_ja: "소개 (일본어)",
  is_published: "공개 상태",
  published_at: "공개 일시",
  sort_order: "노출 순서",
  tracks: "트랙",
  company: "회사 정보",
  history: "연혁",
  footer: "푸터",
  social: "소셜 채널",
  business: "비즈니스 자료",
};

const empty = (value: unknown) => value == null || value === "";

const display = (value: unknown) => {
  if (empty(value)) return "없음";
  if (typeof value === "boolean") return value ? "예" : "아니요";
  if (Array.isArray(value)) return `${value.length}개`;
  if (typeof value === "object") return "변경됨";
  const text = String(value);
  return text.length > 80 ? `${text.slice(0, 77)}…` : text;
};

const itemKey = (value: unknown) => {
  if (!value || typeof value !== "object") return JSON.stringify(value);
  const item = value as Record<string, unknown>;
  return String(item.id ?? item.key ?? item.slug ?? item.url ?? JSON.stringify(value));
};

export function buildDraftDiff(
  before: unknown,
  after: unknown,
  labels: Record<string, string> = {},
): DraftDiffItem[] {
  if (Array.isArray(before) && Array.isArray(after)) {
    if (JSON.stringify(before) === JSON.stringify(after)) return [];
    const beforeKeys = before.map(itemKey);
    const afterKeys = after.map(itemKey);
    const sameItems = beforeKeys.length === afterKeys.length && [...beforeKeys].sort().join("\0") === [...afterKeys].sort().join("\0");
    const kind: DraftDiffKind = sameItems && beforeKeys.join("\0") !== afterKeys.join("\0") ? "order" : after.length > before.length ? "add" : after.length < before.length ? "delete" : "change";
    return [{ kind, field: labels.$root || "목록", before: display(before), after: display(after) }];
  }
  const previous = before && typeof before === "object" ? before as Record<string, unknown> : {};
  const next = after && typeof after === "object" ? after as Record<string, unknown> : {};

  return [...new Set([...Object.keys(previous), ...Object.keys(next)])].flatMap((field) => {
    const from = previous[field];
    const to = next[field];
    if (JSON.stringify(from) === JSON.stringify(to)) return [];

    let kind: DraftDiffKind = empty(from) ? "add" : empty(to) ? "delete" : "change";
    if (Array.isArray(from) && Array.isArray(to)) {
      const fromKeys = from.map(itemKey);
      const toKeys = to.map(itemKey);
      if (fromKeys.length === toKeys.length && [...fromKeys].sort().join("\0") === [...toKeys].sort().join("\0") && fromKeys.join("\0") !== toKeys.join("\0")) kind = "order";
      else if (to.length > from.length) kind = "add";
      else if (to.length < from.length) kind = "delete";
    } else if (/order|sort/i.test(field)) {
      kind = "order";
    }

    return [{ kind, field: labels[field] || DEFAULT_FIELD_LABELS[field] || field, before: display(from), after: display(to) }];
  });
}

export function formatDraftPeek(items: DraftDiffItem[], limit = 6) {
  if (!items.length) return "변경된 입력값이 있습니다.";
  const visible = items.slice(0, limit).map((item) => `• ${item.field}: ${item.before} → ${item.after}`);
  if (items.length > limit) visible.push(`• 그 외 ${items.length - limit}개 변경`);
  return visible.join("\n");
}
