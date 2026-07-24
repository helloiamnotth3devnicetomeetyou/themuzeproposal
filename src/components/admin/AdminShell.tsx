"use client";

import { usePathname } from "next/navigation";
import AdminDialogProvider from "@/components/admin/AdminDialogProvider";
import Sidebar from "@/components/admin/Sidebar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleed = [
    "discography",
    "tracks",
    "profile",
    "members",
    "schedule",
    "notices",
    "settings",
    "hero",
    "auditions",
    "protect",
  ].some((segment) => pathname.includes(segment));

  return (
    <AdminDialogProvider>
      <div className="admin-layout cms-shell">
        <Sidebar />
        <div className="cms-workspace">
          <main className={`cms-content ${isFullBleed ? "is-full-bleed" : ""}`}>
            <div className="cms-content-inner">{children}</div>
          </main>
        </div>
      </div>
    </AdminDialogProvider>
  );
}
