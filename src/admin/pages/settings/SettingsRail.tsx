"use client";

import type { IconType } from "react-icons";
import {
  Building2,
  Check,
  FileArchive,
  Globe,
  History,
  Settings2,
  Share2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { SettingsTab } from "./settings-editor-model";

type SettingsRailProps = {
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  dirty: boolean;
  companyReady: boolean;
  historyCount: number;
  footerReady: boolean;
  socialCount: number;
  businessReady: boolean;
  businessComplete: boolean;
  loginSlidesCount: number;
  avatarDirty: boolean;
  isSuperAdmin: boolean;
};

export default function SettingsRail({
  tab,
  onTabChange,
  dirty,
  companyReady,
  historyCount,
  footerReady,
  socialCount,
  businessReady,
  businessComplete,
  loginSlidesCount,
  avatarDirty,
  isSuperAdmin,
}: SettingsRailProps) {
  const railItems: Array<{
    id: SettingsTab;
    label: string;
    copy: string;
    icon: IconType;
    ready: boolean;
    meta: string;
  }> = [
    {
      id: "company",
      label: "회사 정보",
      copy: "주소 · 대표 메일",
      icon: Building2,
      ready: companyReady,
      meta: companyReady ? "입력 완료" : "확인 필요",
    },
    {
      id: "history",
      label: "연혁",
      copy: "ABOUT 성장 기록",
      icon: History,
      ready: historyCount > 0,
      meta: `${historyCount}개 항목`,
    },
    {
      id: "footer",
      label: "푸터",
      copy: "하단 저작권 문구",
      icon: Globe,
      ready: footerReady,
      meta: footerReady ? "입력 완료" : "확인 필요",
    },
    {
      id: "social",
      label: "소셜 채널",
      copy: "공식 채널 바로가기",
      icon: Share2,
      ready: socialCount > 0,
      meta: `${socialCount}개 연결`,
    },
    {
      id: "business",
      label: "비즈니스 자료",
      copy: "프레스킷 · 프로필 PDF",
      icon: FileArchive,
      ready: businessReady,
      meta: businessComplete ? "업로드 완료" : "자료 확인 필요",
    },
    {
      id: "avatars",
      label: "사용자 아바타",
      copy: "아티스트별 계정 이미지",
      icon: UserRound,
      ready: !avatarDirty,
      meta: avatarDirty ? "저장 필요" : "목록 관리",
    },
    {
      id: "login-slides",
      label: "LOGIN SLIDES",
      copy: "로그인 배경 이미지",
      icon: Settings2,
      ready: loginSlidesCount > 0,
      meta: `${loginSlidesCount}장`,
    },
    ...(isSuperAdmin
      ? [
          {
            id: "admins" as const,
            label: "관리자 계정",
            copy: "초대 · 역할 · 권한 해제",
            icon: ShieldCheck,
            ready: true,
            meta: "슈퍼 관리자",
          },
        ]
      : []),
  ];

  return (
    <div className="settings-context-rail">
      <div className="content-rail-heading">
        <div>
          <h2>사이트 설정</h2>
        </div>
        <span
          className={`settings-sync-dot ${dirty ? "is-dirty" : ""}`}
          aria-label={dirty ? "저장 필요" : "동기화됨"}
        />
      </div>
      <div className="settings-rail-summary">
        <Settings2 aria-hidden="true" />
        <p>공개 사이트 전반에서 함께 사용하는 기본 정보를 관리합니다.</p>
      </div>
      <nav className="settings-rail-nav" aria-label="사이트 설정 섹션">
        {railItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? "is-active" : ""}
              onClick={() => onTabChange(item.id)}
            >
              <span>
                <Icon aria-hidden="true" />
              </span>
              <div>
                <b>{item.label}</b>
                <small>{item.copy}</small>
              </div>
              <em className={item.ready ? "is-ready" : ""}>
                {item.ready && <Check aria-hidden="true" />}
                {item.meta}
              </em>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
