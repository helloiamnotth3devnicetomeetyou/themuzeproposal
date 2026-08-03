"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { useLocale } from "@/core/providers/LocaleContext";
import {
  CurrentPasswordError,
  signOut,
  updateUserEmail,
  updateUserName,
  updateUserPassword,
  verifyCurrentPassword,
} from "@/core/auth/auth";
import styles from "@/styles/(core)/pages/account.module.css";

type Status = { type: "success" | "error"; message: string } | null;
type AccountSection = "profile" | "email" | "password" | "session";

const copy = {
  ko: {
    eyebrow: "ACCOUNT / PERSONAL ARCHIVE",
    title: "계정 설정",
    titleAccent: "",
    intro: "이름과 로그인 정보를 최신 상태로 관리하세요. 변경한 정보는 이 계정을 사용하는 모든 곳에 반영됩니다.",
    profileTitle: "기본 정보",
    profileDescription: "서비스에서 사용할 이름입니다.",
    name: "이름",
    saveName: "이름 저장",
    nameSaved: "이름을 저장했습니다.",
    emailTitle: "이메일",
    emailDescription: "로그인과 계정 알림에 사용합니다.",
    email: "이메일 주소",
    emailHint: "새 주소로 전송된 인증 링크를 확인해야 변경이 완료됩니다.",
    saveEmail: "이메일 변경",
    sameEmail: "현재 이메일과 같은 주소입니다.",
    emailSent: "새 이메일로 인증 링크를 보냈습니다.",
    passwordTitle: "비밀번호",
    passwordDescription: "안전한 비밀번호로 주기적으로 변경하세요.",
    currentPassword: "현재 비밀번호",
    currentPasswordHint: "현재 비밀번호를 먼저 입력하세요. 입력을 마치면 자동으로 확인합니다.",
    currentPasswordChecking: "현재 비밀번호를 확인하는 중입니다.",
    currentPasswordVerified: "현재 비밀번호를 확인했습니다.",
    currentPasswordRequired: "현재 비밀번호 확인을 먼저 완료하세요.",
    newPassword: "새 비밀번호",
    confirmPassword: "새 비밀번호 확인",
    passwordHint: "현재 비밀번호를 확인한 뒤 8자 이상의 새 비밀번호로 변경합니다.",
    changePassword: "비밀번호 변경",
    passwordLength: "비밀번호는 8자 이상이어야 합니다.",
    passwordMismatch: "비밀번호가 일치하지 않습니다.",
    currentPasswordInvalid: "현재 비밀번호가 올바르지 않습니다.",
    passwordSaved: "비밀번호를 변경했습니다.",
    sessionTitle: "세션",
    sessionDescription: "이 기기에서 계정 사용을 마칩니다.",
    signOut: "로그아웃",
    saving: "저장 중",
    loadError: "계정 정보를 불러오지 못했습니다.",
    genericError: "변경 내용을 저장하지 못했습니다.",
    loading: "계정 정보를 불러오는 중",
  },
  en: {
    eyebrow: "ACCOUNT / PERSONAL ARCHIVE",
    title: "Account settings",
    titleAccent: "",
    intro: "Keep your name and sign-in details current. Updates apply everywhere you use this account.",
    profileTitle: "Profile",
    profileDescription: "The name shown across the service.",
    name: "NAME",
    saveName: "SAVE NAME",
    nameSaved: "Your name has been saved.",
    emailTitle: "Email",
    emailDescription: "Used for sign-in and account messages.",
    email: "EMAIL ADDRESS",
    emailHint: "Open the verification link sent to your new address to finish the change.",
    saveEmail: "CHANGE EMAIL",
    sameEmail: "This is already your current email.",
    emailSent: "A verification link was sent to your new email.",
    passwordTitle: "Password",
    passwordDescription: "Refresh it regularly to keep your account secure.",
    currentPassword: "CURRENT PASSWORD",
    currentPasswordHint: "Enter your current password first. It will be checked when you finish typing.",
    currentPasswordChecking: "Checking your current password.",
    currentPasswordVerified: "Your current password has been verified.",
    currentPasswordRequired: "Verify your current password first.",
    newPassword: "NEW PASSWORD",
    confirmPassword: "CONFIRM NEW PASSWORD",
    passwordHint: "Confirm your current password, then use at least 8 characters for the new password.",
    changePassword: "CHANGE PASSWORD",
    passwordLength: "Password must be at least 8 characters.",
    passwordMismatch: "Passwords do not match.",
    currentPasswordInvalid: "The current password is incorrect.",
    passwordSaved: "Your password has been changed.",
    sessionTitle: "Session",
    sessionDescription: "Finish using this account on this device.",
    signOut: "SIGN OUT",
    saving: "SAVING",
    loadError: "We couldn't load your account.",
    genericError: "We couldn't save your changes.",
    loading: "Loading your account",
  },
  ja: {
    eyebrow: "ACCOUNT / PERSONAL ARCHIVE",
    title: "アカウント設定",
    titleAccent: "",
    intro: "名前とログイン情報を最新の状態に保ちます。変更内容は、このアカウントを使うすべての場所に反映されます。",
    profileTitle: "基本情報",
    profileDescription: "サービスに表示される名前です。",
    name: "名前",
    saveName: "名前を保存",
    nameSaved: "名前を保存しました。",
    emailTitle: "メール",
    emailDescription: "ログインとアカウント通知に使用します。",
    email: "メールアドレス",
    emailHint: "新しいアドレスに届く認証リンクを開くと変更が完了します。",
    saveEmail: "メールを変更",
    sameEmail: "現在のメールアドレスと同じです。",
    emailSent: "新しいメールアドレスに認証リンクを送りました。",
    passwordTitle: "パスワード",
    passwordDescription: "安全のため定期的に更新してください。",
    currentPassword: "現在のパスワード",
    currentPasswordHint: "最初に現在のパスワードを入力してください。入力後に自動で確認します。",
    currentPasswordChecking: "現在のパスワードを確認しています。",
    currentPasswordVerified: "現在のパスワードを確認しました。",
    currentPasswordRequired: "最初に現在のパスワードを確認してください。",
    newPassword: "新しいパスワード",
    confirmPassword: "新しいパスワード（確認）",
    passwordHint: "現在のパスワードを確認し、8文字以上の新しいパスワードを入力してください。",
    changePassword: "パスワードを変更",
    passwordLength: "パスワードは8文字以上必要です。",
    passwordMismatch: "パスワードが一致しません。",
    currentPasswordInvalid: "現在のパスワードが正しくありません。",
    passwordSaved: "パスワードを変更しました。",
    sessionTitle: "セッション",
    sessionDescription: "この端末でのアカウント利用を終了します。",
    signOut: "ログアウト",
    saving: "保存中",
    loadError: "アカウント情報を読み込めませんでした。",
    genericError: "変更を保存できませんでした。",
    loading: "アカウント情報を読み込み中",
  },
};

export default function AccountClient({ initialName, initialEmail }: { initialName: string; initialEmail: string }) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = copy[locale] ?? copy.ko;
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [originalEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false);
  const [checkingCurrentPassword, setCheckingCurrentPassword] = useState(false);
  const [saving, setSaving] = useState<"name" | "email" | "password" | "logout" | null>(null);
  const [activeSection, setActiveSection] = useState<AccountSection>("profile");
  const [profileStatus, setProfileStatus] = useState<Status>(null);
  const [emailStatus, setEmailStatus] = useState<Status>(null);
  const [currentPasswordStatus, setCurrentPasswordStatus] = useState<Status>(null);
  const [passwordStatus, setPasswordStatus] = useState<Status>(null);
  const passwordVerificationRequest = useRef(0);
  const lastPasswordVerification = useRef("");

  const errorMessage = (error: unknown) => error instanceof Error ? error.message : t.genericError;

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

  const handleCurrentPasswordChange = (value: string) => {
    passwordVerificationRequest.current += 1;
    lastPasswordVerification.current = "";
    setCurrentPassword(value);
    setCurrentPasswordVerified(false);
    setCheckingCurrentPassword(false);
    setCurrentPasswordStatus(null);
    setPassword("");
    setPasswordConfirm("");
    setPasswordStatus(null);
  };

  const handleCurrentPasswordVerification = async () => {
    const candidate = currentPassword;
    if (!candidate || checkingCurrentPassword || lastPasswordVerification.current === candidate) return;

    const requestId = passwordVerificationRequest.current + 1;
    passwordVerificationRequest.current = requestId;
    lastPasswordVerification.current = candidate;
    setCheckingCurrentPassword(true);
    setCurrentPasswordStatus(null);

    try {
      await verifyCurrentPassword(candidate);
      if (passwordVerificationRequest.current !== requestId) return;
      setCurrentPasswordVerified(true);
      setCurrentPasswordStatus({ type: "success", message: t.currentPasswordVerified });
    } catch (error) {
      if (passwordVerificationRequest.current !== requestId) return;
      setCurrentPasswordVerified(false);
      setCurrentPasswordStatus({ type: "error", message: error instanceof CurrentPasswordError ? t.currentPasswordInvalid : errorMessage(error) });
    } finally {
      if (passwordVerificationRequest.current === requestId) setCheckingCurrentPassword(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordStatus(null);
    if (!currentPasswordVerified) {
      setPasswordStatus({ type: "error", message: t.currentPasswordRequired });
      return;
    }
    if (password.length < 8) {
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
        setCurrentPasswordStatus({ type: "error", message: t.currentPasswordInvalid });
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
    { id: "profile" as const, label: t.profileTitle, description: t.profileDescription, code: "PROFILE" },
    { id: "email" as const, label: t.emailTitle, description: t.emailDescription, code: "SIGN-IN ID" },
    { id: "password" as const, label: t.passwordTitle, description: t.passwordDescription, code: "SECURITY" },
    { id: "session" as const, label: t.sessionTitle, description: t.sessionDescription, code: "SESSION" },
  ];
  const activeMeta = sections.find((item) => item.id === activeSection) ?? sections[0];

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerSticky}>
            <h1>ACCOUNT</h1>
            <p>{t.intro}</p>
            <nav className={styles.tabs} aria-label="Account settings">
              {sections.map((item) => <button key={item.id} type="button" className={activeSection === item.id ? styles.activeTab : ""} onClick={() => setActiveSection(item.id)}>{item.label}</button>)}
            </nav>
            <div className={styles.accountMeta}>
              <ShieldCheck aria-hidden="true" />
              <span>{name || "THE MUZE"}</span>
              <b>{originalEmail}</b>
            </div>
          </div>
        </header>

        <div className={styles.contentColumn}>
          <header className={styles.contentHeader}>
            <div><h2>{activeMeta.label}</h2><p>{activeMeta.description}</p></div>
            <em>{String(sections.findIndex((item) => item.id === activeSection) + 1).padStart(2, "0")} / 04</em>
          </header>

          {activeSection === "profile" && <form className={styles.form} onSubmit={handleNameSubmit}>
            <div className={styles.formRow}><label htmlFor="account-name">{t.name}</label><input id="account-name" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" maxLength={80} /></div>
            {profileStatus && <span role="status" className={`${styles.status} ${profileStatus.type === "success" ? styles.success : styles.error}`}>{profileStatus.message}</span>}
            <button className={styles.submit} type="submit" disabled={saving !== null}>{saving === "name" ? t.saving : t.saveName}</button>
          </form>}

          {activeSection === "email" && <form className={styles.form} onSubmit={handleEmailSubmit}>
            <div className={styles.formRow}><label htmlFor="account-email">{t.email}</label><input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></div>
            <p className={styles.guide}>{t.emailHint}</p>
            {emailStatus && <span role="status" className={`${styles.status} ${emailStatus.type === "success" ? styles.success : styles.error}`}>{emailStatus.message}</span>}
            <button className={styles.submit} type="submit" disabled={saving !== null}>{saving === "email" ? t.saving : t.saveEmail}</button>
          </form>}

          {activeSection === "password" && <form className={styles.form} onSubmit={handlePasswordSubmit}>
            <div className={styles.formRow}><label htmlFor="account-current-password">{t.currentPassword}</label><input id="account-current-password" type="password" value={currentPassword} onChange={(event) => handleCurrentPasswordChange(event.target.value)} onBlur={() => void handleCurrentPasswordVerification()} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } }} required autoComplete="current-password" aria-describedby="current-password-guide current-password-status" /></div>
            <p id="current-password-guide" className={styles.guide}>{t.currentPasswordHint}</p>
            {checkingCurrentPassword && <span id="current-password-status" role="status" className={`${styles.status} ${styles.checking}`}>{t.currentPasswordChecking}</span>}
            {currentPasswordStatus && <span id="current-password-status" role="status" className={`${styles.status} ${currentPasswordStatus.type === "success" ? styles.success : styles.error}`}>{currentPasswordStatus.message}</span>}
            <div className={styles.formRow}><label htmlFor="account-password">{t.newPassword}</label><input id="account-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" disabled={!currentPasswordVerified} /></div>
            <div className={styles.formRow}><label htmlFor="account-password-confirm">{t.confirmPassword}</label><input id="account-password-confirm" type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} required minLength={8} autoComplete="new-password" disabled={!currentPasswordVerified} /></div>
            <p className={styles.guide}>{t.passwordHint}</p>
            {passwordStatus && <span role="status" className={`${styles.status} ${passwordStatus.type === "success" ? styles.success : styles.error}`}>{passwordStatus.message}</span>}
            <button className={styles.submit} type="submit" disabled={saving !== null || checkingCurrentPassword || !currentPasswordVerified}>{saving === "password" ? t.saving : t.changePassword}</button>
          </form>}

          {activeSection === "session" && <section className={styles.session}>
            <div><span>CURRENT DEVICE</span><h3>{originalEmail}</h3><p>{t.sessionDescription}</p></div>
            <button className={styles.signOut} type="button" onClick={handleSignOut} disabled={saving !== null}><LogOut aria-hidden="true" />{saving === "logout" ? t.saving : t.signOut}</button>
          </section>}
        </div>
      </section>
    </main>
  );
}
