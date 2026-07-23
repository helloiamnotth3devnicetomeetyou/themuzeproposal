"use client";

import type { ReactNode } from "react";
import { LuCheck } from "react-icons/lu";

export type WizardStep = {
  title: string;
  description: string;
};

type WizardProps = {
  title: string;
  description: string;
  steps: WizardStep[];
  step: number;
  children: ReactNode;
  canContinue?: boolean;
  busy?: boolean;
  error?: string | null;
  completeLabel?: string;
  onStepChange: (step: number) => void;
  onCancel: () => void;
  onComplete: () => void;
};

export default function Wizard({
  title,
  description,
  steps,
  step,
  children,
  canContinue = true,
  busy = false,
  error,
  completeLabel = "저장하기",
  onStepChange,
  onCancel,
  onComplete,
}: WizardProps) {
  const isLast = step === steps.length - 1;

  return (
    <section className="cms-wizard" aria-label={title}>
      <div className="cms-wizard-heading">
        <div>
          <span>STEP {String(step + 1).padStart(2, "0")}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <button type="button" className="cms-wizard-close" onClick={onCancel}>닫기</button>
      </div>

      <ol className="cms-wizard-steps">
        {steps.map((item, index) => {
          const state = index < step ? "is-complete" : index === step ? "is-current" : "";
          return (
            <li key={item.title} className={state}>
              <button type="button" onClick={() => index <= step && onStepChange(index)} disabled={index > step}>
                <i>{index < step ? <LuCheck aria-hidden="true" /> : index + 1}</i>
                <span><b>{item.title}</b><small>{item.description}</small></span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="cms-wizard-body">{children}</div>

      {error && <p className="cms-form-error" role="alert">{error}</p>}
      <div className="cms-wizard-footer">
        <p>{step + 1} / {steps.length}</p>
        <div>
          {step > 0 && <button type="button" className="admin-btn admin-btn-secondary" onClick={() => onStepChange(step - 1)}>이전</button>}
          {!isLast ? (
            <button type="button" className="admin-btn admin-btn-primary" disabled={!canContinue} onClick={() => canContinue && onStepChange(step + 1)}>다음</button>
          ) : (
            <button type="button" className="admin-btn admin-btn-primary" disabled={busy || !canContinue} onClick={onComplete}>
              {busy ? "저장 중..." : completeLabel}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
