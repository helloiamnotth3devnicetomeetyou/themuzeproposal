"use client";

import { usePathname } from "next/navigation";

function getPage(pathname: string) {
  if (pathname === "/admin") return { eyebrow: "OVERVIEW", title: "대시보드", description: "콘텐츠 상태와 운영 작업을 한눈에 확인합니다." };
  if (pathname.includes("discography") || pathname.includes("tracks")) return { eyebrow: "MUSIC CATALOG", title: "음악 · 디스코그래피", description: "앨범, 트랙, 음원과 영상 자산을 관리합니다." };
  if (pathname.includes("members")) return { eyebrow: "ARTIST", title: "멤버", description: "멤버 프로필과 노출 순서를 관리합니다." };
  if (pathname.includes("profile")) return { eyebrow: "ARTIST", title: "아티스트 프로필", description: "공개 아티스트 정보와 비주얼을 편집합니다." };
  if (pathname.includes("notices")) return { eyebrow: "COMMUNICATION", title: "공지", description: "전체 공지와 아티스트별 소식을 관리합니다." };
  if (pathname.includes("auditions")) return { eyebrow: "INBOX", title: "오디션", description: "접수된 지원서를 확인하고 상태를 관리합니다." };
  if (pathname.includes("hero")) return { eyebrow: "HOME", title: "메인 비주얼", description: "웹사이트 첫 화면의 콘텐츠와 노출 순서를 관리합니다." };
  if (pathname.includes("settings")) return { eyebrow: "SYSTEM", title: "사이트 설정", description: "회사 정보와 공통 링크를 관리합니다." };
  return { eyebrow: "CONTENT DESK", title: "콘텐츠 관리", description: "웹사이트 콘텐츠를 관리합니다." };
}

export default function AdminHeader() {
  const page = getPage(usePathname() || "/admin");
  return <header className="cms-page-header"><div><span className="cms-page-eyebrow">{page.eyebrow}</span><h1>{page.title}</h1><p>{page.description}</p></div><div className="cms-header-status"><i /> 시스템 정상</div></header>;
}
