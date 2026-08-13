import type { GuideChapter } from "./guide-content";

export const GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: "0",
    title: "시작하기",
    eyebrow: "WELCOME",
    description:
      "전체 가이드를 순서대로 보거나 지금 필요한 업무만 골라 시작합니다.",
  },
  {
    id: "1",
    title: "메인 노출",
    eyebrow: "HOME",
    description:
      "홈 화면에 표시할 앨범을 추가하고 순서를 정한 뒤 공개 상태로 저장합니다.",
  },
  {
    id: "2",
    title: "아티스트 관리",
    eyebrow: "ARTIST",
    description:
      "아티스트 프로필부터 멤버, 앨범, 일정과 전용 공지까지 운영 흐름을 다룹니다.",
  },
  {
    id: "3",
    title: "전체 공지",
    eyebrow: "NOTICE",
    description:
      "사이트 공통 공지를 작성하고 공개 상태를 관리하는 방법을 확인합니다.",
  },
  {
    id: "4",
    title: "오디션",
    eyebrow: "AUDITION",
    description:
      "오디션 캠페인과 지원 질문을 만들고 접수된 지원서를 심사합니다.",
  },
  {
    id: "5",
    title: "문의",
    eyebrow: "CONTACT",
    description:
      "일반 문의와 비즈니스 제안을 찾고 메모와 처리 상태를 기록합니다.",
  },
  {
    id: "6",
    title: "권익 보호",
    eyebrow: "PROTECT",
    description:
      "권익 침해 신고의 원문과 증거를 검토하고 처리 과정을 남깁니다.",
  },
  {
    id: "7",
    title: "변경 이력",
    eyebrow: "HISTORY",
    description:
      "관리자가 변경한 항목을 조건별로 찾고 변경 전후 값을 비교합니다.",
  },
  {
    id: "8",
    title: "설정",
    eyebrow: "SETTINGS",
    description:
      "회사 정보와 공통 자료를 관리하고 슈퍼 관리자는 관리자 계정까지 관리합니다.",
  },
  {
    id: "9",
    title: "검색 팁",
    eyebrow: "SEARCH",
    description:
      "검색창으로 관리 화면과 아티스트 업무를 빠르게 찾아 이동합니다.",
  },
];

const mobileQuickStart: GuideChapter = {
  id: "mobile",
  title: "모바일 빠른 시작",
  eyebrow: "MOBILE",
  description:
    "하단 탭으로 대시보드, 받은 작업, 콘텐츠와 전체 메뉴를 빠르게 오갑니다.",
};
GUIDE_CHAPTERS.splice(1, 0, mobileQuickStart);
