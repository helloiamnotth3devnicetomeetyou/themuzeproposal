"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Inbox,
  Mail,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import {
  getAdminInboxCounts,
  type AdminInboxCounts,
} from "@/admin/utils/inbox-counts";
import { supabase } from "@/core/supabase/client";
import styles from "./inbox.module.css";

const emptyCounts: AdminInboxCounts = { auditions: 0, contacts: 0, reports: 0 };
const number = new Intl.NumberFormat("ko-KR");

const workItems = [
  {
    key: "auditions",
    title: "오디션 지원서",
    description: "새로 접수된 지원서를 확인하세요.",
    href: "/admin/auditions/campaigns",
    icon: UserRoundCheck,
  },
  {
    key: "contacts",
    title: "문의 관리",
    description: "답변이 필요한 문의를 확인하세요.",
    href: "/admin/contact?status=pending",
    icon: Mail,
  },
  {
    key: "reports",
    title: "권익 보호",
    description: "검토가 필요한 신고를 확인하세요.",
    href: "/admin/protect?status=pending",
    icon: ShieldCheck,
  },
] as const;

export default function AdminInboxPage() {
  const [counts, setCounts] = useState(emptyCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    void getAdminInboxCounts(supabase)
      .then(setCounts)
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "받은 작업을 불러오지 못했습니다.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (loading)
    return <AdminSkeleton variant="cards" rows={3} className="min-h-[300px]" />;

  const total = counts.auditions + counts.contacts + counts.reports;
  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <span>받은 작업</span>
        <h1>지금 확인할 일을 한곳에서</h1>
        <p>
          {total
            ? `${number.format(total)}건의 미처리 작업이 있습니다.`
            : "현재 확인이 필요한 작업이 없습니다."}
        </p>
      </header>
      {error && (
        <div className="hero-admin-alert is-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={load}
          >
            다시 시도
          </button>
        </div>
      )}
      <section className={styles.grid} aria-label="미처리 작업 목록">
        {workItems.map((item) => {
          const Icon = item.icon;
          const count = counts[item.key];
          return (
            <Link key={item.key} href={item.href} className={styles.card}>
              <span className={styles.icon}>
                <Icon aria-hidden="true" />
              </span>
              <span className={styles.copy}>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <span className={styles.count}>
                {number.format(count)}
                <small>건</small>
              </span>
              <ArrowRight className={styles.arrow} aria-hidden="true" />
            </Link>
          );
        })}
      </section>
      <aside className={styles.note}>
        <Inbox aria-hidden="true" />
        <p>작업을 처리하면 이 화면의 미처리 수가 자동으로 갱신됩니다.</p>
      </aside>
    </main>
  );
}
