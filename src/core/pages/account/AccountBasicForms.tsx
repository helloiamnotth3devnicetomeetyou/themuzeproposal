"use client";

import Image from "next/image";
import { Check, LogOut } from "lucide-react";
import type { FormEventHandler } from "react";
import styles from "@/styles/(core)/pages/account.module.css";
import type {
  AccountCopy,
  AvatarArtistOption,
  SavingAction,
  Status,
} from "./account-types";

export function StatusMessage({ status, id }: { status: Status; id?: string }) {
  if (!status) return null;
  return (
    <span
      id={id}
      role="status"
      className={`${styles.status} ${status.type === "success" ? styles.success : styles.error}`}
    >
      {status.message}
    </span>
  );
}

export function ProfileForm({
  t,
  name,
  status,
  saving,
  onNameChange,
  onSubmit,
}: {
  t: AccountCopy;
  name: string;
  status: Status;
  saving: SavingAction;
  onNameChange: (name: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.formRow}>
        <label htmlFor="account-name">{t.name}</label>
        <input
          id="account-name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          required
          autoComplete="name"
          maxLength={80}
        />
      </div>
      <StatusMessage status={status} />
      <button
        className={styles.submit}
        type="submit"
        disabled={saving !== null}
      >
        {saving === "name" ? t.saving : t.saveName}
      </button>
    </form>
  );
}

export function AvatarForm({
  t,
  originalEmail,
  avatarArtists,
  avatarAssetId,
  savedAvatarAssetId,
  status,
  saving,
  onSelect,
  onSubmit,
}: {
  t: AccountCopy;
  originalEmail: string;
  avatarArtists: AvatarArtistOption[];
  avatarAssetId: string | null;
  savedAvatarAssetId: string | null;
  status: Status;
  saving: SavingAction;
  onSelect: (assetId: string | null) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form className={styles.avatarForm} onSubmit={onSubmit}>
      <div className={styles.avatarGroups}>
        <section className={styles.avatarGroup}>
          <h3>{t.defaultAvatar}</h3>
          <div>
            <button
              type="button"
              className={`${styles.defaultAvatarTile} ${avatarAssetId === null ? styles.selectedAvatar : ""}`}
              aria-label={t.defaultAvatar}
              aria-pressed={avatarAssetId === null}
              onClick={() => onSelect(null)}
            >
              <b aria-hidden="true">
                {(originalEmail.trim()[0] || "M").toUpperCase()}
              </b>
              {avatarAssetId === null && (
                <span>
                  <Check aria-hidden="true" />
                </span>
              )}
            </button>
          </div>
        </section>
        {avatarArtists.map((artist) => (
          <section key={artist.id} className={styles.avatarGroup}>
            <h3>{artist.name}</h3>
            <div>
              {artist.avatars.map((avatar, index) => (
                <button
                  key={avatar.id}
                  type="button"
                  className={
                    avatarAssetId === avatar.id ? styles.selectedAvatar : ""
                  }
                  aria-label={`${artist.name} ${index + 1}`}
                  aria-pressed={avatarAssetId === avatar.id}
                  onClick={() => onSelect(avatar.id)}
                >
                  <Image
                    src={avatar.imageUrl}
                    alt=""
                    width={180}
                    height={180}
                    sizes="(max-width: 767px) 28vw, 140px"
                  />
                  {avatarAssetId === avatar.id && (
                    <span>
                      <Check aria-hidden="true" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      {!avatarArtists.length && (
        <p className={styles.avatarEmpty}>{t.noAvatars}</p>
      )}
      <StatusMessage status={status} />
      <button
        className={styles.submit}
        type="submit"
        disabled={saving !== null || avatarAssetId === savedAvatarAssetId}
      >
        {saving === "avatar" ? t.saving : t.saveAvatar}
      </button>
    </form>
  );
}

export function EmailForm({
  t,
  email,
  status,
  saving,
  onEmailChange,
  onSubmit,
}: {
  t: AccountCopy;
  email: string;
  status: Status;
  saving: SavingAction;
  onEmailChange: (email: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.formRow}>
        <label htmlFor="account-email">{t.email}</label>
        <input
          id="account-email"
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <p className={styles.guide}>{t.emailHint}</p>
      <StatusMessage status={status} />
      <button
        className={styles.submit}
        type="submit"
        disabled={saving !== null}
      >
        {saving === "email" ? t.saving : t.saveEmail}
      </button>
    </form>
  );
}

export function SessionPanel({
  t,
  originalEmail,
  saving,
  onSignOut,
}: {
  t: AccountCopy;
  originalEmail: string;
  saving: SavingAction;
  onSignOut: () => void | Promise<void>;
}) {
  return (
    <section className={styles.session}>
      <div>
        <span>CURRENT DEVICE</span>
        <h3>{originalEmail}</h3>
        <p>{t.sessionDescription}</p>
      </div>
      <button
        className={styles.signOut}
        type="button"
        onClick={onSignOut}
        disabled={saving !== null}
      >
        <LogOut aria-hidden="true" />
        {saving === "logout" ? t.saving : t.signOut}
      </button>
    </section>
  );
}
