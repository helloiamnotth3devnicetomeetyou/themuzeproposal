"use client";

import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";

const STORAGE_KEY = "muze_not_official_banner_dismissed";

export default function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDismissed = localStorage.getItem(STORAGE_KEY) === "true";
    if (!isDismissed) {
      setIsVisible(true);
      document.documentElement.style.setProperty("--banner-height", "42px");
    } else {
      document.documentElement.style.setProperty("--banner-height", "0px");
    }

    return () => {
      document.documentElement.style.setProperty("--banner-height", "0px");
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
    document.documentElement.style.setProperty("--banner-height", "0px");
  };

  if (!mounted || !isVisible) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Official Website Disclaimer"
      className="fixed top-0 left-0 right-0 z-[100] flex h-[42px] select-none items-center justify-between border-b border-[#fde68a] bg-[#fef3c7] px-4 text-xs text-[#78350f] shadow-xs backdrop-blur-md transition-all duration-300 sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-1 items-center gap-2.5 overflow-hidden">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#78350f] text-[10px] font-bold leading-none">
          !
        </span>
        <p className="truncate font-sans text-xs font-semibold tracking-tight text-[#78350f]">
          <span>본 사이트는 공식 웹사이트가 아닙니다.</span>
          <span className="ml-1.5 opacity-80 font-normal hidden sm:inline">(This is not an official website)</span>
        </p>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Notice dismissal"
        className="ml-3 flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-bold text-[#78350f] transition-colors hover:bg-[#fde68a]/70 focus:outline-none focus:ring-2 focus:ring-[#b45309]"
      >
        <span>닫기</span>
        <FiX className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </aside>
  );
}
