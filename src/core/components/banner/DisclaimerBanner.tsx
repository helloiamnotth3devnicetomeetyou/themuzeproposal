"use client";

import { useEffect, useSyncExternalStore } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "muze_not_official_banner_dismissed";
const DISMISS_EVENT = "muze_banner_dismiss";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(DISMISS_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(DISMISS_EVENT, callback);
  };
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function getServerSnapshot(): boolean {
  return true;
}

export default function DisclaimerBanner() {
  const isDismissed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (isDismissed) {
      document.documentElement.style.setProperty("--banner-height", "0px");
      return;
    }

    const media = window.matchMedia("(min-width: 640px)");
    const updateBannerHeight = () => {
      document.documentElement.style.setProperty(
        "--banner-height",
        media.matches ? "42px" : "64px",
      );
    };

    updateBannerHeight();
    media.addEventListener("change", updateBannerHeight);
    return () => {
      media.removeEventListener("change", updateBannerHeight);
      document.documentElement.style.setProperty("--banner-height", "0px");
    };
  }, [isDismissed]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    window.dispatchEvent(new Event(DISMISS_EVENT));
  };

  if (isDismissed) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Official Website Disclaimer"
      className="fixed top-0 left-0 right-0 z-[100] flex min-h-[64px] select-none items-center justify-between border-b border-[#fde68a] bg-[#fef3c7] px-4 py-2 text-xs text-[#78350f] shadow-xs backdrop-blur-md transition-all duration-300 sm:h-[42px] sm:min-h-0 sm:px-6 sm:py-0"
    >
      <div className="mx-auto flex max-w-7xl flex-1 items-center gap-2.5 overflow-hidden">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#78350f] text-[10px] font-bold leading-none">
          !
        </span>
        <div className="min-w-0 font-sans text-[#78350f] sm:flex sm:items-center sm:gap-3">
          <p className="truncate text-xs font-semibold tracking-tight">
            <span>본 사이트는 공식 웹사이트가 아닙니다.</span>
            <span className="ml-1.5 opacity-80 font-normal hidden sm:inline">
              (This is not an official website)
            </span>
          </p>
          <p className="whitespace-nowrap text-[10px] font-medium tracking-tight sm:text-xs">
            <a href="mailto:notth3dev@gmail.com" className="hover:underline">
              notth3dev@gmail.com
            </a>
            <span aria-hidden="true"> / </span>
            <a href="tel:01095108597" className="hover:underline">
              010-9510-8597
            </a>
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Notice dismissal"
        className="ml-3 flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-bold text-[#78350f] transition-colors hover:bg-[#fde68a]/70 focus:outline-none focus:ring-2 focus:ring-[#b45309]"
      >
        <span>닫기</span>
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </aside>
  );
}
