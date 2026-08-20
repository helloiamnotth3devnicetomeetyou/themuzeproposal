export interface Artist {
  id: string;
  name: string;
}

export interface SearchItem {
  id: string;
  categoryLabel: string;
  title: string;
  url: string;
  artistName?: string;
}

export type SidebarSearchContent = {
  albums: Array<{
    id: string;
    artistId: string;
    artistName: string;
    title: string;
  }>;
  members: Array<{
    id: string;
    artistId: string;
    artistName: string;
    name: string;
  }>;
  schedules: Array<{
    id: string;
    artistId: string;
    artistName: string;
    title: string;
  }>;
  notices: Array<{
    id: string;
    artistId: string | null;
    artistName: string | null;
    title: string;
  }>;
};

export function buildSearchItems(
  artists: Artist[],
  content: SidebarSearchContent,
): SearchItem[] {
  return [
    {
      id: "dashboard",
      categoryLabel: "워크스페이스",
      title: "대시보드",
      url: "/admin",
    },
    {
      id: "analytics",
      categoryLabel: "워크스페이스",
      title: "페이지 통계",
      url: "/admin/analytics",
    },
    {
      id: "hero",
      categoryLabel: "워크스페이스",
      title: "메인 히어로",
      url: "/admin/hero",
    },
    {
      id: "notices",
      categoryLabel: "워크스페이스",
      title: "전체 공지",
      url: "/admin/notices",
    },
    {
      id: "audit-logs",
      categoryLabel: "워크스페이스",
      title: "관리자 변경 이력",
      url: "/admin/audit-logs",
    },
    {
      id: "retention",
      categoryLabel: "시스템",
      title: "휴지통 · 30일 보존 관리",
      url: "/admin/retention",
    },
    {
      id: "protect",
      categoryLabel: "워크스페이스",
      title: "권익 보호 신고",
      url: "/admin/protect",
    },
    {
      id: "contact",
      categoryLabel: "워크스페이스",
      title: "문의 관리",
      url: "/admin/contact",
    },
    {
      id: "auditions",
      categoryLabel: "워크스페이스",
      title: "오디션 캠페인",
      url: "/admin/auditions/campaigns",
    },
    {
      id: "settings",
      categoryLabel: "사이트 설정",
      title: "사이트 설정",
      url: "/admin/settings",
    },
    {
      id: "login-slides",
      categoryLabel: "사이트 설정",
      title: "로그인 슬라이드",
      url: "/admin/settings?tab=login-slides",
    },
    {
      id: "new-artist",
      categoryLabel: "워크스페이스",
      title: "새 아티스트 추가",
      url: "/admin/artists/new/profile",
    },
    {
      id: "company",
      categoryLabel: "사이트 설정",
      title: "회사 정보",
      url: "/admin/settings?tab=company",
    },
    {
      id: "history",
      categoryLabel: "사이트 설정",
      title: "연혁",
      url: "/admin/settings?tab=history",
    },
    {
      id: "footer",
      categoryLabel: "사이트 설정",
      title: "푸터 문구",
      url: "/admin/settings?tab=footer",
    },
    {
      id: "social",
      categoryLabel: "사이트 설정",
      title: "소셜 링크",
      url: "/admin/settings?tab=social",
    },
    {
      id: "avatars",
      categoryLabel: "사이트 설정",
      title: "사용자 아바타",
      url: "/admin/settings?tab=avatars",
    },
    ...artists.flatMap((artist) => [
      {
        id: `${artist.id}-profile`,
        categoryLabel: "아티스트",
        artistName: artist.name,
        title: "프로필",
        url: `/admin/artists/${artist.id}/profile`,
      },
      {
        id: `${artist.id}-profile-basic`,
        categoryLabel: "아티스트",
        artistName: artist.name,
        title: "프로필 - 기본 정보",
        url: `/admin/artists/${artist.id}/profile?tab=basic`,
      },
      {
        id: `${artist.id}-profile-visual`,
        categoryLabel: "아티스트",
        artistName: artist.name,
        title: "프로필 - 대표 비주얼",
        url: `/admin/artists/${artist.id}/profile?tab=visual`,
      },
      {
        id: `${artist.id}-profile-content`,
        categoryLabel: "아티스트",
        artistName: artist.name,
        title: "프로필 - 아티스트 소개",
        url: `/admin/artists/${artist.id}/profile?tab=content`,
      },
      {
        id: `${artist.id}-profile-social`,
        categoryLabel: "아티스트",
        artistName: artist.name,
        title: "프로필 - 공식 계정",
        url: `/admin/artists/${artist.id}/profile?tab=social`,
      },
      {
        id: `${artist.id}-profile-scenes`,
        categoryLabel: "아티스트",
        artistName: artist.name,
        title: "프로필 - 인터랙티브 장면",
        url: `/admin/artists/${artist.id}/profile?tab=scenes`,
      },
      {
        id: `${artist.id}-scene-order`,
        categoryLabel: "아티스트",
        artistName: artist.name,
        title: "인터랙티브 장면 - 씬 순서",
        url: `/admin/artists/${artist.id}/profile?tab=scenes`,
      },
      {
        id: `${artist.id}-profile-gallery`,
        categoryLabel: "아티스트",
        artistName: artist.name,
        title: "프로필 - 통합 갤러리",
        url: `/admin/artists/${artist.id}/profile?tab=gallery`,
      },
      {
        id: `${artist.id}-profile-publish`,
        categoryLabel: "아티스트",
        artistName: artist.name,
        title: "프로필 - 공개 설정",
        url: `/admin/artists/${artist.id}/profile?tab=publish`,
      },
      {
        id: `${artist.id}-members`,
        categoryLabel: "아티스트",
        artistName: artist.name,
        title: "멤버",
        url: `/admin/artists/${artist.id}/members`,
      },
      {
        id: `${artist.id}-discography`,
        categoryLabel: "아티스트",
        artistName: artist.name,
        title: "음악 · 디스코그래피",
        url: `/admin/artists/${artist.id}/discography`,
      },
      {
        id: `${artist.id}-schedule`,
        categoryLabel: "아티스트",
        artistName: artist.name,
        title: "일정",
        url: `/admin/artists/${artist.id}/schedule`,
      },
      {
        id: `${artist.id}-notices`,
        categoryLabel: "아티스트",
        artistName: artist.name,
        title: "공지",
        url: `/admin/artists/${artist.id}/notices`,
      },
    ]),
    ...content.albums.map((album) => ({
      id: `album-${album.id}`,
      categoryLabel: "앨범",
      artistName: album.artistName,
      title: album.title,
      url: `/admin/artists/${album.artistId}/discography?album=${album.id}`,
    })),
    ...content.members.map((member) => ({
      id: `member-${member.id}`,
      categoryLabel: "멤버",
      artistName: member.artistName,
      title: member.name,
      url: `/admin/artists/${member.artistId}/members?member=${member.id}`,
    })),
    ...content.schedules.map((schedule) => ({
      id: `schedule-${schedule.id}`,
      categoryLabel: "일정",
      artistName: schedule.artistName,
      title: schedule.title,
      url: `/admin/artists/${schedule.artistId}/schedule?schedule=${schedule.id}`,
    })),
    ...content.notices.map((notice) => ({
      id: `notice-${notice.id}`,
      categoryLabel: notice.artistName ? "아티스트 공지" : "전체 공지",
      artistName: notice.artistName ?? undefined,
      title: notice.title,
      url: notice.artistId
        ? `/admin/artists/${notice.artistId}/notices?notice=${notice.id}`
        : `/admin/notices?notice=${notice.id}`,
    })),
  ];
}
