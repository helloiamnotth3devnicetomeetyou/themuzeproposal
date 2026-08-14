"use client";

import { useLocale } from "@/core/providers/LocaleContext";
import styles from "@/styles/(core)/pages/account.module.css";
import { accountCopy } from "./account-copy";
import { AccountContentHeader, AccountHeader } from "./AccountHeader";
import {
  AvatarForm,
  EmailForm,
  ProfileForm,
  SessionPanel,
} from "./AccountBasicForms";
import { PasswordForm } from "./AccountPasswordForm";
import type { AvatarArtistOption } from "./account-types";
import { useAccountState } from "./useAccountState";

export type { AvatarArtistOption } from "./account-types";

export default function AccountClient({
  initialName,
  initialEmail,
  initialAvatarAssetId,
  avatarArtists,
  canChangePassword,
}: {
  initialName: string;
  initialEmail: string;
  initialAvatarAssetId: string | null;
  avatarArtists: AvatarArtistOption[];
  canChangePassword: boolean;
}) {
  const { locale } = useLocale();
  const t = accountCopy[locale] ?? accountCopy.ko;
  const account = useAccountState({
    t,
    initialName,
    initialEmail,
    initialAvatarAssetId,
    avatarArtists,
    canChangePassword,
  });
  const activeMeta =
    account.sections.find((item) => item.id === account.activeSection) ??
    account.sections[0];

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <AccountHeader
          t={t}
          sections={account.sections}
          activeSection={account.activeSection}
          onSectionChange={account.setActiveSection}
          name={account.name}
          originalEmail={account.originalEmail}
          savedAvatarUrl={account.savedAvatarUrl}
        />

        <div className={styles.contentColumn}>
          <AccountContentHeader
            activeMeta={activeMeta}
            activeIndex={account.sections.findIndex(
              (item) => item.id === account.activeSection,
            )}
            totalSections={account.sections.length}
          />

          {account.activeSection === "profile" && (
            <ProfileForm
              t={t}
              name={account.name}
              status={account.profileStatus}
              saving={account.saving}
              onNameChange={account.setName}
              onSubmit={account.handleNameSubmit}
            />
          )}

          {account.activeSection === "avatar" && (
            <AvatarForm
              t={t}
              originalEmail={account.originalEmail}
              avatarArtists={avatarArtists}
              avatarAssetId={account.avatarAssetId}
              savedAvatarAssetId={account.savedAvatarAssetId}
              status={account.avatarStatus}
              saving={account.saving}
              onSelect={(assetId) => {
                account.setAvatarAssetId(assetId);
                account.setAvatarStatus(null);
              }}
              onSubmit={account.handleAvatarSubmit}
            />
          )}

          {account.activeSection === "email" && (
            <EmailForm
              t={t}
              email={account.email}
              status={account.emailStatus}
              saving={account.saving}
              onEmailChange={account.setEmail}
              onSubmit={account.handleEmailSubmit}
            />
          )}

          {canChangePassword && account.activeSection === "password" && (
            <PasswordForm
              t={t}
              currentPassword={account.currentPassword}
              password={account.password}
              passwordConfirm={account.passwordConfirm}
              currentPasswordVerified={account.currentPasswordVerified}
              checkingCurrentPassword={account.checkingCurrentPassword}
              currentPasswordStatus={account.currentPasswordStatus}
              passwordStatus={account.passwordStatus}
              saving={account.saving}
              turnstileRef={account.turnstileRef}
              onTurnstileToken={(token) =>
                account.setTurnstileToken(token ?? "")
              }
              onCurrentPasswordChange={account.handleCurrentPasswordChange}
              onCurrentPasswordBlur={account.handleCurrentPasswordVerification}
              onPasswordChange={account.setPassword}
              onPasswordConfirmChange={account.setPasswordConfirm}
              onSubmit={account.handlePasswordSubmit}
            />
          )}

          {account.activeSection === "session" && (
            <SessionPanel
              t={t}
              originalEmail={account.originalEmail}
              saving={account.saving}
              onSignOut={account.handleSignOut}
            />
          )}
        </div>
      </section>
    </main>
  );
}
