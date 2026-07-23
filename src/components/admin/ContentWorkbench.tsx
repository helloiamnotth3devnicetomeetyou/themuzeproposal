"use client";

import type { ReactNode, Ref } from "react";

export type WorkbenchTab<T extends string = string> = {
  id: T;
  label: string;
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
}: ContentWorkbenchProps<T>) {
  return (
    <div className={`content-workbench ${className}`.trim()}>
      {toast && <div className="content-workbench-toast" role="status">{toast}</div>}
      <aside className="content-workbench-rail">{rail}</aside>
      <section className="content-workbench-stage">
        {error && (
          <div className="content-workbench-error" role="alert">
            <span>!</span>
            <p>{error}</p>
            {onDismissError && <button type="button" onClick={onDismissError}>닫기</button>}
          </div>
        )}
        <header className="content-workbench-header">
          <div className="content-workbench-identity">{identity}</div>
          {actions && <div className="content-workbench-actions">{actions}</div>}
        </header>
        <nav className="content-workbench-tabs" aria-label="편집 항목">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "is-active" : ""}
              onClick={() => onTabChange(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div ref={bodyRef} className="content-workbench-body">{children}</div>
      </section>
    </div>
  );
}
