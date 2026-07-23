"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth";
import Sidebar from "@/components/admin/Sidebar";
import AdminDialogProvider from "@/components/admin/AdminDialogProvider";
import LoadingIndicator from "@/components/LoadingIndicator";
import "./admin.css";
import "./admin-special.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then(async (session) => {
      if (!session) {
        router.replace("/login");
      } else {
        const admin = await isAdmin();
        if (!admin) {
          router.replace("/");
        } else {
          setLoading(false);
        }
      }
    });
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="admin-layout min-h-screen flex items-center justify-center">
        <LoadingIndicator label="관리자 화면을 여는 중…" />
      </div>
    );
  }

  const isFullBleed = ["discography", "tracks", "profile", "members", "schedule", "notices", "settings", "hero", "auditions", "protect"].some((segment) => pathname.includes(segment));

  return (
    <AdminDialogProvider>
      <div className="admin-layout cms-shell">
        <Sidebar />
        <div className="cms-workspace">
          <main className={`cms-content ${isFullBleed ? "is-full-bleed" : ""}`}>
            <div className="cms-content-inner">
            {children}
            </div>
          </main>
        </div>
      </div>
    </AdminDialogProvider>
  );
}
