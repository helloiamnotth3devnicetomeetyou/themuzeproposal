"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth";
import Sidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import "./admin.css";

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
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--text-muted)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="admin-layout cms-shell">
      <Sidebar />
      <div className="cms-workspace">
        <AdminHeader />
        <main className={`cms-content ${pathname.includes("discography") || pathname.includes("tracks") ? "is-full-bleed" : ""}`}>
          <div className="cms-content-inner">
          {children}
          </div>
        </main>
      </div>
    </div>
  );
}
