import { useCallback, useEffect, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from "react";
import { finishGuideSandbox, isGuideSandboxActive } from "@/core/supabase/guide-sandbox";
import type { GuideRun } from "./guide-content";

export function useGuideModalInteractions({
  userId, guideOpen, welcomeOpen, tocOpen, chapterIntro, run, dialogRef, launcherRef, previousFocusRef, guideWasOpenRef,
  setWelcomeOpen, setTocOpen, setChapterIntro, setRun, setPausedRun, setRect, setPopoverPosition,
}: {
  userId?: string; guideOpen: boolean; welcomeOpen: boolean; tocOpen: boolean; chapterIntro: GuideRun | null; run: GuideRun | null;
  dialogRef: RefObject<HTMLDivElement | null>; launcherRef: RefObject<HTMLButtonElement | null>; previousFocusRef: RefObject<HTMLElement | null>;
  guideWasOpenRef: RefObject<boolean>; setWelcomeOpen: (value: boolean) => void; setTocOpen: (value: boolean) => void;
  setChapterIntro: (value: GuideRun | null) => void; setRun: (value: GuideRun | null) => void; setPausedRun: (value: GuideRun | null) => void;
  setRect: (value: { top: number; left: number; width: number; height: number } | null) => void; setPopoverPosition: (value: null) => void;
}) {
  const closeGuide = useCallback(() => {
    setWelcomeOpen(false);
    setTocOpen(false);
    setChapterIntro(null);
    setRun(null);
    setPausedRun(null);
    setRect(null);
    setPopoverPosition(null);
    localStorage.removeItem(`admin-guide-paused:${userId}`);
    if (isGuideSandboxActive()) window.location.assign(finishGuideSandbox() || window.location.href);
  }, [setChapterIntro, setPausedRun, setPopoverPosition, setRect, setRun, setTocOpen, setWelcomeOpen, userId]);

  const trapFocus = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled])"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }, []);

  useEffect(() => {
    if (guideOpen && !guideWasOpenRef.current) previousFocusRef.current = document.activeElement as HTMLElement | null;
    if (!guideOpen && guideWasOpenRef.current) {
      const previous = previousFocusRef.current;
      requestAnimationFrame(() => (previous?.isConnected ? previous : launcherRef.current)?.focus());
    }
    guideWasOpenRef.current = guideOpen;
  }, [guideOpen, guideWasOpenRef, launcherRef, previousFocusRef]);

  useEffect(() => {
    if (!welcomeOpen && !tocOpen && !chapterIntro && !run) return;
    const frame = requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("button")?.focus());
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") closeGuide(); };
    window.addEventListener("keydown", onKeyDown);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", onKeyDown); };
  }, [chapterIntro, closeGuide, dialogRef, run, tocOpen, welcomeOpen]);

  return { trapFocus, closeGuide };
}
