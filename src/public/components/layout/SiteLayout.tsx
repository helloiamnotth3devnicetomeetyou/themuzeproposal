"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { PreviewProvider } from "@/core/preview/PreviewProvider";
import type { SiteSettingsPreviewPayload } from "@/core/preview/types";
import Navbar from "./Navbar";
import Footer from "./Footer";
import type { ArtistNavigationItem, NavigationAccount } from "./navbar-types";

export default function MainLayout({
  children,
  draftModeEnabled = true,
  initialArtists,
  initialSettings,
  initialAccount,
}: {
  children: React.ReactNode;
  draftModeEnabled?: boolean;
  initialArtists: ArtistNavigationItem[];
  initialSettings: SiteSettingsPreviewPayload;
  initialAccount: NavigationAccount;
}) {
  const pathname = usePathname();
  const isImmersiveDiscography = /^\/[^/]+\/discography\/?$/.test(pathname);
  const isImmersiveArtist = /^\/[^/]+\/artist(?:\/[^/]+)?\/?$/.test(pathname);

  useEffect(() => {
    if (isImmersiveDiscography || isImmersiveArtist) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyHeight = document.body.style.height;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalHtmlHeight = document.documentElement.style.height;

      document.body.style.overflow = "hidden";
      document.body.style.height = "100dvh";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.height = "100dvh";

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.height = originalBodyHeight;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.documentElement.style.height = originalHtmlHeight;
      };
    }
  }, [isImmersiveDiscography, isImmersiveArtist]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.02,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const observeElements = () => {
      const elements = document.querySelectorAll(".reveal");
      elements.forEach((element) => {
        if (!element.classList.contains("active")) observer.observe(element);
      });
    };

    observeElements();
    const mutationObserver = new MutationObserver(observeElements);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  const getLayoutKey = (path: string) => {
    const parts = path.split("/").filter(Boolean);
    if (parts.length >= 2) {
      if (parts[1] === "artist") return `/${parts[0]}/artist`;
      if (parts[1] === "discography") return `/${parts[0]}/discography`;
    }
    return path;
  };
  const layoutKey = getLayoutKey(pathname);
  const content = (
    <>
      <Navbar initialArtists={initialArtists} initialAccount={initialAccount} />
      <div
        key={layoutKey}
        className={`flex flex-1 flex-col animate-page-fade ${
          isImmersiveDiscography || isImmersiveArtist ? "h-[100dvh] overflow-hidden" : ""
        }`}
      >
        {children}
      </div>
      {!isImmersiveDiscography && !isImmersiveArtist && (
        <Footer initialSettings={initialSettings} />
      )}
    </>
  );

  return <PreviewProvider draftModeEnabled={draftModeEnabled}>{content}</PreviewProvider>;
}
