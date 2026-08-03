"use client";

import { useEffect, useRef, useState } from "react";

const HOLD_DURATION_MS = 1500;

type AuditionSaveWarningDialogProps = {
  title: string;
  submissionCount: number;
  confirmValue: string;
  valueLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function AuditionSaveWarningDialog({
  title,
  submissionCount,
  confirmValue,
  valueLabel,
  busy = false,
  onCancel,
  onConfirm,
}: AuditionSaveWarningDialogProps) {
  const [value, setValue] = useState("");
  const [holding, setHolding] = useState(false);
  const [completed, setCompleted] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasBusy = useRef(busy);
  const matches = value.trim() === confirmValue.trim();

  const cancelHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
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

  useEffect(() => () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  }, []);

  useEffect(() => {
    if (wasBusy.current && !busy) setCompleted(false);
    wasBusy.current = busy;
  }, [busy]);

  const buttonLabel = busy
    ? "저장 중…"
    : completed
      ? "저장 진행 중…"
      : holding
        ? "계속 누르세요…"
        : matches
          ? "1.5초 길게 눌러 저장"
          : "제목을 먼저 입력하세요";

  return (
    <div className="delete-confirm-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target && !busy) onCancel(); }}>
      <section className="delete-confirm-dialog is-warning" role="dialog" aria-modal="true" aria-labelledby="audition-warn-title">
        <div className="delete-confirm-mark is-warning">!</div>
        <h2 id="audition-warn-title">{title}</h2>
        <p className="delete-confirm-description">
          현재 진행 중인 오디션 세션이며, 이미 <strong>{submissionCount}개</strong>의 지원서가 접수되었습니다.
          <br />
          설정을 변경하면 기존 제출된 지원서의 질문 항목과 양식이 달라질 수 있습니다.
        </p>
        <div className="delete-confirm-value"><span>{valueLabel}</span><strong>{confirmValue}</strong></div>
        <label className="music-field">
          <span>확인을 위해 {valueLabel}을 정확히 입력하세요 <b>*</b></span>
          <input
            className="admin-input"
            value={value}
            onChange={(event) => {
              cancelHold();
              setValue(event.target.value);
            }}
            onKeyDown={(event) => { if (event.key === "Escape" && !busy) onCancel(); }}
            autoFocus
            autoComplete="off"
          />
        </label>
        <p className="delete-confirm-hint">오디션 제목이 일치하면 버튼을 1.5초 동안 길게 누르세요.</p>
        <div className="delete-confirm-actions">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onCancel} disabled={busy}>취소</button>
          <button
            type="button"
            className={`admin-btn delete-confirm-button is-warning-btn${holding ? " is-holding" : ""}${completed ? " is-complete" : ""}`}
            disabled={!matches || busy || completed}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              event.currentTarget.focus();
              startHold();
            }}
            onPointerUp={cancelHold}
            onPointerCancel={cancelHold}
            onPointerLeave={cancelHold}
            onKeyDown={(event) => {
              if (event.key === "Escape" && !busy) {
                onCancel();
                return;
              }
              if ((event.key === " " || event.key === "Enter") && !event.repeat) {
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
    </div>
  );
}
