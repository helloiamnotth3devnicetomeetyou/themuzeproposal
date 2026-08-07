export type GuideRole = "super_admin" | "editor";
export type GuideRequirement = "artist" | "artist_scenes" | "artist_gallery";

export type GuideStep = {
  id: string;
  chapterId: string;
  title: string;
  controlLabel: string;
  purpose: string;
  outcome: string;
  caution?: string;
  href: string;
  target: string;
  fallbackTarget?: string;
  actionHint?: string;
  interaction?: { target: string; instruction: string };
  descendantPath?: boolean;
  tabEvent?: { name: "admin-profile-tab-change" | "admin-settings-tab-change"; detail: string };
  requires?: GuideRequirement;
  role?: GuideRole;
};

export type GuideChapter = { id: string; title: string; eyebrow: string; description: string };
export type GuideProgressRow = {
  chapter_id: string;
  furthest_step_id: string | null;
  completed_at: string | null;
};

export type GuideRun = { chapterId: string; index: number; mode: "full" | "chapter" };

export const parseGuideRun = (value: string | null): GuideRun | null => {
  try {
    const run = JSON.parse(value ?? "null") as Partial<GuideRun> | null;
    return run && typeof run.chapterId === "string" && Number.isInteger(run.index) && (run.mode === "full" || run.mode === "chapter")
      ? run as GuideRun
      : null;
  } catch {
    return null;
  }
};

export const guidePathMatches = (href: string, pathname: string, descendant = false) => {
  const expected = href.split("?")[0];
  return pathname === expected || descendant && pathname.startsWith(`${expected}/`);
};

export const GUIDE_CHAPTERS: GuideChapter[] = [
  { id: "0", title: "시작하기", eyebrow: "WELCOME", description: "전체 가이드를 순서대로 보거나 지금 필요한 업무만 골라 시작합니다." },
  { id: "1", title: "메인 노출", eyebrow: "HOME", description: "홈 화면에 표시할 앨범을 추가하고 순서를 정한 뒤 공개 상태로 저장합니다." },
  { id: "2", title: "아티스트 관리", eyebrow: "ARTIST", description: "아티스트 프로필부터 멤버, 앨범, 일정과 전용 공지까지 운영 흐름을 다룹니다." },
  { id: "3", title: "전체 공지", eyebrow: "NOTICE", description: "사이트 공통 공지를 작성하고 공개 상태를 관리하는 방법을 확인합니다." },
  { id: "4", title: "오디션", eyebrow: "AUDITION", description: "오디션 캠페인과 지원 질문을 만들고 접수된 지원서를 심사합니다." },
  { id: "5", title: "문의", eyebrow: "CONTACT", description: "일반 문의와 비즈니스 제안을 찾고 메모와 처리 상태를 기록합니다." },
  { id: "6", title: "권익 보호", eyebrow: "PROTECT", description: "권익 침해 신고의 원문과 증거를 검토하고 처리 과정을 남깁니다." },
  { id: "7", title: "변경 이력", eyebrow: "HISTORY", description: "관리자가 변경한 항목을 조건별로 찾고 변경 전후 값을 비교합니다." },
  { id: "8", title: "설정", eyebrow: "SETTINGS", description: "회사 정보와 공통 자료를 관리하고 슈퍼 관리자는 관리자 계정까지 관리합니다." },
  { id: "9", title: "검색 팁", eyebrow: "SEARCH", description: "검색창으로 관리 화면과 아티스트 업무를 빠르게 찾아 이동합니다." },
];

const page = "admin-page";
const fallback = { fallbackTarget: page };

export const GUIDE_STEPS: GuideStep[] = [
  { id: "1-refresh", chapterId: "1", title: "목록 새로고침", controlLabel: "새로고침", purpose: "서버의 최신 메인 노출 목록을 다시 불러옵니다.", outcome: "저장된 노출 목록과 앨범 상태가 화면에 다시 표시됩니다.", caution: "저장하지 않은 임시 순서는 유지되지 않을 수 있으므로 먼저 저장하세요.", href: "/admin/hero", target: "hero-refresh", ...fallback },
  { id: "1-add", chapterId: "1", title: "메인에 앨범 추가", controlLabel: "메인에 추가", purpose: "앨범 라이브러리의 앨범을 홈 슬라이드 목록에 넣습니다.", outcome: "임시 목록에 추가되며 상단 저장 전까지 공개 사이트에는 반영되지 않습니다.", href: "/admin/hero", target: "hero-add", ...fallback },
  { id: "1-reorder", chapterId: "1", title: "노출 순서 변경", controlLabel: "슬라이드 드래그", purpose: "카드를 끌어 홈 화면의 앨범 노출 순서를 정합니다.", outcome: "변경된 순서가 임시 작업으로 표시됩니다.", href: "/admin/hero", target: "hero-reorder", ...fallback },
  { id: "1-remove", chapterId: "1", title: "메인 노출에서 제거", controlLabel: "제거", purpose: "앨범 자체를 삭제하지 않고 홈 슬라이드 목록에서만 뺍니다.", outcome: "상단 저장 시 메인 노출에서 제외됩니다.", caution: "앨범과 트랙 데이터는 삭제되지 않습니다.", href: "/admin/hero", target: "hero-remove", ...fallback },
  { id: "1-restore", chapterId: "1", title: "임시 작업 복구", controlLabel: "복구", purpose: "브라우저에 자동 백업된 미저장 작업을 되살립니다.", outcome: "백업 시점의 순서와 항목이 편집 화면에 복원됩니다.", href: "/admin/hero", target: "draft-restore", ...fallback },
  { id: "1-save", chapterId: "1", title: "메인 노출 저장", controlLabel: "변경사항 저장", purpose: "추가·제거·정렬한 메인 노출 작업을 서버에 반영합니다.", outcome: "공개 홈 화면이 새 구성으로 갱신됩니다.", caution: "저장 확인창에서 변경 내역을 한 번 더 확인하세요.", href: "/admin/hero", target: "draft-save", ...fallback },

  { id: "2-create-next", chapterId: "2", title: "2-1. 다음 입력 단계", controlLabel: "다음", purpose: "현재 단계의 필수 입력을 확인하고 다음 프로필 입력 단계로 이동합니다.", outcome: "서버 저장 없이 다음 입력 단계가 열립니다.", href: "/admin/artists/new/profile", target: "profile-wizard-next", ...fallback },
  { id: "2-create-back", chapterId: "2", title: "2-1. 이전 입력 단계", controlLabel: "이전", purpose: "앞에서 입력한 아티스트 정보를 다시 확인합니다.", outcome: "입력값을 유지한 채 이전 단계가 열립니다.", href: "/admin/artists/new/profile", target: "profile-wizard-back", interaction: { target: "profile-wizard-next", instruction: "먼저 ‘다음’을 눌러 두 번째 입력 단계로 이동해 주세요." }, ...fallback },
  { id: "2-create", chapterId: "2", title: "2-1. 아티스트 생성", controlLabel: "아티스트 만들기", purpose: "필수 프로필 정보를 검증하고 새 아티스트를 생성합니다.", outcome: "아티스트가 저장되고 전체 관리 탭을 사용할 수 있게 됩니다.", caution: "영문명은 공개 경로에 사용되므로 저장 전에 철자를 확인하세요.", href: "/admin/artists/new/profile", target: "draft-save", ...fallback },
  { id: "2-profile-basic", chapterId: "2", title: "프로필 기본 정보", controlLabel: "기본 정보", purpose: "아티스트명과 식별 정보를 편집하는 탭을 엽니다.", outcome: "기본 정보 입력 영역이 표시됩니다.", href: "/admin/artists/:artistId/profile?tab=basic", target: "workbench-tab-basic", tabEvent: { name: "admin-profile-tab-change", detail: "basic" }, requires: "artist", ...fallback },
  { id: "2-profile-visual", chapterId: "2", title: "프로필 비주얼", controlLabel: "비주얼", purpose: "대표 이미지와 브랜드 색상을 편집하는 탭을 엽니다.", outcome: "비주얼 입력 영역이 표시됩니다.", href: "/admin/artists/:artistId/profile?tab=visual", target: "workbench-tab-visual", tabEvent: { name: "admin-profile-tab-change", detail: "visual" }, requires: "artist", ...fallback },
  { id: "2-profile-content", chapterId: "2", title: "프로필 소개", controlLabel: "소개", purpose: "다국어 아티스트 소개를 편집하는 탭을 엽니다.", outcome: "소개 입력 영역이 표시됩니다.", href: "/admin/artists/:artistId/profile?tab=content", target: "workbench-tab-content", tabEvent: { name: "admin-profile-tab-change", detail: "content" }, requires: "artist", ...fallback },
  { id: "2-profile-social", chapterId: "2", title: "프로필 공식 계정", controlLabel: "공식 계정", purpose: "공식 SNS 링크를 편집하는 탭을 엽니다.", outcome: "공식 계정 입력 영역이 표시됩니다.", href: "/admin/artists/:artistId/profile?tab=social", target: "workbench-tab-social", tabEvent: { name: "admin-profile-tab-change", detail: "social" }, requires: "artist", ...fallback },
  { id: "2-scene-import", chapterId: "2", title: "대표 이미지로 장면 만들기", controlLabel: "대표 이미지 가져오기", purpose: "프로필 대표 이미지를 인터랙티브 장면의 시작 이미지로 가져옵니다.", outcome: "편집 가능한 새 장면이 임시 목록에 추가됩니다.", href: "/admin/artists/:artistId/profile?tab=scenes", target: "scene-import", tabEvent: { name: "admin-profile-tab-change", detail: "scenes" }, requires: "artist_scenes", ...fallback },
  { id: "2-scene-add", chapterId: "2", title: "장면 이미지 추가", controlLabel: "장면 추가", purpose: "새 콘셉트 이미지를 업로드해 장면을 추가합니다.", outcome: "업로드 이미지가 임시 장면 목록에 추가됩니다.", href: "/admin/artists/:artistId/profile?tab=scenes", target: "scene-add", tabEvent: { name: "admin-profile-tab-change", detail: "scenes" }, requires: "artist_scenes", ...fallback },
  { id: "2-scene-apply", chapterId: "2", title: "장면 설정 적용", controlLabel: "장면 적용", purpose: "장면명, 링크, 대표·공개 상태 변경을 임시 작업에 적용합니다.", outcome: "상단 프로필 저장 시 서버에 함께 반영됩니다.", href: "/admin/artists/:artistId/profile?tab=scenes", target: "scene-apply", tabEvent: { name: "admin-profile-tab-change", detail: "scenes" }, requires: "artist_scenes", ...fallback },
  { id: "2-scene-outline", chapterId: "2", title: "멤버 영역 적용", controlLabel: "외곽선 적용", purpose: "이미지 위에서 그린 멤버 영역을 선택한 멤버와 연결합니다.", outcome: "공개 장면에서 해당 영역에 멤버 인터랙션이 생성됩니다.", caution: "최소 세 점 이상으로 닫힌 영역을 그려야 합니다.", href: "/admin/artists/:artistId/profile?tab=scenes", target: "scene-outline-apply", tabEvent: { name: "admin-profile-tab-change", detail: "scenes" }, requires: "artist_scenes", ...fallback },
  { id: "2-scene-mask", chapterId: "2", title: "정밀 마스크 적용", controlLabel: "정밀 마스크 덮어쓰기", purpose: "수동 외곽선 대신 준비된 마스크 이미지로 멤버 영역을 정밀하게 교체합니다.", outcome: "선택 멤버 영역의 마스크가 임시 작업에 반영됩니다.", href: "/admin/artists/:artistId/profile?tab=scenes", target: "scene-mask", tabEvent: { name: "admin-profile-tab-change", detail: "scenes" }, requires: "artist_scenes", ...fallback },
  { id: "2-scene-remove-region", chapterId: "2", title: "멤버 영역 제거", controlLabel: "멤버 영역 제거", purpose: "선택한 멤버의 외곽선과 마스크 연결을 제거합니다.", outcome: "상단 저장 시 해당 멤버 인터랙션이 사라집니다.", href: "/admin/artists/:artistId/profile?tab=scenes", target: "scene-region-delete", tabEvent: { name: "admin-profile-tab-change", detail: "scenes" }, requires: "artist_scenes", ...fallback },
  { id: "2-scene-delete", chapterId: "2", title: "장면 삭제", controlLabel: "삭제", purpose: "현재 장면 전체를 삭제 대상으로 표시합니다.", outcome: "확인 후 상단 저장 시 장면과 멤버 영역이 함께 삭제됩니다.", href: "/admin/artists/:artistId/profile?tab=scenes", target: "scene-delete", tabEvent: { name: "admin-profile-tab-change", detail: "scenes" }, requires: "artist_scenes", ...fallback },
  { id: "2-gallery-upload", chapterId: "2", title: "갤러리 업로드", controlLabel: "파일 선택", purpose: "아티스트 갤러리에 이미지를 여러 장 추가합니다.", outcome: "이미지가 임시 목록에 추가되고 상단 저장 시 반영됩니다.", href: "/admin/artists/:artistId/profile?tab=gallery", target: "gallery-upload", tabEvent: { name: "admin-profile-tab-change", detail: "gallery" }, requires: "artist_gallery", ...fallback },
  { id: "2-gallery-apply", chapterId: "2", title: "이미지 정보 적용", controlLabel: "정보 적용", purpose: "캡션, 앨범·멤버 분류와 공개 상태를 임시 작업에 적용합니다.", outcome: "상단 저장 시 이미지 분류 정보가 서버에 반영됩니다.", href: "/admin/artists/:artistId/profile?tab=gallery", target: "gallery-apply", tabEvent: { name: "admin-profile-tab-change", detail: "gallery" }, requires: "artist_gallery", ...fallback },
  { id: "2-gallery-delete", chapterId: "2", title: "갤러리 이미지 삭제", controlLabel: "삭제", purpose: "선택한 갤러리 이미지를 삭제 대상으로 표시합니다.", outcome: "상단 저장 시 이미지 파일과 분류 정보가 삭제됩니다.", href: "/admin/artists/:artistId/profile?tab=gallery", target: "gallery-delete", tabEvent: { name: "admin-profile-tab-change", detail: "gallery" }, requires: "artist_gallery", ...fallback },
  { id: "2-profile-publish", chapterId: "2", title: "프로필 공개 설정", controlLabel: "공개 설정", purpose: "프로필의 공개 여부를 관리하는 탭을 엽니다.", outcome: "공개 상태 입력 영역이 표시됩니다.", href: "/admin/artists/:artistId/profile?tab=publish", target: "workbench-tab-publish", tabEvent: { name: "admin-profile-tab-change", detail: "publish" }, requires: "artist", ...fallback },
  { id: "2-profile-preview", chapterId: "2", title: "프로필 미리보기", controlLabel: "미리보기", purpose: "저장 전 현재 입력값이 공개 프로필에서 어떻게 보이는지 확인합니다.", outcome: "별도 미리보기 화면이 열리며 공개 데이터는 바뀌지 않습니다.", href: "/admin/artists/:artistId/profile?tab=publish", target: "preview", tabEvent: { name: "admin-profile-tab-change", detail: "publish" }, requires: "artist", ...fallback },
  { id: "2-profile-save", chapterId: "2", title: "프로필 저장", controlLabel: "변경사항 저장", purpose: "프로필과 하위 갤러리·장면 임시 작업을 함께 저장합니다.", outcome: "연습 모드에서는 현재 화면에만 반영되고 종료하면 사라집니다.", href: "/admin/artists/:artistId/profile?tab=publish", target: "draft-save", tabEvent: { name: "admin-profile-tab-change", detail: "publish" }, requires: "artist", ...fallback },
  { id: "2-profile-delete", chapterId: "2", title: "아티스트 삭제", controlLabel: "삭제", purpose: "아티스트와 연결된 콘텐츠의 삭제를 준비합니다.", outcome: "연습 모드에서는 실제 데이터가 삭제되지 않습니다.", caution: "실제 업무에서는 연결된 멤버·앨범·일정에 영향을 주므로 최종 확인이 필요합니다.", href: "/admin/artists/:artistId/profile?tab=publish", target: "entity-delete", tabEvent: { name: "admin-profile-tab-change", detail: "publish" }, requires: "artist", ...fallback },

  { id: "2-member-create", chapterId: "2", title: "2-2. 멤버 추가", controlLabel: "첫 멤버 추가 / 새 멤버", purpose: "선택한 아티스트에 새 멤버 편집 초안을 만듭니다.", outcome: "정보 입력 후 저장할 수 있는 신규 멤버 화면이 열립니다.", href: "/admin/artists/:artistId/members", target: "entity-create", requires: "artist", ...fallback },
  { id: "2-member-tabs", chapterId: "2", title: "멤버 편집 탭", controlLabel: "기본 정보 · 프로필 · 소개 · 공식 계정 · 갤러리", purpose: "멤버 정보 종류별 편집 화면을 전환합니다.", outcome: "탭 사이에서 입력값이 임시 작업으로 유지됩니다.", href: "/admin/artists/:artistId/members", target: "workbench-tabs", requires: "artist", ...fallback },
  { id: "2-member-preview", chapterId: "2", title: "멤버 미리보기", controlLabel: "미리보기", purpose: "저장 전 멤버 공개 화면을 확인합니다.", outcome: "공개 데이터 변경 없이 미리보기 화면이 열립니다.", href: "/admin/artists/:artistId/members", target: "preview", requires: "artist", ...fallback },
  { id: "2-member-save", chapterId: "2", title: "멤버 저장", controlLabel: "변경사항 저장", purpose: "멤버 정보와 노출 순서 변경을 서버에 반영합니다.", outcome: "확인창 승인 후 공개 멤버 정보가 갱신됩니다.", href: "/admin/artists/:artistId/members", target: "draft-save", requires: "artist", ...fallback },
  { id: "2-member-delete", chapterId: "2", title: "멤버 삭제", controlLabel: "삭제", purpose: "현재 멤버를 삭제 대상으로 표시합니다.", outcome: "상단 저장 후 멤버가 삭제됩니다.", caution: "멤버가 연결된 장면 영역과 콘텐츠를 먼저 확인하세요.", href: "/admin/artists/:artistId/members", target: "entity-delete", interaction: { target: "entity-list-item", instruction: "먼저 왼쪽 목록에서 기존 멤버를 선택해 주세요." }, requires: "artist", ...fallback },

  { id: "2-album-create", chapterId: "2", title: "2-3. 앨범 만들기", controlLabel: "새 앨범 만들기", purpose: "새 앨범과 트랙을 입력할 초안을 만듭니다.", outcome: "기본 정보 탭이 열리고 저장 전까지 서버에는 생성되지 않습니다.", href: "/admin/artists/:artistId/discography", target: "entity-create", requires: "artist", ...fallback },
  { id: "2-album-sort", chapterId: "2", title: "앨범 노출 순서", controlLabel: "순서 편집", purpose: "앨범 목록을 드래그해 공개 노출 순서를 변경합니다.", outcome: "변경 순서가 임시 작업으로 저장 대기 상태가 됩니다.", href: "/admin/artists/:artistId/discography", target: "album-sort", requires: "artist", ...fallback },
  { id: "2-album-tabs", chapterId: "2", title: "앨범 편집 탭", controlLabel: "기본 정보 · 소개 · 트랙 · 갤러리 · 공개 설정", purpose: "앨범 정보 종류별 편집 화면을 전환합니다.", outcome: "탭 사이에서 앨범과 트랙 초안이 유지됩니다.", href: "/admin/artists/:artistId/discography", target: "workbench-tabs", requires: "artist", ...fallback },
  { id: "2-track-bulk", chapterId: "2", title: "여러 트랙 추가", controlLabel: "여러 곡 붙여넣기", purpose: "한 줄에 한 곡씩 입력해 여러 트랙을 한 번에 만듭니다.", outcome: "번호가 제거된 트랙 초안이 앨범에 추가됩니다.", href: "/admin/artists/:artistId/discography?tab=tracks", target: "track-bulk", requires: "artist", ...fallback },
  { id: "2-track-add", chapterId: "2", title: "트랙 한 곡 추가", controlLabel: "트랙 추가", purpose: "빈 트랙 한 개를 앨범에 추가합니다.", outcome: "곡명과 미디어 링크를 입력할 트랙 카드가 생성됩니다.", href: "/admin/artists/:artistId/discography?tab=tracks", target: "track-add", requires: "artist", ...fallback },
  { id: "2-track-media", chapterId: "2", title: "트랙 미디어 열기", controlLabel: "미디어", purpose: "트랙별 음원·영상 입력 영역을 펼칩니다.", outcome: "MP3, Spotify와 YouTube 정보를 편집할 수 있습니다.", href: "/admin/artists/:artistId/discography?tab=tracks", target: "track-media", requires: "artist", ...fallback },
  { id: "2-track-delete", chapterId: "2", title: "트랙 삭제", controlLabel: "삭제", purpose: "해당 트랙을 앨범 초안에서 제거합니다.", outcome: "앨범 저장 후 트랙이 실제로 삭제됩니다.", href: "/admin/artists/:artistId/discography?tab=tracks", target: "track-delete", requires: "artist", ...fallback },
  { id: "2-album-preview", chapterId: "2", title: "앨범 미리보기", controlLabel: "미리보기", purpose: "저장 전 앨범 공개 화면을 확인합니다.", outcome: "공개 데이터 변경 없이 미리보기 화면이 열립니다.", href: "/admin/artists/:artistId/discography?tab=tracks", target: "preview", requires: "artist", ...fallback },
  { id: "2-album-save", chapterId: "2", title: "앨범 저장", controlLabel: "변경사항 저장", purpose: "앨범·트랙·순서 변경을 저장하는 흐름을 확인합니다.", outcome: "연습 모드에서는 실제 앨범 정보에 반영되지 않습니다.", href: "/admin/artists/:artistId/discography?tab=tracks", target: "draft-save", requires: "artist", ...fallback },
  { id: "2-album-delete", chapterId: "2", title: "앨범 삭제", controlLabel: "삭제", purpose: "현재 앨범을 삭제 대상으로 표시합니다.", outcome: "연습 모드에서는 실제 앨범과 연결 데이터가 삭제되지 않습니다.", caution: "실제 업무에서는 수록곡과 미디어 연결도 함께 영향을 받습니다.", href: "/admin/artists/:artistId/discography?tab=tracks", target: "entity-delete", interaction: { target: "entity-list-item", instruction: "먼저 왼쪽 앨범 목록에서 기존 앨범을 선택해 주세요." }, requires: "artist", ...fallback },

  { id: "2-schedule-create", chapterId: "2", title: "2-4. 일정 추가", controlLabel: "일정 추가", purpose: "새 일정 편집 초안을 만듭니다.", outcome: "날짜와 제목을 입력할 상세 탭이 열립니다.", href: "/admin/artists/:artistId/schedule", target: "schedule-add", requires: "artist", ...fallback },
  { id: "2-schedule-tabs", chapterId: "2", title: "일정 편집 탭", controlLabel: "캘린더 · 상세 정보 · 공개 설정", purpose: "목록 확인, 일정 입력, 공개 상태 화면을 전환합니다.", outcome: "탭 사이에서 일정 초안이 유지됩니다.", href: "/admin/artists/:artistId/schedule", target: "workbench-tabs", requires: "artist", ...fallback },
  { id: "2-schedule-preview", chapterId: "2", title: "일정 미리보기", controlLabel: "미리보기", purpose: "저장 전 공개 일정 화면을 확인합니다.", outcome: "공개 데이터 변경 없이 미리보기 화면이 열립니다.", href: "/admin/artists/:artistId/schedule", target: "preview", requires: "artist", ...fallback },
  { id: "2-schedule-save", chapterId: "2", title: "일정 저장", controlLabel: "변경사항 저장", purpose: "일정 정보와 공개 상태를 서버에 반영합니다.", outcome: "확인창 승인 후 공개 일정이 갱신됩니다.", href: "/admin/artists/:artistId/schedule", target: "draft-save", requires: "artist", ...fallback },
  { id: "2-schedule-delete", chapterId: "2", title: "일정 삭제", controlLabel: "삭제", purpose: "현재 일정을 삭제 대상으로 표시합니다.", outcome: "상단 저장 후 일정이 삭제됩니다.", href: "/admin/artists/:artistId/schedule", target: "entity-delete", interaction: { target: "entity-list-item", instruction: "먼저 왼쪽 일정 목록에서 기존 일정을 선택해 주세요." }, requires: "artist", ...fallback },
  { id: "2-notice-create", chapterId: "2", title: "2-5. 아티스트 공지 작성", controlLabel: "공지 작성", purpose: "선택 아티스트 전용 공지 초안을 만듭니다.", outcome: "공지 편집 화면이 열립니다.", href: "/admin/artists/:artistId/notices", target: "notice-create", requires: "artist", ...fallback },
  { id: "2-notice-find", chapterId: "2", title: "아티스트 공지 찾기", controlLabel: "검색 · 공개 필터", purpose: "제목과 공개 상태로 아티스트 공지를 찾습니다.", outcome: "조건에 맞는 공지만 표시됩니다.", href: "/admin/artists/:artistId/notices", target: "notice-filters", requires: "artist", ...fallback },
  { id: "2-notice-preview", chapterId: "2", title: "아티스트 공지 미리보기", controlLabel: "미리보기", purpose: "저장 전 공개 공지 화면을 확인합니다.", outcome: "공개 데이터 변경 없이 미리보기가 열립니다.", href: "/admin/artists/:artistId/notices", target: "preview", requires: "artist", ...fallback },
  { id: "2-notice-save", chapterId: "2", title: "아티스트 공지 저장", controlLabel: "변경사항 저장", purpose: "공지 내용과 공개 상태를 서버에 반영합니다.", outcome: "해당 아티스트의 공지 목록이 갱신됩니다.", href: "/admin/artists/:artistId/notices", target: "draft-save", requires: "artist", ...fallback },
  { id: "2-notice-delete", chapterId: "2", title: "아티스트 공지 삭제", controlLabel: "삭제", purpose: "현재 공지를 삭제 대상으로 표시합니다.", outcome: "상단 저장 후 공지가 삭제됩니다.", href: "/admin/artists/:artistId/notices", target: "entity-delete", interaction: { target: "entity-list-item", instruction: "먼저 왼쪽 공지 목록에서 기존 공지를 선택해 주세요." }, requires: "artist", ...fallback },

  { id: "3-create", chapterId: "3", title: "전체 공지 작성", controlLabel: "공지 작성", purpose: "사이트 전체에 노출할 새 공지 초안을 만듭니다.", outcome: "제목과 내용을 입력할 편집 화면이 열립니다.", href: "/admin/notices", target: "notice-create", ...fallback },
  { id: "3-search", chapterId: "3", title: "전체 공지 검색", controlLabel: "공지 검색", purpose: "제목으로 전체 공지를 찾습니다.", outcome: "검색어가 포함된 공지만 표시됩니다.", href: "/admin/notices", target: "notice-search", ...fallback },
  { id: "3-filter", chapterId: "3", title: "전체 공지 공개 필터", controlLabel: "전체 · 공개 · 비공개", purpose: "공개 상태로 전체 공지 목록을 좁힙니다.", outcome: "선택한 상태의 공지만 표시됩니다.", href: "/admin/notices", target: "notice-status-filter", ...fallback },
  { id: "3-preview", chapterId: "3", title: "공지 미리보기", controlLabel: "미리보기", purpose: "저장 전에 공개 공지 화면을 확인합니다.", outcome: "공개 데이터 변경 없이 미리보기 화면이 열립니다.", href: "/admin/notices", target: "preview", ...fallback },
  { id: "3-save", chapterId: "3", title: "공지 저장", controlLabel: "변경사항 저장", purpose: "공지 내용과 공개 상태를 서버에 반영합니다.", outcome: "공개 설정에 따라 전체 공지 목록에 표시됩니다.", href: "/admin/notices", target: "draft-save", ...fallback },
  { id: "3-delete", chapterId: "3", title: "공지 삭제", controlLabel: "삭제", purpose: "현재 공지를 삭제 대상으로 표시합니다.", outcome: "상단 저장을 눌러야 서버에서 실제 삭제됩니다.", href: "/admin/notices", target: "entity-delete", interaction: { target: "entity-list-item", instruction: "먼저 왼쪽 공지 목록에서 기존 공지를 선택해 주세요." }, ...fallback },

  { id: "4-create", chapterId: "4", title: "캠페인 만들기", controlLabel: "새 캠페인", purpose: "기본 질문이 포함된 오디션 캠페인을 생성합니다.", outcome: "초안 캠페인과 폼 편집 화면이 준비됩니다.", caution: "이 버튼은 실제 사용 시 즉시 초안 행을 생성합니다.", href: "/admin/auditions/campaigns", target: "audition-create", ...fallback },
  { id: "4-toggle", chapterId: "4", title: "캠페인 공개 상태", controlLabel: "활성화 / 비활성화", purpose: "지원자가 캠페인을 볼 수 있는 상태를 전환합니다.", outcome: "활성화하면 모집 기간에 맞춰 공개 오디션에 노출됩니다.", caution: "활성화 전 모집 기간과 질문을 확인하세요.", href: "/admin/auditions/campaigns", target: "audition-toggle", ...fallback },
  { id: "4-builder", chapterId: "4", title: "지원 폼 편집", controlLabel: "폼 편집", purpose: "캠페인 질문 구성 화면으로 이동합니다.", outcome: "질문 추가·정렬·유형 설정과 미리보기를 사용할 수 있습니다.", href: "/admin/auditions/campaigns", target: "audition-builder", ...fallback },
  { id: "4-review", chapterId: "4", title: "지원서 심사", controlLabel: "심사", purpose: "캠페인에 접수된 지원서 목록으로 이동합니다.", outcome: "답변, 첨부파일, 심사 메모와 상태를 확인할 수 있습니다.", href: "/admin/auditions/campaigns", target: "audition-review", ...fallback },
  { id: "4-question-add", chapterId: "4", title: "지원 질문 추가", controlLabel: "질문 추가", purpose: "지원 폼에 새 질문을 만듭니다.", outcome: "빈 질문이 질문 목록과 미리보기에 추가됩니다.", href: "/admin/auditions/campaigns", target: "audition-question-add", interaction: { target: "audition-builder", instruction: "먼저 캠페인의 ‘폼 편집’을 클릭해 주세요." }, descendantPath: true, ...fallback },
  { id: "4-question-type", chapterId: "4", title: "지원 질문 유형", controlLabel: "질문 유형", purpose: "단답, 장문, 선택, 파일 등 답변 방식을 정합니다.", outcome: "질문에 맞는 입력 방식과 검증 항목이 적용됩니다.", href: "/admin/auditions/campaigns", target: "audition-question-type", interaction: { target: "audition-builder-prerequisite", instruction: "폼 편집을 열고, 질문이 없다면 ‘질문 추가’를 눌러 주세요." }, descendantPath: true, ...fallback },
  { id: "4-question-sort", chapterId: "4", title: "지원 질문 순서", controlLabel: "드래그 정렬", purpose: "질문을 끌어 지원자가 보는 순서를 바꿉니다.", outcome: "저장할 질문 순서가 즉시 미리보기에 반영됩니다.", href: "/admin/auditions/campaigns", target: "audition-question-sort", interaction: { target: "audition-builder-prerequisite", instruction: "폼 편집을 열고, 질문이 없다면 ‘질문 추가’를 눌러 주세요." }, descendantPath: true, ...fallback },
  { id: "4-question-delete", chapterId: "4", title: "지원 질문 삭제", controlLabel: "질문 삭제", purpose: "선택 질문을 폼 초안에서 제거합니다.", outcome: "저장 후 해당 질문은 새 지원서에서 사라집니다.", caution: "기존 지원서의 제출 당시 답변 스냅샷은 유지됩니다.", href: "/admin/auditions/campaigns", target: "audition-question-delete", interaction: { target: "audition-builder-prerequisite", instruction: "폼 편집을 열고, 질문이 없다면 ‘질문 추가’를 눌러 주세요." }, descendantPath: true, ...fallback },
  { id: "4-save", chapterId: "4", title: "지원 폼 저장", controlLabel: "저장", purpose: "질문과 캠페인 설명 변경을 서버에 반영합니다.", outcome: "이후 접수되는 지원서에 새 폼 구성이 사용됩니다.", href: "/admin/auditions/campaigns", target: "audition-save", interaction: { target: "audition-builder", instruction: "먼저 캠페인의 ‘폼 편집’을 클릭해 주세요." }, descendantPath: true, ...fallback },
  { id: "4-status", chapterId: "4", title: "지원서 심사 상태", controlLabel: "접수 · 검토 · 합격 · 불합격", purpose: "지원서별 심사 단계 버튼 중 하나를 선택합니다.", outcome: "선택한 상태와 내부 메모가 해당 지원서에 즉시 저장됩니다.", href: "/admin/auditions/campaigns", target: "audition-status", interaction: { target: "audition-status-prerequisite", instruction: "‘심사’를 연 뒤 상태를 확인할 지원서를 선택해 주세요." }, descendantPath: true, ...fallback },

  { id: "5-general", chapterId: "5", title: "일반 문의함", controlLabel: "일반 문의", purpose: "팬과 고객이 접수한 일반 문의 목록으로 전환합니다.", outcome: "일반 문의 건수와 목록이 표시됩니다.", href: "/admin/contact", target: "contact-category-general", ...fallback },
  { id: "5-business", chapterId: "5", title: "비즈니스 문의함", controlLabel: "Business", purpose: "협업·광고·제휴 제안 목록으로 전환합니다.", outcome: "비즈니스 제안 건수와 목록이 표시됩니다.", href: "/admin/contact", target: "contact-category-business", ...fallback },
  { id: "5-search", chapterId: "5", title: "문의 검색", controlLabel: "문의 검색", purpose: "이름, 연락처, 회사와 내용으로 문의를 찾습니다.", outcome: "검색어와 일치하는 문의만 표시됩니다.", href: "/admin/contact", target: "contact-search", ...fallback },
  { id: "5-filter", chapterId: "5", title: "문의 상태 필터", controlLabel: "처리 상태", purpose: "처리 단계로 문의 목록을 좁힙니다.", outcome: "선택 상태의 문의만 표시됩니다.", href: "/admin/contact", target: "contact-status-filter", ...fallback },
  { id: "5-open", chapterId: "5", title: "문의 열기", controlLabel: "열기", purpose: "선택 문의의 본문, 연락처와 첨부 자료를 엽니다.", outcome: "상세 화면에서 내부 메모와 처리 상태를 관리할 수 있습니다.", href: "/admin/contact", target: "contact-open", actionHint: "강조된 ‘열기’를 직접 클릭해 상세 화면을 열어보세요.", ...fallback },
  { id: "5-memo", chapterId: "5", title: "문의 메모 저장", controlLabel: "메모 저장", purpose: "담당자 확인 내용과 후속 조치를 관리자 전용 메모로 남깁니다.", outcome: "공개되지 않는 내부 기록으로 즉시 저장됩니다.", href: "/admin/contact", target: "contact-memo", interaction: { target: "contact-open", instruction: "먼저 문의 목록에서 ‘열기’를 클릭해 상세 화면을 열어주세요." }, ...fallback },
  { id: "5-status", chapterId: "5", title: "문의 처리 상태", controlLabel: "접수 · 검토 중 · 답변 완료 · 종결", purpose: "문의 처리 흐름에 맞춰 현재 상태를 기록합니다.", outcome: "선택 상태가 즉시 저장되고 사이드바 미확인 수가 갱신됩니다.", href: "/admin/contact", target: "contact-status", interaction: { target: "contact-open", instruction: "먼저 문의 목록에서 ‘열기’를 클릭해 상세 화면을 열어주세요." }, ...fallback },

  { id: "6-search", chapterId: "6", title: "권익 신고 검색", controlLabel: "신고 검색", purpose: "제목, 아티스트와 작성자로 신고를 찾습니다.", outcome: "검색어와 일치하는 신고만 표시됩니다.", href: "/admin/protect", target: "protect-search", ...fallback },
  { id: "6-filter", chapterId: "6", title: "권익 신고 상태 필터", controlLabel: "처리 상태", purpose: "처리 단계로 신고 목록을 좁힙니다.", outcome: "선택 상태의 신고만 표시됩니다.", href: "/admin/protect", target: "protect-status-filter", ...fallback },
  { id: "6-open", chapterId: "6", title: "신고 열기", controlLabel: "열기", purpose: "권익 침해 내용과 신고자 자료를 상세 화면에서 확인합니다.", outcome: "원문, 증거 자료, 메모와 처리 상태를 볼 수 있습니다.", href: "/admin/protect", target: "protect-open", actionHint: "강조된 ‘열기’를 직접 클릭해 상세 화면을 열어보세요.", ...fallback },
  { id: "6-source", chapterId: "6", title: "원문 게시물 확인", controlLabel: "원문 게시물 열기", purpose: "신고 근거가 되는 외부 게시물을 확인합니다.", outcome: "원문 주소가 새 창에서 열립니다.", caution: "외부 사이트를 열기 전에 주소를 확인하세요.", href: "/admin/protect", target: "protect-source", interaction: { target: "protect-open", instruction: "먼저 신고 목록에서 ‘열기’를 클릭해 상세 화면을 열어주세요." }, ...fallback },
  { id: "6-evidence", chapterId: "6", title: "첨부 증거 확인", controlLabel: "첨부 자료", purpose: "신고자가 제출한 비공개 증거 파일을 확인합니다.", outcome: "짧게 유효한 보안 링크로 원본 자료가 열립니다.", caution: "민감한 증거 자료를 외부에 공유하지 마세요.", href: "/admin/protect", target: "protect-evidence", interaction: { target: "protect-open", instruction: "먼저 신고 목록에서 ‘열기’를 클릭해 상세 화면을 열어주세요." }, ...fallback },
  { id: "6-memo", chapterId: "6", title: "권익 보호 메모", controlLabel: "메모 저장", purpose: "검토 내용과 후속 조치를 관리자 전용 기록으로 남깁니다.", outcome: "공개되지 않는 내부 메모로 즉시 저장됩니다.", href: "/admin/protect", target: "protect-memo", interaction: { target: "protect-open", instruction: "먼저 신고 목록에서 ‘열기’를 클릭해 상세 화면을 열어주세요." }, ...fallback },
  { id: "6-status", chapterId: "6", title: "신고 처리 상태", controlLabel: "접수 · 검토 중 · 처리 완료 · 종결", purpose: "신고 처리 단계에 맞춰 상태를 기록합니다.", outcome: "선택 상태가 즉시 저장되고 미확인 수가 갱신됩니다.", href: "/admin/protect", target: "protect-status", interaction: { target: "protect-open", instruction: "먼저 신고 목록에서 ‘열기’를 클릭해 상세 화면을 열어주세요." }, ...fallback },

  { id: "7-filter", chapterId: "7", title: "변경 이력 조회 조건", controlLabel: "조회 조건", purpose: "기간, 관리자, 대상 종류, 작업과 ID를 입력합니다.", outcome: "조회할 감사 기록의 조건이 준비됩니다.", href: "/admin/audit-logs", target: "audit-filter-fields", ...fallback },
  { id: "7-reset", chapterId: "7", title: "변경 이력 조건 초기화", controlLabel: "초기화", purpose: "입력한 감사 기록 조회 조건을 모두 지웁니다.", outcome: "기본 조건으로 되돌아갑니다.", href: "/admin/audit-logs", target: "audit-reset", ...fallback },
  { id: "7-search", chapterId: "7", title: "변경 이력 조회", controlLabel: "이력 조회", purpose: "입력한 조건으로 감사 기록을 검색합니다.", outcome: "조건에 맞는 변경 기록이 시간순으로 표시됩니다.", href: "/admin/audit-logs", target: "audit-search", ...fallback },
  { id: "7-detail", chapterId: "7", title: "변경 상세 비교", controlLabel: "상세 보기", purpose: "선택 기록의 변경 전후 값을 필드 단위로 비교합니다.", outcome: "오른쪽 패널에 작업자, 시각, 이전 값과 이후 값이 표시됩니다.", href: "/admin/audit-logs", target: "audit-detail", interaction: { target: "audit-open", instruction: "먼저 변경 기록 오른쪽의 화살표를 클릭해 주세요." }, ...fallback },

  { id: "8-company", chapterId: "8", title: "회사 정보 설정", controlLabel: "회사 정보", purpose: "공개 회사명, 주소와 대표 연락처 편집 탭을 엽니다.", outcome: "회사 정보 입력 영역이 표시됩니다.", href: "/admin/settings", target: "workbench-tab-company", ...fallback },
  { id: "8-history-tab", chapterId: "8", title: "연혁 설정", controlLabel: "연혁", purpose: "공개 ABOUT 연혁 편집 탭을 엽니다.", outcome: "연혁 편집 영역이 표시됩니다.", href: "/admin/settings?tab=history", target: "workbench-tab-history", tabEvent: { name: "admin-settings-tab-change", detail: "history" }, ...fallback },
  { id: "8-history-add", chapterId: "8", title: "연혁 추가", controlLabel: "연혁 추가", purpose: "새 회사 연혁 항목을 임시 목록에 추가합니다.", outcome: "날짜와 다국어 내용을 입력할 행이 생깁니다.", href: "/admin/settings?tab=history", target: "history-add", tabEvent: { name: "admin-settings-tab-change", detail: "history" }, ...fallback },
  { id: "8-history-delete", chapterId: "8", title: "연혁 삭제", controlLabel: "삭제", purpose: "선택 연혁 항목을 임시 목록에서 제거합니다.", outcome: "상단 저장 후 공개 연혁에서 사라집니다.", href: "/admin/settings?tab=history", target: "history-delete", tabEvent: { name: "admin-settings-tab-change", detail: "history" }, ...fallback },
  { id: "8-footer", chapterId: "8", title: "푸터 설정", controlLabel: "푸터", purpose: "사이트 하단 저작권 문구 편집 탭을 엽니다.", outcome: "푸터 편집과 미리보기 영역이 표시됩니다.", href: "/admin/settings?tab=footer", target: "workbench-tab-footer", tabEvent: { name: "admin-settings-tab-change", detail: "footer" }, ...fallback },
  { id: "8-social", chapterId: "8", title: "소셜 채널 설정", controlLabel: "소셜 채널", purpose: "회사 공식 채널 링크 편집 탭을 엽니다.", outcome: "소셜 링크 입력 영역이 표시됩니다.", href: "/admin/settings?tab=social", target: "workbench-tab-social", tabEvent: { name: "admin-settings-tab-change", detail: "social" }, ...fallback },
  { id: "8-business", chapterId: "8", title: "비즈니스 자료 설정", controlLabel: "비즈니스 자료", purpose: "프레스킷과 프로필 자료 편집 탭을 엽니다.", outcome: "비즈니스 파일 업로드 영역이 표시됩니다.", href: "/admin/settings?tab=business", target: "workbench-tab-business", tabEvent: { name: "admin-settings-tab-change", detail: "business" }, ...fallback },
  { id: "8-preview", chapterId: "8", title: "설정 미리보기", controlLabel: "미리보기", purpose: "현재 설정 초안이 공개 페이지에서 보이는 결과를 확인합니다.", outcome: "공개 데이터 변경 없이 관련 공개 화면이 열립니다.", href: "/admin/settings?tab=business", target: "preview", tabEvent: { name: "admin-settings-tab-change", detail: "business" }, ...fallback },
  { id: "8-avatars", chapterId: "8", title: "사용자 아바타 설정", controlLabel: "사용자 아바타", purpose: "관리자 계정용 아바타 편집 탭을 엽니다.", outcome: "아티스트별 아바타 관리 영역이 표시됩니다.", href: "/admin/settings?tab=avatars", target: "workbench-tab-avatars", tabEvent: { name: "admin-settings-tab-change", detail: "avatars" }, ...fallback },
  { id: "8-avatar-file", chapterId: "8", title: "아바타 파일 선택", controlLabel: "파일 선택", purpose: "추가할 아바타 이미지 파일을 선택합니다.", outcome: "정사각형 자르기 화면이 열립니다.", href: "/admin/settings?tab=avatars", target: "avatar-file", tabEvent: { name: "admin-settings-tab-change", detail: "avatars" }, ...fallback },
  { id: "8-avatar-crop", chapterId: "8", title: "아바타 자르고 추가", controlLabel: "자르고 추가", purpose: "선택 이미지의 사용할 영역을 정사각형으로 확정합니다.", outcome: "잘린 이미지가 임시 아바타 목록에 추가됩니다.", href: "/admin/settings?tab=avatars", target: "avatar-crop", interaction: { target: "avatar-file", instruction: "먼저 ‘파일 선택’을 눌러 자를 이미지를 골라 주세요." }, tabEvent: { name: "admin-settings-tab-change", detail: "avatars" }, ...fallback },
  { id: "8-avatar-up", chapterId: "8", title: "아바타 앞으로 이동", controlLabel: "앞으로", purpose: "선택 아바타의 노출 순서를 한 칸 앞당깁니다.", outcome: "새 순서가 임시 목록에 반영됩니다.", href: "/admin/settings?tab=avatars", target: "avatar-up", tabEvent: { name: "admin-settings-tab-change", detail: "avatars" }, ...fallback },
  { id: "8-avatar-down", chapterId: "8", title: "아바타 뒤로 이동", controlLabel: "뒤로", purpose: "선택 아바타의 노출 순서를 한 칸 늦춥니다.", outcome: "새 순서가 임시 목록에 반영됩니다.", href: "/admin/settings?tab=avatars", target: "avatar-down", tabEvent: { name: "admin-settings-tab-change", detail: "avatars" }, ...fallback },
  { id: "8-avatar-delete", chapterId: "8", title: "아바타 삭제", controlLabel: "삭제", purpose: "선택 아바타를 임시 목록에서 제거합니다.", outcome: "상단 저장 후 선택 목록에서 사라집니다.", href: "/admin/settings?tab=avatars", target: "avatar-delete", tabEvent: { name: "admin-settings-tab-change", detail: "avatars" }, ...fallback },
  { id: "8-save", chapterId: "8", title: "사이트 설정 저장", controlLabel: "변경사항 저장", purpose: "현재 설정 탭과 하위 임시 작업을 저장하는 흐름을 확인합니다.", outcome: "연습 모드에서는 실제 사이트 설정에 반영되지 않습니다.", href: "/admin/settings?tab=avatars", target: "draft-save", tabEvent: { name: "admin-settings-tab-change", detail: "avatars" }, ...fallback },
  { id: "8-admin-invite", chapterId: "8", title: "관리자 초대와 승격", controlLabel: "초대·승격", purpose: "이메일 계정을 관리자 역할로 초대하거나 기존 계정을 승격합니다.", outcome: "선택 역할로 관리자 접근 권한이 부여됩니다.", caution: "권한 부여 전 이메일과 역할을 반드시 확인하세요.", href: "/admin/settings?tab=admins", target: "admin-account-invite", tabEvent: { name: "admin-settings-tab-change", detail: "admins" }, role: "super_admin", ...fallback },
  { id: "8-admin-remove", chapterId: "8", title: "관리자 권한 해제", controlLabel: "관리자 권한 해제", purpose: "선택 계정의 관리자 역할을 제거합니다.", outcome: "해당 계정은 더 이상 관리자 화면에 접근할 수 없습니다.", caution: "본인 또는 마지막 슈퍼 관리자 권한은 해제할 수 없습니다.", href: "/admin/settings?tab=admins", target: "admin-account-remove", tabEvent: { name: "admin-settings-tab-change", detail: "admins" }, role: "super_admin", ...fallback },

  { id: "9-search", chapterId: "9", title: "빠른 검색 열기", controlLabel: "검색창 · Ctrl/⌘ + K", purpose: "화면명이나 아티스트명을 입력해 관리자 기능을 빠르게 찾습니다.", outcome: "검색어와 일치하는 화면·아티스트·세부 탭이 분류되어 표시됩니다.", href: "/admin", target: "admin-search", fallbackTarget: "admin-navigation" },
  { id: "9-result", chapterId: "9", title: "검색 결과로 이동", controlLabel: "검색 결과", purpose: "원하는 결과를 선택해 해당 화면이나 세부 탭으로 바로 이동합니다.", outcome: "미저장 변경 확인 후 선택한 관리자 화면이 열립니다.", href: "/admin", target: "admin-search-result", interaction: { target: "admin-search", instruction: "검색창에 화면명이나 아티스트명을 입력해 주세요." }, fallbackTarget: "admin-navigation" },
];

export function availableGuideSteps(
  chapterId: string,
  context: { role: GuideRole; hasArtist: boolean; artistScenes: boolean; artistGallery: boolean },
) {
  return GUIDE_STEPS.filter((step) => step.chapterId === chapterId)
    .filter((step) => !step.role || step.role === context.role)
    .filter((step) => step.requires !== "artist" || context.hasArtist)
    .filter((step) => step.requires !== "artist_scenes" || (context.hasArtist && context.artistScenes))
    .filter((step) => step.requires !== "artist_gallery" || (context.hasArtist && context.artistGallery));
}

export function guideChapterProgress(chapterId: string, steps: GuideStep[], row?: GuideProgressRow) {
  const total = chapterId === "0" ? 1 : steps.length;
  if (!row) return { reached: 0, total };
  if (row.completed_at) return { reached: total, total };
  const index = steps.findIndex((step) => step.id === row.furthest_step_id);
  return { reached: index < 0 ? 0 : index + 1, total };
}
