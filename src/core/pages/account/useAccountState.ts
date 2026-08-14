"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
import type { TurnstileWidgetHandle } from "@/core/components/form/TurnstileWidget";
import type {
  AccountCopy,
  AccountSection,
  AccountSectionMeta,
  AvatarArtistOption,
  SavingAction,
  Status,
} from "./account-types";

export function useAccountState({
  t,
  initialName,
  initialEmail,
  initialAvatarAssetId,
  avatarArtists,
  canChangePassword,
}: {
  t: AccountCopy;
  initialName: string;
  initialEmail: string;
  initialAvatarAssetId: string | null;
  avatarArtists: AvatarArtistOption[];
  canChangePassword: boolean;
}) {
  const router = useRouter();
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
  const [saving, setSaving] = useState<SavingAction>(null);
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

  const handleNameSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

  const handleAvatarSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
    turnstileRef.current?.reset();
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

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

  const sections: AccountSectionMeta[] = [
    {
      id: "profile",
      label: t.profileTitle,
      description: t.profileDescription,
      code: "PROFILE",
    },
    {
      id: "avatar",
      label: t.avatarTitle,
      description: t.avatarDescription,
      code: "AVATAR",
    },
    {
      id: "email",
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
      id: "session",
      label: t.sessionTitle,
      description: t.sessionDescription,
      code: "SESSION",
    },
  ];

  return {
    name,
    email,
    originalEmail,
    avatarAssetId,
    savedAvatarAssetId,
    currentPassword,
    password,
    passwordConfirm,
    currentPasswordVerified,
    checkingCurrentPassword,
    saving,
    activeSection,
    profileStatus,
    avatarStatus,
    emailStatus,
    currentPasswordStatus,
    passwordStatus,
    turnstileRef,
    sections,
    savedAvatarUrl: avatarArtists
      .flatMap((artist) => artist.avatars)
      .find((avatar) => avatar.id === savedAvatarAssetId)?.imageUrl,
    setName,
    setEmail,
    setPassword,
    setPasswordConfirm,
    setActiveSection,
    setAvatarAssetId,
    setAvatarStatus,
    setTurnstileToken,
    handleNameSubmit,
    handleEmailSubmit,
    handleAvatarSubmit,
    handleCurrentPasswordChange,
    handleCurrentPasswordVerification,
    handlePasswordSubmit,
    handleSignOut,
  };
}
