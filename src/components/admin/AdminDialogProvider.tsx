"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ConfirmTone = "default" | "danger";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (confirmed: boolean) => void;
};

type AdminDialogContextValue = (options: ConfirmOptions) => Promise<boolean>;

const AdminDialogContext = createContext<AdminDialogContextValue | null>(null);

function ConfirmDialog({ dialog, onClose }: { dialog: PendingConfirm; onClose: (confirmed: boolean) => void }) {
  const cancelButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelButton.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const danger = dialog.tone === "danger";

  return (
    <div className="admin-confirm-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(false); }}>
      <section className={`admin-confirm-dialog${danger ? " is-danger" : ""}`} role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-title" aria-describedby="admin-confirm-description">
        <div className="admin-confirm-mark" aria-hidden="true">{danger ? "!" : "?"}</div>
        <div className="admin-confirm-copy">
          <span>{danger ? "주의가 필요한 작업" : "계속하기 전 확인"}</span>
          <h2 id="admin-confirm-title">{dialog.title}</h2>
          <p id="admin-confirm-description">{dialog.description}</p>
        </div>
        <div className="admin-confirm-actions">
          <button ref={cancelButton} type="button" className="admin-btn admin-btn-secondary" onClick={() => onClose(false)}>{dialog.cancelLabel || "취소"}</button>
          <button type="button" className={`admin-btn admin-confirm-submit${danger ? " is-danger" : ""}`} onClick={() => onClose(true)}>{dialog.confirmLabel || "계속"}</button>
        </div>
      </section>
    </div>
  );
}

export default function AdminDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<PendingConfirm | null>(null);
  const dialogRef = useRef<PendingConfirm | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const requestConfirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    dialogRef.current?.resolve(false);
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const pending = { ...options, resolve };
    dialogRef.current = pending;
    setDialog(pending);
  }), []);

  const closeDialog = useCallback((confirmed: boolean) => {
    const pending = dialogRef.current;
    if (!pending) return;
    dialogRef.current = null;
    setDialog(null);
    pending.resolve(confirmed);
    window.requestAnimationFrame(() => returnFocus.current?.focus());
  }, []);

  useEffect(() => () => dialogRef.current?.resolve(false), []);

  return (
    <AdminDialogContext.Provider value={requestConfirm}>
      {children}
      {dialog && <ConfirmDialog dialog={dialog} onClose={closeDialog} />}
    </AdminDialogContext.Provider>
  );
}

export function useAdminConfirm() {
  const context = useContext(AdminDialogContext);
  if (!context) throw new Error("useAdminConfirm must be used inside AdminDialogProvider");
  return context;
}
