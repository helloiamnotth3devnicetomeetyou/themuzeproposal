"use client";

import { usePathname } from "next/navigation";
import AdminDialogProvider from "@/admin/components/shell/AdminDialogProvider";
import Sidebar from "@/admin/components/shell/Sidebar";
import Navbar from "@/public/components/layout/Navbar";

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
      <div className="admin-root-shell">
        <Navbar />
        <div className="admin-app-frame">
          <div className="admin-layout cms-shell">
            <Sidebar />
            <div className="cms-workspace">
              <main key={pathname} className={`cms-content animate-page-fade ${isFullBleed ? "is-full-bleed" : ""}`}>
                <div className="cms-content-inner">{children}</div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </AdminDialogProvider>
  );
}