"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const isAdmin = pathname.startsWith("/admin");

  if (isLogin) {
    return <>{children}</>;
  }

  if (isAdmin) {
    return <div className="admin-root-shell"><Navbar /><div className="admin-app-frame">{children}</div></div>;
  }

  return (
    <>
      <Navbar />
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
    </>
  );
}
