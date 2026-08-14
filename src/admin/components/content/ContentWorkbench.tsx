"use client";

import { type ReactNode, type Ref, useEffect, useRef, useState } from "react";
import { Check, List, X } from "lucide-react";
import { AdminToast } from "@/admin/components/feedback/AdminFeedback";
import { useFocusTrap } from "@/admin/hooks/useFocusTrap";

export type WorkbenchTab<T extends string = string> = {
  id: T;
  label: string;
  complete?: boolean;
  missing?: number;
};

type ContentWorkbenchProps<T extends string> = {
  rail: ReactNode | ((closeRail: () => void) => ReactNode);
  identity: ReactNode;
  actions?: ReactNode;
  toolbar?: ReactNode;
  tabs: WorkbenchTab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  children: ReactNode;
  error?: string | null;
  onDismissError?: () => void;
  toast?: string;
  className?: string;
  bodyRef?: Ref<HTMLDivElement>;
  recovery?: {
    updatedAt: number;
    onRestore: () => void;
    onDiscard: () => void;
  } | null;
  railLabel?: string | null;
};

export default function ContentWorkbench<T extends string>({
  rail,
  identity,
  actions,
  toolbar,
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
  railLabel = null,
}: ContentWorkbenchProps<T>) {
  const [railOpen, setRailOpen] = useState(false);
  const railTriggerRef = useRef<HTMLButtonElement>(null);
  const railRef = useFocusTrap<HTMLElement>(railOpen);

  useEffect(() => {
    if (!railOpen) return;
    const railTrigger = railTriggerRef.current;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRailOpen(false);
    };
    const scrollContainer = document.querySelector<HTMLElement>(".cms-content");
    const originalOverflow = document.body.style.overflow;
    const originalScrollOverflow = scrollContainer?.style.overflow;
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    if (scrollContainer) scrollContainer.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = originalOverflow;
      if (scrollContainer)
        scrollContainer.style.overflow = originalScrollOverflow ?? "";
      railTrigger?.focus();
    };
  }, [railOpen]);

  const railContent =
    typeof rail === "function" ? rail(() => setRailOpen(false)) : rail;

  return (
    <div
      className={`content-workbench ${className}${railOpen ? " is-rail-open" : ""}`.trim()}
    >
      <AdminToast message={toast} />
      <aside
        ref={railRef}
        id="admin-mobile-rail"
        className="content-workbench-rail"
        role={railOpen ? "dialog" : undefined}
        aria-label={railLabel || undefined}
        aria-modal={railOpen || undefined}
      >
        {railLabel && (
          <button
            type="button"
            className="content-mobile-rail-close"
            aria-label={`${railLabel} 닫기`}
            onClick={() => setRailOpen(false)}
          >
            <X aria-hidden="true" />
          </button>
        )}
        {railContent}
      </aside>
      <section className="content-workbench-stage">
        {recovery && (
          <div className="content-draft-recovery" role="status">
            <p>
              <b>저장하지 않은 임시 작업이 있습니다.</b>
              <span>
                {new Date(recovery.updatedAt).toLocaleString("ko-KR")} 자동 백업
              </span>
            </p>
            <button
              type="button"
              data-tour-id="draft-discard"
              onClick={recovery.onDiscard}
            >
              삭제
            </button>
            <button
              type="button"
              data-tour-id="draft-restore"
              onClick={recovery.onRestore}
            >
              복구
            </button>
          </div>
        )}
        {error && (
          <div className="content-workbench-error" role="alert">
            <span>!</span>
            <p>{error}</p>
            {onDismissError && (
              <button type="button" onClick={onDismissError}>
                닫기
              </button>
            )}
          </div>
        )}
        <header className="content-workbench-header">
          <div className="content-workbench-identity">{identity}</div>
          {railLabel && (
            <button
              ref={railTriggerRef}
              type="button"
              className="content-mobile-rail-trigger"
              aria-expanded={railOpen}
              aria-controls="admin-mobile-rail"
              onClick={() => setRailOpen((open) => !open)}
            >
              <List aria-hidden="true" />
              {railLabel}
            </button>
          )}
          {actions && (
            <div
              className="content-workbench-actions"
              data-tour-id="workbench-actions"
            >
              {actions}
            </div>
          )}
        </header>
        <nav
          className="content-workbench-tabs"
          data-tour-id="workbench-tabs"
          aria-label="편집 항목"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-tour-id={`workbench-tab-${tab.id}`}
              className={`${activeTab === tab.id ? "is-active" : ""}${tab.missing ? " is-incomplete" : ""}`}
              onClick={() => onTabChange(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              aria-label={`${tab.label}${tab.complete ? " 완료" : tab.missing ? `, 누락 항목 ${tab.missing}개` : ""}`}
            >
              {tab.label}
              {tab.complete && (
                <span className="content-tab-complete" aria-label="완료">
                  <Check aria-hidden="true" />
                </span>
              )}
              {!tab.complete && Boolean(tab.missing) && (
                <span className="content-tab-missing" aria-hidden="true">
                  {tab.missing}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div ref={bodyRef} className="content-workbench-body">
          {toolbar && (
            <div className="content-workbench-toolbar">{toolbar}</div>
          )}
          {children}
        </div>
      </section>
    </div>
  );
}
