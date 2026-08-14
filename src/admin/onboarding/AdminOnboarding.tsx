"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  isGuideSandboxActive,
  startGuideSandbox,
} from "@/core/supabase/guide-sandbox";
import {
  GUIDE_CHAPTERS,
  guidePathMatches,
  parseGuideRun,
  type GuideRole,
  type GuideRun,
  type GuideStep,
} from "./guide-content";
import { type GuidePosition } from "./guide-position";
import { useGuideTargetTracking } from "./useGuideTargetTracking";
import { AdminOnboardingPortal } from "./AdminOnboardingPortal";
import { useGuidePopoverInteractions } from "./useGuidePopoverInteractions";
import { useGuideDerivedState } from "./useGuideDerivedState";
import { useGuideModalInteractions } from "./useGuideModalInteractions";
import { useAdminOnboardingProgress } from "./useAdminOnboardingProgress";
import { AdminOnboardingLauncher } from "./AdminOnboardingLauncher";

type Artist = { id: string; name: string };
type ChapterIntro = GuideRun;
type Rect = { top: number; left: number; width: number; height: number };

const emptySubscribe = () => () => {};
export default function AdminOnboarding({
  userId,
  role,
  artists,
  isCollapsed,
  canNavigate,
}: {
  userId?: string;
  role?: GuideRole;
  artists: Artist[];
  isCollapsed: boolean;
  canNavigate: () => boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const guideWasOpenRef = useRef(false);
  const popoverDragRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>(null);
  const mobileSheetDragRef = useRef<number | null>(null);
  const suppressMobileSheetClickRef = useRef(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [chapterIntro, setChapterIntro] = useState<ChapterIntro | null>(null);
  const [run, setRun] = useState<GuideRun | null>(null);
  const [pausedRun, setPausedRun] = useState<GuideRun | null>(() =>
    typeof window === "undefined" || !userId
      ? null
      : parseGuideRun(localStorage.getItem(`admin-guide-paused:${userId}`)),
  );
  const [rect, setRect] = useState<Rect | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<GuidePosition | null>(
    null,
  );
  const [manualPopoverPosition, setManualPopoverPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isPopoverDragging, setIsPopoverDragging] = useState(false);
  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(
    null,
  );
  const [isExploring, setIsExploring] = useState(false);
  const [isMobileGuide, setIsMobileGuide] = useState(false);
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState(true);
  const [practiceComplete, setPracticeComplete] = useState(false);

  const artistId =
    artists.find((artist) => pathname.includes(`/artists/${artist.id}/`))?.id ??
    artists[0]?.id;
  const {
    ready,
    progressRows,
    capabilities,
    saveStepProgress: persistStepProgress,
    completeChapter: persistCompleteChapter,
  } = useAdminOnboardingProgress({ userId, role });
  const {
    chapterSteps,
    chapterStats,
    completed,
    totalSteps,
    reachedSteps,
    progress,
    steps,
    step,
    runChapter,
    introChapter,
    visibleRect,
    guideOpen,
  } = useGuideDerivedState({
    role,
    artistId,
    capabilities,
    progressRows,
    run,
    chapterIntro,
    pathname,
    rect,
    welcomeOpen,
    tocOpen,
  });
  const { trapFocus, closeGuide } = useGuideModalInteractions({
    userId,
    guideOpen,
    welcomeOpen,
    tocOpen,
    chapterIntro,
    run,
    dialogRef,
    launcherRef,
    previousFocusRef,
    guideWasOpenRef,
    setWelcomeOpen,
    setTocOpen,
    setChapterIntro,
    setRun,
    setPausedRun,
    setRect,
    setPopoverPosition,
  });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const update = () => setIsMobileGuide(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const key = `admin-guide-paused:${userId}`;
    if (pausedRun) localStorage.setItem(key, JSON.stringify(pausedRun));
    else localStorage.removeItem(key);
  }, [pausedRun, userId]);

  const saveStepProgress = (chapterId: string, stepId: string) =>
    persistStepProgress(chapterId, stepId, chapterSteps[chapterId] ?? []);
  const completeChapter = (chapterId: string) =>
    persistCompleteChapter(
      chapterId,
      chapterId === "0"
        ? "0-welcome"
        : (chapterSteps[chapterId]?.at(-1)?.id ?? null),
    );

  const resolvedHref = (nextStep: GuideStep) =>
    nextStep.href.replace(":artistId", artistId ?? "new");

  const openStep = (
    chapterId: string,
    index: number,
    mode: GuideRun["mode"],
  ) => {
    const nextSteps = chapterSteps[chapterId] ?? [];
    const nextStep = nextSteps[index];
    if (!nextStep) return false;
    const href = resolvedHref(nextStep);
    const currentHref = `${window.location.pathname}${window.location.search}`;
    const stayOnDescendant = Boolean(
      nextStep.descendantPath &&
      guidePathMatches(href, window.location.pathname, true) &&
      [nextStep.target, nextStep.interaction?.target].some(
        (target) =>
          target && document.querySelector(`[data-tour-id="${target}"]`),
      ),
    );
    const shouldNavigate = href !== currentHref && !stayOnDescendant;
    if (shouldNavigate && !canNavigate()) return false;
    setWelcomeOpen(false);
    setTocOpen(false);
    setChapterIntro(null);
    setRect(null);
    setPopoverPosition(null);
    setManualPopoverPosition(null);
    setInteractionPrompt(null);
    setPracticeComplete(false);
    setPausedRun(null);
    setIsExploring(false);
    setMobileSheetExpanded(true);
    startGuideSandbox();
    setRun({ chapterId, index, mode });
    if (shouldNavigate) router.push(href);
    return true;
  };

  const startChapter = (
    chapterId: string,
    mode: GuideRun["mode"] = "chapter",
    resume = true,
  ) => {
    if (chapterId === "0") {
      setRun(null);
      setTocOpen(false);
      setChapterIntro(null);
      setWelcomeOpen(true);
      return;
    }
    const available = chapterSteps[chapterId] ?? [];
    const row = progressRows[chapterId];
    const savedIndex = row?.completed_at
      ? -1
      : available.findIndex((item) => item.id === row?.furthest_step_id);
    setRun(null);
    setPausedRun(null);
    setRect(null);
    setPopoverPosition(null);
    setInteractionPrompt(null);
    setIsExploring(false);
    setWelcomeOpen(false);
    setTocOpen(false);
    setChapterIntro({
      chapterId,
      index: resume && savedIndex >= 0 ? savedIndex : 0,
      mode,
    });
  };

  const finishOrAdvance = async () => {
    if (!run) return;
    const currentStep = steps[run.index];
    if (currentStep) void saveStepProgress(run.chapterId, currentStep.id);
    if (run.index < steps.length - 1) {
      openStep(run.chapterId, run.index + 1, run.mode);
      return;
    }
    await completeChapter(run.chapterId);
    if (run.mode === "full") {
      const chapterIndex = GUIDE_CHAPTERS.findIndex(
        (chapter) => chapter.id === run.chapterId,
      );
      const nextChapter = GUIDE_CHAPTERS.slice(chapterIndex + 1).find(
        (chapter) => chapterSteps[chapter.id]?.length,
      );
      if (nextChapter) {
        startChapter(nextChapter.id, "full", false);
        return;
      }
    }
    setRun(null);
    setRect(null);
    setPopoverPosition(null);
    setTocOpen(true);
  };

  useGuideTargetTracking({
    step,
    pathname,
    artistId,
    dialogRef,
    saveStepProgress,
    finishOrAdvance,
    setRect,
    setPopoverPosition,
    setInteractionPrompt,
    setIsExploring,
    setPracticeComplete,
    setMobileSheetExpanded,
  });

  useEffect(() => {
    document.body.classList.toggle(
      "is-admin-guide-exploring",
      Boolean(run && isExploring),
    );
    return () => document.body.classList.remove("is-admin-guide-exploring");
  }, [isExploring, run]);

  useEffect(() => {
    document.body.classList.toggle(
      "is-admin-guide-sandbox",
      Boolean((run || pausedRun) && isGuideSandboxActive()),
    );
    return () => document.body.classList.remove("is-admin-guide-sandbox");
  }, [pausedRun, run]);

  useEffect(() => {
    if (!run && !pausedRun) return;
    let wasActive = isGuideSandboxActive();
    const checkSandbox = () => {
      const active = isGuideSandboxActive();
      if (wasActive && !active) {
        window.dispatchEvent(
          new CustomEvent("admin-toast", {
            detail:
              "안전모드가 해제되었습니다. 가이드 진행 상태를 확인해 주세요.",
          }),
        );
      }
      wasActive = active;
    };
    const timer = window.setInterval(checkSandbox, 500);
    window.addEventListener("storage", checkSandbox);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", checkSandbox);
    };
  }, [pausedRun, run]);

  const chooseWelcome = async (mode: "full" | "toc") => {
    await completeChapter("0");
    setWelcomeOpen(false);
    if (mode === "full")
      startChapter(
        isMobileGuide &&
          document.querySelector('[data-tour-id="admin-mobile-dashboard"]')
          ? "mobile"
          : "1",
        "full",
        false,
      );
    else setTocOpen(true);
  };

  const {
    startPopoverDrag,
    movePopover,
    stopPopoverDrag,
    updateMobileSheet,
    startMobileSheetDrag,
    stopMobileSheetDrag,
    toggleMobileSheet,
  } = useGuidePopoverInteractions({
    dialogRef,
    popoverDragRef,
    mobileSheetDragRef,
    suppressMobileSheetClickRef,
    mobileSheetExpanded,
    setManualPopoverPosition,
    setIsPopoverDragging,
    setMobileSheetExpanded,
  });
  const activePopoverPosition = manualPopoverPosition ?? popoverPosition;

  const portal = (
    <AdminOnboardingPortal
      mounted={mounted}
      welcomeOpen={welcomeOpen}
      tocOpen={tocOpen}
      chapterIntro={chapterIntro}
      introChapter={introChapter}
      run={run}
      step={step}
      dialogRef={dialogRef}
      trapFocus={trapFocus}
      closeGuide={closeGuide}
      chooseWelcome={chooseWelcome}
      reachedSteps={reachedSteps}
      totalSteps={totalSteps}
      progress={progress}
      chapterStats={chapterStats}
      completed={completed}
      startChapter={startChapter}
      chapterSteps={chapterSteps}
      openStep={openStep}
      isExploring={isExploring}
      isMobileGuide={isMobileGuide}
      mobileSheetExpanded={mobileSheetExpanded}
      visibleRect={visibleRect}
      activePopoverPosition={activePopoverPosition}
      popoverPosition={popoverPosition}
      isPopoverDragging={isPopoverDragging}
      interactionPrompt={interactionPrompt}
      practiceComplete={practiceComplete}
      runChapter={runChapter}
      steps={steps}
      mobileSheetDragRef={mobileSheetDragRef}
      toggleMobileSheet={toggleMobileSheet}
      startMobileSheetDrag={startMobileSheetDrag}
      stopMobileSheetDrag={stopMobileSheetDrag}
      startPopoverDrag={startPopoverDrag}
      movePopover={movePopover}
      stopPopoverDrag={stopPopoverDrag}
      updateMobileSheet={updateMobileSheet}
      setIsExploring={setIsExploring}
      setChapterIntro={setChapterIntro}
      setTocOpen={setTocOpen}
      setRun={setRun}
      setRect={setRect}
      setPausedRun={setPausedRun}
      setPopoverPosition={setPopoverPosition}
      finishOrAdvance={finishOrAdvance}
    />
  );
  if (!ready || !userId || !role) return null;

  return (
    <>
      <AdminOnboardingLauncher
        launcherRef={launcherRef}
        isCollapsed={isCollapsed}
        pausedRun={pausedRun}
        progress={progress}
        reachedSteps={reachedSteps}
        totalSteps={totalSteps}
        onOpen={() => {
          if (pausedRun) {
            setRun(null);
            setWelcomeOpen(false);
            setTocOpen(false);
            setChapterIntro(pausedRun);
            return;
          }
          setRun(null);
          if (Object.keys(progressRows).length === 0) setWelcomeOpen(true);
          else setTocOpen(true);
        }}
      />
      {portal}
    </>
  );
}
