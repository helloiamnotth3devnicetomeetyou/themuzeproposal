"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LogOut } from "lucide-react";
import { useLocale } from "@/core/providers/LocaleContext";
import {
  AuthUserError,
  CurrentPasswordError,
  signOut,
  updateUserAvatar,
  updateUserEmail,
  updateUserName,
  updateUserPassword,
  verifyCurrentPassword,
} from "@/core/auth/auth";
import TurnstileWidget, {
  type TurnstileWidgetHandle,
} from "@/core/components/form/TurnstileWidget";
import styles from "@/styles/(core)/pages/account.module.css";
import { accountCopy } from "./account-copy";

type Status = { type: "success" | "error"; message: string } | null;
type AccountSection = "profile" | "avatar" | "email" | "password" | "session";

export type AvatarArtistOption = {
  id: string;
  name: string;
  avatars: Array<{ id: string; imageUrl: string }>;
};

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
  const router = useRouter();
  const { locale } = useLocale();
  const t = accountCopy[locale] ?? accountCopy.ko;
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [originalEmail] = useState(initialEmail);
  const [avatarAssetId, setAvatarAssetId] = useState<string | null>(
    initialAvatarAssetId,
  );
  const [savedAvatarAssetId, setSavedAvatarAssetId] = useState<string | null>(
    initialAvatarAssetId,
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false);
  const [checkingCurrentPassword, setCheckingCurrentPassword] = useState(false);
  const [saving, setSaving] = useState<
    "name" | "avatar" | "email" | "password" | "logout" | null
  >(null);
  const [activeSection, setActiveSection] = useState<AccountSection>("profile");
  const [profileStatus, setProfileStatus] = useState<Status>(null);
  const [avatarStatus, setAvatarStatus] = useState<Status>(null);
  const [emailStatus, setEmailStatus] = useState<Status>(null);
  const [currentPasswordStatus, setCurrentPasswordStatus] =
    useState<Status>(null);
  const [passwordStatus, setPasswordStatus] = useState<Status>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const passwordVerificationRequest = useRef(0);
  const lastPasswordVerification = useRef("");
  const pendingVerifyCandidate = useRef<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const errorMessage = (error: unknown) =>
    error instanceof Error ? error.message : t.genericError;

  const handleNameSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileStatus(null);
    setSaving("name");
    try {
      const user = await updateUserName(name);
      setName(user.user_metadata?.name || name.trim());
      setProfileStatus({ type: "success", message: t.nameSaved });
    } catch (error) {
      setProfileStatus({ type: "error", message: errorMessage(error) });
    } finally {
      setSaving(null);
    }
  };

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setEmailStatus(null);
    if (email.trim().toLowerCase() === originalEmail.toLowerCase()) {
      setEmailStatus({ type: "error", message: t.sameEmail });
      return;
    }

    setSaving("email");
    try {
      await updateUserEmail(email);
      setEmailStatus({ type: "success", message: t.emailSent });
    } catch (error) {
      setEmailStatus({ type: "error", message: errorMessage(error) });
    } finally {
      setSaving(null);
    }
  };

  const handleAvatarSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAvatarStatus(null);
    setSaving("avatar");
    try {
      const savedAvatar = await updateUserAvatar(avatarAssetId);
      setAvatarAssetId(savedAvatar);
      setSavedAvatarAssetId(savedAvatar);
      setAvatarStatus({ type: "success", message: t.avatarSaved });
    } catch (error) {
      setAvatarStatus({ type: "error", message: errorMessage(error) });
    } finally {
      setSaving(null);
    }
  };

  const handleCurrentPasswordChange = (value: string) => {
    passwordVerificationRequest.current += 1;
    lastPasswordVerification.current = "";
    pendingVerifyCandidate.current = null;
    setCurrentPassword(value);
    setCurrentPasswordVerified(false);
    setCheckingCurrentPassword(false);
    setCurrentPasswordStatus(null);
    setPassword("");
    setPasswordConfirm("");
    setPasswordStatus(null);
  };

  const runCurrentPasswordVerification = async (
    candidate: string,
    token: string,
  ) => {
    const requestId = passwordVerificationRequest.current + 1;
    passwordVerificationRequest.current = requestId;
    lastPasswordVerification.current = candidate;
    setCheckingCurrentPassword(true);
    setCurrentPasswordStatus(null);

    try {
      await verifyCurrentPassword(candidate, token);
      if (passwordVerificationRequest.current !== requestId) return;
      setCurrentPasswordVerified(true);
      setCurrentPasswordStatus({
        type: "success",
        message: t.currentPasswordVerified,
      });
    } catch (error) {
      if (passwordVerificationRequest.current !== requestId) return;
      setCurrentPasswordVerified(false);
      const isCaptchaFailure =
        error instanceof AuthUserError && error.code === "CAPTCHA_FAILED";
      setCurrentPasswordStatus({
        type: "error",
        message: isCaptchaFailure
          ? t.captchaFailed
          : error instanceof CurrentPasswordError
            ? t.currentPasswordInvalid
            : errorMessage(error),
      });
    } finally {
      if (passwordVerificationRequest.current === requestId)
        setCheckingCurrentPassword(false);
      setTurnstileToken("");
      turnstileRef.current?.reset();
    }
  };

  const handleCurrentPasswordVerification = () => {
    const candidate = currentPassword;
    if (
      !candidate ||
      checkingCurrentPassword ||
      lastPasswordVerification.current === candidate
    )
      return;
    pendingVerifyCandidate.current = candidate;
    turnstileRef.current?.execute();
  };

  useEffect(() => {
    if (!turnstileToken || !pendingVerifyCandidate.current) return;
    const candidate = pendingVerifyCandidate.current;
    pendingVerifyCandidate.current = null;
    void runCurrentPasswordVerification(candidate, turnstileToken);
    // runCurrentPasswordVerification is stable across renders in practice; re-running
    // this effect only on token changes avoids re-triggering verification mid-flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnstileToken]);

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordStatus(null);
    if (!currentPasswordVerified) {
      setPasswordStatus({ type: "error", message: t.currentPasswordRequired });
      return;
    }
    if (password.length < 12) {
      setPasswordStatus({ type: "error", message: t.passwordLength });
      return;
    }
    if (password !== passwordConfirm) {
      setPasswordStatus({ type: "error", message: t.passwordMismatch });
      return;
    }

    setSaving("password");
    try {
      await updateUserPassword(currentPassword, password);
      passwordVerificationRequest.current += 1;
      lastPasswordVerification.current = "";
      setCurrentPassword("");
      setCurrentPasswordVerified(false);
      setCurrentPasswordStatus(null);
      setPassword("");
      setPasswordConfirm("");
      setPasswordStatus({ type: "success", message: t.passwordSaved });
    } catch (error) {
      if (error instanceof CurrentPasswordError) {
        setCurrentPasswordVerified(false);
        setCurrentPasswordStatus({
          type: "error",
          message: t.currentPasswordInvalid,
        });
        setPasswordStatus(null);
      } else {
        setPasswordStatus({ type: "error", message: errorMessage(error) });
      }
    } finally {
      setSaving(null);
    }
  };

  const handleSignOut = async () => {
    setSaving("logout");
    try {
      await signOut();
      router.replace("/");
      router.refresh();
    } finally {
      setSaving(null);
    }
  };

  const sections = [
    {
      id: "profile" as const,
      label: t.profileTitle,
      description: t.profileDescription,
      code: "PROFILE",
    },
    {
      id: "avatar" as const,
      label: t.avatarTitle,
      description: t.avatarDescription,
      code: "AVATAR",
    },
    {
      id: "email" as const,
      label: t.emailTitle,
      description: t.emailDescription,
      code: "SIGN-IN ID",
    },
    ...(canChangePassword
      ? [
          {
            id: "password" as const,
            label: t.passwordTitle,
            description: t.passwordDescription,
            code: "SECURITY",
          },
        ]
      : []),
    {
      id: "session" as const,
      label: t.sessionTitle,
      description: t.sessionDescription,
      code: "SESSION",
    },
  ];
  const activeMeta =
    sections.find((item) => item.id === activeSection) ?? sections[0];
  const savedAvatarUrl = avatarArtists
    .flatMap((artist) => artist.avatars)
    .find((avatar) => avatar.id === savedAvatarAssetId)?.imageUrl;

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerSticky}>
            <h1>ACCOUNT</h1>
            <p>{t.intro}</p>
            <nav className={styles.tabs} aria-label="Account settings">
              {sections.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={activeSection === item.id ? styles.activeTab : ""}
                  onClick={() => setActiveSection(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className={styles.accountMeta}>
              <div className={styles.accountMetaAvatar}>
                {savedAvatarUrl ? (
                  <Image
                    src={savedAvatarUrl}
                    alt={`${name || "사용자"} 아바타`}
                    width={58}
                    height={58}
                    sizes="58px"
                  />
                ) : (
                  <b aria-hidden="true">
                    {(originalEmail.trim()[0] || "M").toUpperCase()}
                  </b>
                )}
              </div>
              <div className={styles.accountMetaCopy}>
                <span>{name || "THE MUZE"}</span>
                <b>{originalEmail}</b>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.contentColumn}>
          <header className={styles.contentHeader}>
            <div>
              <h2>{activeMeta.label}</h2>
              <p>{activeMeta.description}</p>
            </div>
            <em>
              {String(
                sections.findIndex((item) => item.id === activeSection) + 1,
              ).padStart(2, "0")}{" "}
              / {String(sections.length).padStart(2, "0")}
            </em>
          </header>

          {activeSection === "profile" && (
            <form className={styles.form} onSubmit={handleNameSubmit}>
              <div className={styles.formRow}>
                <label htmlFor="account-name">{t.name}</label>
                <input
                  id="account-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  autoComplete="name"
                  maxLength={80}
                />
              </div>
              {profileStatus && (
                <span
                  role="status"
                  className={`${styles.status} ${profileStatus.type === "success" ? styles.success : styles.error}`}
                >
                  {profileStatus.message}
                </span>
              )}
              <button
                className={styles.submit}
                type="submit"
                disabled={saving !== null}
              >
                {saving === "name" ? t.saving : t.saveName}
              </button>
            </form>
          )}

          {activeSection === "avatar" && (
            <form className={styles.avatarForm} onSubmit={handleAvatarSubmit}>
              <div className={styles.avatarGroups}>
                <section className={styles.avatarGroup}>
                  <h3>{t.defaultAvatar}</h3>
                  <div>
                    <button
                      type="button"
                      className={`${styles.defaultAvatarTile} ${avatarAssetId === null ? styles.selectedAvatar : ""}`}
                      aria-label={t.defaultAvatar}
                      aria-pressed={avatarAssetId === null}
                      onClick={() => {
                        setAvatarAssetId(null);
                        setAvatarStatus(null);
                      }}
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
                            avatarAssetId === avatar.id
                              ? styles.selectedAvatar
                              : ""
                          }
                          aria-label={`${artist.name} ${index + 1}`}
                          aria-pressed={avatarAssetId === avatar.id}
                          onClick={() => {
                            setAvatarAssetId(avatar.id);
                            setAvatarStatus(null);
                          }}
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
              {avatarStatus && (
                <span
                  role="status"
                  className={`${styles.status} ${avatarStatus.type === "success" ? styles.success : styles.error}`}
                >
                  {avatarStatus.message}
                </span>
              )}
              <button
                className={styles.submit}
                type="submit"
                disabled={
                  saving !== null || avatarAssetId === savedAvatarAssetId
                }
              >
                {saving === "avatar" ? t.saving : t.saveAvatar}
              </button>
            </form>
          )}

          {activeSection === "email" && (
            <form className={styles.form} onSubmit={handleEmailSubmit}>
              <div className={styles.formRow}>
                <label htmlFor="account-email">{t.email}</label>
                <input
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <p className={styles.guide}>{t.emailHint}</p>
              {emailStatus && (
                <span
                  role="status"
                  className={`${styles.status} ${emailStatus.type === "success" ? styles.success : styles.error}`}
                >
                  {emailStatus.message}
                </span>
              )}
              <button
                className={styles.submit}
                type="submit"
                disabled={saving !== null}
              >
                {saving === "email" ? t.saving : t.saveEmail}
              </button>
            </form>
          )}

          {canChangePassword && activeSection === "password" && (
            <form className={styles.form} onSubmit={handlePasswordSubmit}>
              <div className={styles.formRow}>
                <label htmlFor="account-current-password">
                  {t.currentPassword}
                </label>
                <input
                  id="account-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) =>
                    handleCurrentPasswordChange(event.target.value)
                  }
                  onBlur={handleCurrentPasswordVerification}
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
                onToken={(token) => setTurnstileToken(token ?? "")}
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
              {currentPasswordStatus && (
                <span
                  id="current-password-status"
                  role="status"
                  className={`${styles.status} ${currentPasswordStatus.type === "success" ? styles.success : styles.error}`}
                >
                  {currentPasswordStatus.message}
                </span>
              )}
              <div className={styles.formRow}>
                <label htmlFor="account-password">{t.newPassword}</label>
                <input
                  id="account-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={12}
                  autoComplete="new-password"
                  disabled={!currentPasswordVerified}
                />
              </div>
              <div className={styles.formRow}>
                <label htmlFor="account-password-confirm">
                  {t.confirmPassword}
                </label>
                <input
                  id="account-password-confirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  required
                  minLength={12}
                  autoComplete="new-password"
                  disabled={!currentPasswordVerified}
                />
              </div>
              <p className={styles.guide}>{t.passwordHint}</p>
              {passwordStatus && (
                <span
                  role="status"
                  className={`${styles.status} ${passwordStatus.type === "success" ? styles.success : styles.error}`}
                >
                  {passwordStatus.message}
                </span>
              )}
              <button
                className={styles.submit}
                type="submit"
                disabled={
                  saving !== null ||
                  checkingCurrentPassword ||
                  !currentPasswordVerified
                }
              >
                {saving === "password" ? t.saving : t.changePassword}
              </button>
            </form>
          )}

          {activeSection === "session" && (
            <section className={styles.session}>
              <div>
                <span>CURRENT DEVICE</span>
                <h3>{originalEmail}</h3>
                <p>{t.sessionDescription}</p>
              </div>
              <button
                className={styles.signOut}
                type="button"
                onClick={handleSignOut}
                disabled={saving !== null}
              >
                <LogOut aria-hidden="true" />
                {saving === "logout" ? t.saving : t.signOut}
              </button>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
