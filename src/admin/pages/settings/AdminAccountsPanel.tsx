"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown, RefreshCw, ShieldCheck, UserPlus, UserX } from "lucide-react";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import type { AdminRole } from "@/core/auth/admin-auth";
import { guideSandboxFetch } from "@/core/supabase/guide-sandbox";

type AdminAccount = {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  created_at: string | null;
};

type Props = { onError: (message: string) => void; onSuccess: (message: string) => void };

const errorMessages: Record<string, string> = {
  FORBIDDEN: "슈퍼 관리자만 관리자 계정을 관리할 수 있습니다.",
  CANNOT_CHANGE_OWN_ROLE: "현재 로그인한 계정의 역할은 여기서 변경할 수 없습니다.",
  LAST_SUPER_ADMIN: "마지막 슈퍼 관리자는 해제하거나 역할을 변경할 수 없습니다.",
  NOT_FOUND: "관리자 계정을 찾을 수 없습니다.",
  INVITATION_FAILED: "초대 메일을 보낼 수 없습니다. 이메일을 확인해 주세요.",
  SERVICE_UNAVAILABLE: "잠시 후 다시 시도해 주세요.",
};

function messageFor(response: Response, payload: { code?: string }) {
  return errorMessages[payload.code ?? ""] ?? (response.status === 401 ? "로그인 후 다시 시도해 주세요." : "요청을 처리하지 못했습니다.");
}

export default function AdminAccountsPanel({ onError, onSuccess }: Props) {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("editor");
  const [inviting, setInviting] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    const response = await guideSandboxFetch("/api/admin/accounts", { cache: "no-store" });
    const payload = await response.json().catch(() => ({})) as { accounts?: AdminAccount[]; code?: string };
    if (!response.ok) onError(messageFor(response, payload));
    else setAccounts(payload.accounts ?? []);
    setLoading(false);
  }, [onError]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadAccounts(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAccounts]);

  const invite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    const response = await guideSandboxFetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const payload = await response.json().catch(() => ({})) as { invited?: boolean; code?: string };
    setInviting(false);
    if (!response.ok) return onError(messageFor(response, payload));
    setEmail("");
    onSuccess(payload.invited ? "초대 메일을 보냈습니다." : "기존 계정의 관리자 역할을 변경했습니다.");
    await loadAccounts();
  };

  const changeRole = async (account: AdminAccount, nextRole: AdminRole) => {
    if (account.role === nextRole) return;
    setBusyId(account.id);
    const response = await guideSandboxFetch("/api/admin/accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: account.id, role: nextRole }),
    });
    const payload = await response.json().catch(() => ({})) as { code?: string };
    setBusyId(null);
    if (!response.ok) return onError(messageFor(response, payload));
    onSuccess("관리자 역할을 변경했습니다.");
    await loadAccounts();
  };

  const remove = async (account: AdminAccount) => {
    if (!window.confirm(`${account.email} 계정의 관리자 권한을 해제할까요?`)) return;
    setBusyId(account.id);
    const response = await guideSandboxFetch("/api/admin/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: account.id }),
    });
    const payload = await response.json().catch(() => ({})) as { code?: string };
    setBusyId(null);
    if (!response.ok) return onError(messageFor(response, payload));
    onSuccess("관리자 권한을 해제했습니다.");
    await loadAccounts();
  };

  return (
    <div className="admin-accounts-stack">
      <div className="content-section-heading settings-section-heading">
        <div><h3>관리자 계정</h3><p>슈퍼 관리자는 관리자 계정을 초대하고, 역할을 변경하거나 권한을 해제할 수 있습니다.</p></div>
        <ShieldCheck aria-hidden="true" />
      </div>

      <section className="admin-accounts-invite" data-tour-id="admin-account-invite">
        <div className="admin-accounts-section-title"><span><UserPlus aria-hidden="true" /></span><div><b>관리자 초대 또는 승격</b><small>기존 회원 이메일을 입력하면 초대 대신 역할만 부여합니다.</small></div></div>
        <form onSubmit={invite}>
          <label><span className="sr-only">이메일</span><input className="admin-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" required /></label>
          <label><span className="sr-only">역할</span><select className="admin-input" value={role} onChange={(event) => setRole(event.target.value as AdminRole)}><option value="editor">편집자</option><option value="super_admin">슈퍼 관리자</option></select></label>
          <button className="admin-btn admin-btn-primary" type="submit" disabled={inviting}>{inviting ? "처리 중…" : "초대·승격"}</button>
        </form>
      </section>

      <section className="admin-accounts-list" aria-label="관리자 계정 목록">
        <div className="admin-accounts-list-head"><div><b>관리자 목록</b><small>{loading ? <span className="admin-skeleton-line admin-accounts-count-skeleton" aria-label="불러오는 중" /> : `${accounts.length}명`}</small></div><button type="button" onClick={() => void loadAccounts()} disabled={loading} aria-label="목록 새로고침"><RefreshCw aria-hidden="true" /></button></div>
        {!loading && accounts.length === 0 && <div className="admin-accounts-empty">등록된 관리자 계정이 없습니다.</div>}
        {loading && <AdminSkeleton variant="table" className="min-h-[150px]" rows={3} />}
        {accounts.map((account) => {
          const busy = busyId === account.id;
          return <article className="admin-account-row" key={account.id}>
            <span className={`admin-account-badge ${account.role}`} aria-label={account.role === "super_admin" ? "슈퍼 관리자" : "편집자"}>{account.role === "super_admin" ? <Crown aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}</span>
            <div className="admin-account-identity"><b>{account.name || account.email.split("@")[0]}</b><small>{account.email}</small></div>
            <label className="admin-account-role"><span className="sr-only">역할</span><select className="admin-input" value={account.role} disabled={busy} onChange={(event) => void changeRole(account, event.target.value as AdminRole)}><option value="editor">편집자</option><option value="super_admin">슈퍼 관리자</option></select></label>
            <button className="admin-account-remove" data-tour-id="admin-account-remove" type="button" disabled={busy} onClick={() => void remove(account)} aria-label={`${account.email} 관리자 권한 해제`} title="관리자 권한 해제"><UserX aria-hidden="true" /></button>
          </article>;
        })}
      </section>
    </div>
  );
}
