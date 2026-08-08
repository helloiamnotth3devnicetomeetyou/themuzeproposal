"use client";

import { useState, type ReactNode, type Ref } from "react";
import { Check, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AdminToast } from "@/admin/components/feedback/AdminFeedback";

export type WorkbenchTab<T extends string = string> = {
  id: T;
  label: string;
  complete?: boolean;
};

type ContentWorkbenchProps<T extends string> = {
  rail: ReactNode;
  identity: ReactNode;
  actions?: ReactNode;
  tabs: WorkbenchTab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  children: ReactNode;
  error?: string | null;
  onDismissError?: () => void;
  toast?: string;
  className?: string;
  bodyRef?: Ref<HTMLDivElement>;
  recovery?: { updatedAt: number; onRestore: () => void; onDiscard: () => void } | null;
};

export default function ContentWorkbench<T extends string>({
  rail,
  identity,
  actions,
  tabs,
  activeTab,
  onTabChange,
  children,
  error,
  onDismissError,
  toast,
  className = "",
  bodyRef,
  recovery,
}: ContentWorkbenchProps<T>) {
  const [railCollapsed, setRailCollapsed] = useState(() =>
    typeof window !== "undefined" && window.localStorage.getItem("admin-workbench-rail-collapsed") === "true",
  );
  const toggleRail = () => setRailCollapsed((current) => {
    window.localStorage.setItem("admin-workbench-rail-collapsed", String(!current));
    return !current;
  });
  return (
    <div className={`content-workbench ${railCollapsed ? "is-rail-collapsed" : ""} ${className}`.trim()}>
      <AdminToast message={toast} />
      <aside className="content-workbench-rail">{rail}</aside>
      <button type="button" className="content-workbench-rail-toggle" onClick={toggleRail} aria-label={railCollapsed ? "목록 패널 펼치기" : "목록 패널 접기"} aria-expanded={!railCollapsed}>
        {railCollapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
      </button>
      <section className="content-workbench-stage">
        {recovery && <div className="content-draft-recovery" role="status"><p><b>저장하지 않은 임시 작업이 있습니다.</b><span>{new Date(recovery.updatedAt).toLocaleString("ko-KR")} 자동 백업</span></p><button type="button" data-tour-id="draft-discard" onClick={recovery.onDiscard}>삭제</button><button type="button" data-tour-id="draft-restore" onClick={recovery.onRestore}>복구</button></div>}
        {error && (
          <div className="content-workbench-error" role="alert">
            <span>!</span>
            <p>{error}</p>
            {onDismissError && <button type="button" onClick={onDismissError}>닫기</button>}
          </div>
        )}
        <header className="content-workbench-header">
          <div className="content-workbench-identity">{identity}</div>
          {actions && <div className="content-workbench-actions" data-tour-id="workbench-actions">{actions}</div>}
        </header>
        <nav className="content-workbench-tabs" data-tour-id="workbench-tabs" aria-label="편집 항목">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-tour-id={`workbench-tab-${tab.id}`}
              className={activeTab === tab.id ? "is-active" : ""}
              onClick={() => onTabChange(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              {tab.label}{tab.complete && <span className="content-tab-complete" aria-label="완료"><Check aria-hidden="true" /></span>}
            </button>
          ))}
        </nav>
        <div ref={bodyRef} className="content-workbench-body">{children}</div>
      </section>
    </div>
  );
}
