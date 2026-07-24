"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const isAdmin = pathname.startsWith("/admin");
  const isImmersiveDiscography = /^\/[^/]+\/discography\/?$/.test(pathname);
  const isImmersiveArtist = /^\/[^/]+\/artist(?:\/[^/]+)?\/?$/.test(pathname);

  useEffect(() => {
    if (isLogin || isAdmin) return;

    const observerOptions = {
      root: null,
      rootMargin: "0px 0px -8% 0px", // Triggers slightly before entering the full viewport for a premium, intentional flow
      threshold: 0.02,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          // Scent diffusion only needs to trigger once per load
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const observeElements = () => {
      const elements = document.querySelectorAll(".reveal");
      elements.forEach((el) => {
        if (!el.classList.contains("active")) {
          observer.observe(el);
        }
      });
    };

    // Scan initially
    observeElements();

    // Setup MutationObserver to watch for dynamically loaded DOM elements (e.g. notices, history, dynamic sections)
    const mutationObserver = new MutationObserver(() => {
      observeElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname, isLogin, isAdmin]);

  // Get a normalized key for page transitions to avoid unmounting when switching members or tabs on the same view.
  const getLayoutKey = (path: string) => {
    const parts = path.split("/").filter(Boolean);
    if (parts.length >= 2) {
      if (parts[1] === "artist") {
        return `/${parts[0]}/artist`;
      }
      if (parts[1] === "discography") {
        return `/${parts[0]}/discography`;
      }
    }
    return path;
  };
  const layoutKey = getLayoutKey(pathname);

  if (isLogin) {
    return <>{children}</>;
  }

  if (isAdmin) {
    return <div className="admin-root-shell"><Navbar /><div className="admin-app-frame">{children}</div></div>;
  }

  return (
    <>
      <Navbar />
      <div key={layoutKey} className="flex flex-1 flex-col animate-page-fade">{children}</div>
      {!isImmersiveDiscography && !isImmersiveArtist && <Footer />}
    </>
  );
}



