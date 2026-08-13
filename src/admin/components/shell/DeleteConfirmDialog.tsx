"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/admin/hooks/useFocusTrap";

const HOLD_DURATION_MS = 1500;

type DeleteConfirmDialogProps = {
  title: string;
  description: string;
  confirmValue: string;
  valueLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmDialog({
  title,
  description,
  confirmValue,
  valueLabel,
  busy = false,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [value, setValue] = useState("");
  const [holding, setHolding] = useState(false);
  const [completed, setCompleted] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasBusy = useRef(busy);
  const dialogRef = useFocusTrap<HTMLElement>(true);
  const matches = value === confirmValue;

  const cancelHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHolding(false);
  };

  const startHold = () => {
    if (!matches || busy || completed || holdTimer.current) return;
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      setHolding(false);
      setCompleted(true);
      onConfirm();
    }, HOLD_DURATION_MS);
  };

  useEffect(
    () => () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (wasBusy.current && !busy) setCompleted(false);
    wasBusy.current = busy;
  }, [busy]);

  const buttonLabel = busy
    ? "삭제 중…"
    : completed
      ? "삭제 요청됨…"
      : holding
        ? "계속 누르세요…"
        : matches
          ? "1.5초 길게 눌러 삭제"
          : "이름을 먼저 입력하세요";

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="delete-confirm-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !busy) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        className="delete-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        aria-describedby="delete-confirm-description delete-confirm-hint"
      >
        <div className="delete-confirm-mark">!</div>
        <h2 id="delete-confirm-title">{title}</h2>
        <p
          id="delete-confirm-description"
          className="delete-confirm-description"
        >
          {description}
        </p>
        <div className="delete-confirm-value">
          <span>{valueLabel}</span>
          <strong>{confirmValue}</strong>
        </div>
        <label className="music-field">
          <span>
            확인을 위해 {valueLabel}을(를) 다시 입력하세요.<b>*</b>
          </span>
          <input
            className="admin-input"
            value={value}
            onChange={(event) => {
              cancelHold();
              setValue(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape" && !busy) onCancel();
            }}
            autoFocus
            autoComplete="off"
          />
        </label>
        <p id="delete-confirm-hint" className="delete-confirm-hint">
          이름이 일치하면 삭제 버튼을 1.5초 동안 길게 누르세요.
        </p>
        <div className="delete-confirm-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            취소
          </button>
          <button
            type="button"
            className={`admin-btn delete-confirm-button${holding ? " is-holding" : ""}${completed ? " is-complete" : ""}`}
            disabled={!matches || busy || completed}
            onPointerDown={(event) => {
              if (event.button === 0) {
                event.currentTarget.focus();
                startHold();
              }
            }}
            onPointerUp={cancelHold}
            onPointerCancel={cancelHold}
            onPointerLeave={cancelHold}
            onKeyDown={(event) => {
              if (event.key === "Escape" && !busy) onCancel();
              else if (
                (event.key === " " || event.key === "Enter") &&
                !event.repeat
              ) {
                event.preventDefault();
                startHold();
              }
            }}
            onKeyUp={(event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                cancelHold();
              }
            }}
            onBlur={cancelHold}
            onContextMenu={(event) => event.preventDefault()}
          >
            {buttonLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
