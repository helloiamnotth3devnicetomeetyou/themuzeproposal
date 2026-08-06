"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ExternalLink, Menu } from "lucide-react";
import { AdminToast } from "@/admin/components/feedback/AdminFeedback";
import AdminDialogProvider from "@/admin/components/shell/AdminDialogProvider";
import Sidebar from "@/admin/components/shell/Sidebar";
import Navbar from "@/public/components/layout/Navbar";

function getPageLabel(pathname: string) {
  if (pathname === "/admin") return "대시보드";
  if (pathname.includes("/hero")) return "메인 앨범";
  if (pathname.includes("/notices")) return "공지";
  if (pathname.includes("/audit-logs")) return "변경 이력";
  if (pathname.includes("/auditions")) return "오디션";
  if (pathname.includes("/protect")) return "권익 보호";
  if (pathname.includes("/contact")) return "문의";
  if (pathname.includes("/settings")) return "사이트 설정";
  if (pathname.includes("/profile")) return "아티스트 프로필";
  if (pathname.includes("/members")) return "멤버";
  if (pathname.includes("/discography") || pathname.includes("/tracks")) return "디스코그래피";
  if (pathname.includes("/schedule")) return "일정";
  return "관리";
}

const emptySubscribe = () => () => {};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [toast, setToast] = useState("");
  const dirtyDrafts = useRef(new Set<string>());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("admin-sidebar-collapsed") === "true"
  );
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const confirmNavigation = useCallback(() => !dirtyDrafts.current.size || window.confirm("저장하지 않은 변경사항이 있습니다. 이동해도 임시 작업은 브라우저에 백업됩니다."), []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  };

  const isFullBleed = [
    "discography",
    "tracks",
    "profile",
    "members",
    "schedule",
    "notices",
    "audit-logs",
    "settings",
    "hero",
    "auditions",
    "protect",
    "contact",
  ].some((segment) => pathname.includes(segment));

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsNavigationOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (!isNavigationOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const sidebar = document.getElementById("admin-navigation");
    const focusable = Array.from(sidebar?.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),input") ?? []);
    requestAnimationFrame(() => focusable[0]?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsNavigationOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isNavigationOpen]);

  useEffect(() => {
    let timer = 0;
    const onToast = (event: Event) => {
      setToast((event as CustomEvent<string>).detail);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setToast(""), 2600);
    };
    window.addEventListener("admin-toast", onToast);
    return () => { window.clearTimeout(timer); window.removeEventListener("admin-toast", onToast); };
  }, []);

  useEffect(() => {
    const openGuideNavigation = () => {
      setIsNavigationOpen(true);
      setIsSidebarCollapsed(false);
      localStorage.setItem("admin-sidebar-collapsed", "false");
    };
    window.addEventListener("admin-guide-open-navigation", openGuideNavigation);
    return () => window.removeEventListener("admin-guide-open-navigation", openGuideNavigation);
  }, []);

  useEffect(() => {
    const onDirty = (event: Event) => {
      const { key, dirty } = (event as CustomEvent<{ key: string; dirty: boolean }>).detail;
      if (dirty) dirtyDrafts.current.add(key); else dirtyDrafts.current.delete(key);
    };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target || link.origin !== window.location.origin || !link.pathname.startsWith("/admin") || link.href === window.location.href) return;
      if (!confirmNavigation()) event.preventDefault();
    };
    const onPopState = () => { if (!confirmNavigation()) window.history.forward(); };
    window.addEventListener("admin-draft-dirty", onDirty);
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("admin-draft-dirty", onDirty);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [confirmNavigation]);

  return (
    <AdminDialogProvider>
      <div className="admin-root-shell">
        <AdminToast message={toast} />
        <div className="admin-public-header">
          <Navbar />
        </div>
        <header className="admin-mobile-topbar">
          <button
            type="button"
            className="admin-mobile-menu-button"
            aria-label="관리 메뉴 열기"
            aria-expanded={isNavigationOpen}
            aria-controls="admin-navigation"
            onClick={() => setIsNavigationOpen(true)}
          >
            <Menu aria-hidden="true" />
          </button>
          <div className="admin-mobile-title">
            <span>THE MUZE / ADMIN</span>
            <strong>{getPageLabel(pathname)}</strong>
          </div>
          <Link href="/" className="admin-mobile-site-link" aria-label="공개 사이트 열기">
            <ExternalLink aria-hidden="true" />
          </Link>
        </header>
        <div className="admin-app-frame">
          <div className={`admin-layout cms-shell ${isMounted && isSidebarCollapsed ? "is-sidebar-collapsed" : ""}`}>
            <Sidebar
              isOpen={isNavigationOpen}
              onClose={() => setIsNavigationOpen(false)}
              isCollapsed={isMounted && isSidebarCollapsed}
              onToggleCollapse={toggleSidebar}
              canNavigate={confirmNavigation}
            />
            {isNavigationOpen && (
              <button
                type="button"
                className="cms-sidebar-backdrop"
                aria-label="관리 메뉴 닫기"
                onClick={() => setIsNavigationOpen(false)}
              />
            )}
            <div className="cms-workspace">
              <main key={pathname} data-tour-id="admin-page" className={`cms-content animate-page-fade ${isFullBleed ? "is-full-bleed" : ""}`}>
                <div className="cms-content-inner">{children}</div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </AdminDialogProvider>
  );
}
