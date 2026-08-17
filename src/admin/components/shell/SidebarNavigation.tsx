import type { MouseEventHandler } from "react";
import Link from "next/link";
import {
  BarChart3,
  Archive,
  ChevronDown,
  FileText,
  History,
  Image,
  Inbox,
  LayoutDashboard,
  Mail,
  Plus,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import ArtistNavGroup from "./ArtistNavGroup";

export type SidebarArtist = {
  id: string;
  name: string;
  logo_url: string | null;
};

type NavigationLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type InboxLink = NavigationLink & {
  countKey: keyof SidebarUnreadCounts;
};

type SidebarUnreadCounts = {
  auditions: number;
  contacts: number;
  reports: number;
};

const overviewLinks: NavigationLink[] = [
  { label: "대시보드", href: "/admin", icon: LayoutDashboard },
  { label: "페이지 통계", href: "/admin/analytics", icon: BarChart3 },
];

const contentLinks: NavigationLink[] = [
  { label: "메인 앨범 정렬", href: "/admin/hero", icon: Image },
  { label: "전체 공지", href: "/admin/notices", icon: FileText },
];

const inboxLinks: InboxLink[] = [
  {
    label: "오디션",
    href: "/admin/auditions/campaigns",
    icon: Inbox,
    countKey: "auditions",
  },
  {
    label: "문의 관리",
    href: "/admin/contact",
    icon: Mail,
    countKey: "contacts",
  },
  {
    label: "권익 보호",
    href: "/admin/protect",
    icon: ShieldCheck,
    countKey: "reports",
  },
];

const systemLinks: NavigationLink[] = [
  {
    label: "휴지통 · 보존",
    href: "/admin/retention",
    icon: Archive,
  },
  { label: "변경 이력", href: "/admin/audit-logs", icon: History },
  { label: "사이트 설정", href: "/admin/settings", icon: Settings },
];

const artistLinks = [
  { label: "프로필", segment: "profile" },
  { label: "멤버", segment: "members" },
  { label: "음악 · 디스코그래피", segment: "discography" },
  { label: "일정", segment: "schedule" },
  { label: "공지", segment: "notices" },
];

type SidebarNavigationProps = {
  artists: SidebarArtist[];
  artistsLoading: boolean;
  pathname: string;
  isCollapsed: boolean;
  unreadCounts: SidebarUnreadCounts;
  collapsedGroups: Record<string, boolean>;
  toggleGroup: (groupKey: string) => void;
  expandedArtist: string | null;
  onArtistToggle: (artistId: string, isExpanded: boolean) => void;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
};

export default function SidebarNavigation({
  artists,
  artistsLoading,
  pathname,
  isCollapsed,
  unreadCounts,
  collapsedGroups,
  toggleGroup,
  expandedArtist,
  onArtistToggle,
  onNavigate,
}: SidebarNavigationProps) {
  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  const renderLinks = (links: NavigationLink[]) =>
    links.map((item) => {
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          title={item.label}
          className={`cms-nav-item ${isActive(item.href) ? "is-active" : ""}`}
          onClick={onNavigate}
        >
          <span className="cms-nav-icon">
            <Icon aria-hidden="true" />
          </span>
          <span>{item.label}</span>
        </Link>
      );
    });

  return (
    <nav className="cms-nav" aria-label="관리자 메뉴">
      <div
        className={`cms-nav-section ${collapsedGroups.analytics ? "is-collapsed-group" : ""}`}
      >
        <button
          type="button"
          className="cms-nav-label-row"
          onClick={() => toggleGroup("analytics")}
          aria-expanded={!collapsedGroups.analytics}
        >
          <p className="cms-nav-label">운영 현황</p>
          <ChevronDown className="cms-group-toggle-arrow" aria-hidden="true" />
        </button>
        <div className="cms-nav-group-items">{renderLinks(overviewLinks)}</div>
      </div>

      <div
        className={`cms-nav-section ${collapsedGroups.inbox ? "is-collapsed-group" : ""}`}
      >
        <button
          type="button"
          className="cms-nav-label-row"
          onClick={() => toggleGroup("inbox")}
          aria-expanded={!collapsedGroups.inbox}
        >
          <p className="cms-nav-label">접수함</p>
          <ChevronDown className="cms-group-toggle-arrow" aria-hidden="true" />
        </button>
        <div className="cms-nav-group-items">
          {inboxLinks.map((item) => {
            const Icon = item.icon;
            const count = unreadCounts[item.countKey];
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`cms-nav-item ${isActive(item.href) ? "is-active" : ""}`}
                onClick={onNavigate}
              >
                <span className="cms-nav-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span>{item.label}</span>
                {count > 0 && (
                  <span
                    className="cms-nav-count"
                    aria-label={`미확인 ${count}건`}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div
        className={`cms-nav-section ${collapsedGroups.service ? "is-collapsed-group" : ""}`}
      >
        <button
          type="button"
          className="cms-nav-label-row"
          onClick={() => toggleGroup("service")}
          aria-expanded={!collapsedGroups.service}
        >
          <p className="cms-nav-label">서비스 관리</p>
          <ChevronDown className="cms-group-toggle-arrow" aria-hidden="true" />
        </button>
        <div className="cms-nav-group-items">{renderLinks(contentLinks)}</div>
      </div>

      <div
        className={`cms-nav-section ${collapsedGroups.system ? "is-collapsed-group" : ""}`}
      >
        <button
          type="button"
          className="cms-nav-label-row"
          onClick={() => toggleGroup("system")}
          aria-expanded={!collapsedGroups.system}
        >
          <p className="cms-nav-label">시스템</p>
          <ChevronDown className="cms-group-toggle-arrow" aria-hidden="true" />
        </button>
        <div className="cms-nav-group-items">{renderLinks(systemLinks)}</div>
      </div>

      <div
        className={`cms-nav-section cms-artist-section ${collapsedGroups.artist ? "is-collapsed-group" : ""}`}
      >
        <div className="cms-nav-label-row">
          <button
            type="button"
            className="cms-nav-label-left"
            onClick={() => toggleGroup("artist")}
            aria-expanded={!collapsedGroups.artist}
          >
            <p className="cms-nav-label">아티스트</p>
            <ChevronDown
              className="cms-group-toggle-arrow"
              aria-hidden="true"
            />
          </button>
          {!isCollapsed && !collapsedGroups.artist && (
            <Link
              href="/admin/artists/new/profile"
              className="cms-add-artist"
              onClick={onNavigate}
              aria-label="아티스트 추가"
            >
              <Plus aria-hidden="true" />
            </Link>
          )}
        </div>
        <div className="cms-nav-group-items">
          {artists.map((artist) => {
            const isCurrentArtist = pathname.includes(`/artists/${artist.id}/`);
            const isExpanded =
              expandedArtist === artist.id ||
              (expandedArtist === null && isCurrentArtist);
            return (
              <ArtistNavGroup
                key={artist.id}
                artist={artist}
                isExpanded={isExpanded}
                onToggle={() => onArtistToggle(artist.id, isExpanded)}
                pathname={pathname}
                artistLinks={artistLinks}
                isCollapsed={isCollapsed}
                onNavigate={onNavigate}
              />
            );
          })}
          {!artistsLoading && !artists.length && (
            <Link
              href="/admin/artists/new/profile"
              className="cms-empty-artist"
              onClick={onNavigate}
            >
              첫 아티스트 추가하기
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
