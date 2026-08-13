"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  onDelete: () => void;
  disabled?: boolean;
  deleteLabel?: string;
  label?: string;
};

export default function OverflowDeleteMenu({
  onDelete,
  disabled = false,
  deleteLabel = "삭제",
  label = "더보기",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    deleteRef.current?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="admin-overflow-menu">
      <button
        ref={triggerRef}
        type="button"
        data-tour-id="editor-more-actions"
        className="admin-btn admin-btn-secondary admin-overflow-trigger"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal aria-hidden="true" />
      </button>
      {open && (
        <div
          className="admin-overflow-menu-list"
          role="menu"
          aria-label={label}
        >
          <button
            ref={deleteRef}
            type="button"
            data-tour-id="entity-delete"
            role="menuitem"
            className="admin-overflow-delete"
            onClick={() => {
              close();
              onDelete();
            }}
          >
            <Trash2 aria-hidden="true" />
            {deleteLabel}
          </button>
        </div>
      )}
    </div>
  );
}
