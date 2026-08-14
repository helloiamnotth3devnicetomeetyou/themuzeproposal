"use client";

import type { FormEventHandler, RefObject } from "react";
import TurnstileWidget, {
  type TurnstileWidgetHandle,
} from "@/core/components/form/TurnstileWidget";
import styles from "@/styles/(core)/pages/account.module.css";
import { StatusMessage } from "./AccountBasicForms";
import type { AccountCopy, SavingAction, Status } from "./account-types";

export function PasswordForm({
  t,
  currentPassword,
  password,
  passwordConfirm,
  currentPasswordVerified,
  checkingCurrentPassword,
  currentPasswordStatus,
  passwordStatus,
  saving,
  turnstileRef,
  onTurnstileToken,
  onCurrentPasswordChange,
  onCurrentPasswordBlur,
  onPasswordChange,
  onPasswordConfirmChange,
  onSubmit,
}: {
  t: AccountCopy;
  currentPassword: string;
  password: string;
  passwordConfirm: string;
  currentPasswordVerified: boolean;
  checkingCurrentPassword: boolean;
  currentPasswordStatus: Status;
  passwordStatus: Status;
  saving: SavingAction;
  turnstileRef: RefObject<TurnstileWidgetHandle | null>;
  onTurnstileToken: (token: string | null) => void;
  onCurrentPasswordChange: (value: string) => void;
  onCurrentPasswordBlur: () => void;
  onPasswordChange: (value: string) => void;
  onPasswordConfirmChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.formRow}>
        <label htmlFor="account-current-password">{t.currentPassword}</label>
        <input
          id="account-current-password"
          type="password"
          value={currentPassword}
          onChange={(event) => onCurrentPasswordChange(event.target.value)}
          onBlur={onCurrentPasswordBlur}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          required
          autoComplete="current-password"
          aria-describedby="current-password-guide current-password-status"
        />
      </div>
      <TurnstileWidget
        ref={turnstileRef}
        onToken={(token) => onTurnstileToken(token)}
        action="verify_password"
        size="invisible"
      />
      <p id="current-password-guide" className={styles.guide}>
        {t.currentPasswordHint}
      </p>
      {checkingCurrentPassword && (
        <span
          id="current-password-status"
          role="status"
          className={`${styles.status} ${styles.checking}`}
        >
          {t.currentPasswordChecking}
        </span>
      )}
      <StatusMessage
        id="current-password-status"
        status={currentPasswordStatus}
      />
      <div className={styles.formRow}>
        <label htmlFor="account-password">{t.newPassword}</label>
        <input
          id="account-password"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          required
          minLength={12}
          autoComplete="new-password"
          disabled={!currentPasswordVerified}
        />
      </div>
      <div className={styles.formRow}>
        <label htmlFor="account-password-confirm">{t.confirmPassword}</label>
        <input
          id="account-password-confirm"
          type="password"
          value={passwordConfirm}
          onChange={(event) => onPasswordConfirmChange(event.target.value)}
          required
          minLength={12}
          autoComplete="new-password"
          disabled={!currentPasswordVerified}
        />
      </div>
      <p className={styles.guide}>{t.passwordHint}</p>
      <StatusMessage status={passwordStatus} />
      <button
        className={styles.submit}
        type="submit"
        disabled={
          saving !== null || checkingCurrentPassword || !currentPasswordVerified
        }
      >
        {saving === "password" ? t.saving : t.changePassword}
      </button>
    </form>
  );
}
