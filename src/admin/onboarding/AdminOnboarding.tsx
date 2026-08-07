"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, GripHorizontal, List, Play, ShieldCheck, X } from "lucide-react";
import { supabase } from "@/core/supabase/client";
import { finishGuideSandbox, isGuideSandboxActive, startGuideSandbox } from "@/core/supabase/guide-sandbox";
import {
  GUIDE_CHAPTERS,
  availableGuideSteps,
  guideChapterProgress,
  guidePathMatches,
  parseGuideRun,
  type GuideProgressRow,
  type GuideRole,
  type GuideRun,
  type GuideStep,
} from "./guide-content";
import { getGuideHighlightRect, getGuidePosition, getSnappedGuidePosition, shouldRevealGuideTarget, type GuidePosition } from "./guide-position";

type Artist = { id: string; name: string };
type ChapterIntro = GuideRun;
type Rect = { top: number; left: number; width: number; height: number };

const missingTable = (message?: string) => Boolean(message && /does not exist|schema cache|could not find/i.test(message));
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
  const progressRef = useRef<Record<string, GuideProgressRow>>({});
  const popoverDragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number; width: number; height: number } | null>(null);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [ready, setReady] = useState(false);
  const [progressRows, setProgressRows] = useState<Record<string, GuideProgressRow>>({});
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [chapterIntro, setChapterIntro] = useState<ChapterIntro | null>(null);
  const [run, setRun] = useState<GuideRun | null>(null);
  const [pausedRun, setPausedRun] = useState<GuideRun | null>(() => typeof window === "undefined" || !userId
    ? null
    : parseGuideRun(localStorage.getItem(`admin-guide-paused:${userId}`)));
  const [rect, setRect] = useState<Rect | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<GuidePosition | null>(null);
  const [manualPopoverPosition, setManualPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const [isPopoverDragging, setIsPopoverDragging] = useState(false);
  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null);
  const [isExploring, setIsExploring] = useState(false);
  const [capabilities, setCapabilities] = useState({ artistScenes: true, artistGallery: true });

  const artistId = artists.find((artist) => pathname.includes(`/artists/${artist.id}/`))?.id ?? artists[0]?.id;
  const context = useMemo(() => ({
    role: role ?? "editor",
    hasArtist: Boolean(artistId),
    ...capabilities,
  }), [artistId, capabilities, role]);
  const chapterSteps = useMemo(() => Object.fromEntries(
    GUIDE_CHAPTERS.map((chapter) => [chapter.id, availableGuideSteps(chapter.id, context)]),
  ), [context]);
  const chapterStats = useMemo(() => Object.fromEntries(GUIDE_CHAPTERS.map((chapter) => [
    chapter.id,
    guideChapterProgress(chapter.id, chapterSteps[chapter.id], progressRows[chapter.id]),
  ])), [chapterSteps, progressRows]);
  const completed = useMemo(() => new Set(Object.values(progressRows).filter((row) => row.completed_at).map((row) => row.chapter_id)), [progressRows]);
  const totalSteps = Object.values(chapterStats).reduce((sum, item) => sum + item.total, 0);
  const reachedSteps = Object.values(chapterStats).reduce((sum, item) => sum + item.reached, 0);
  const progress = totalSteps ? Math.round((reachedSteps / totalSteps) * 100) : 0;
  const steps = run ? chapterSteps[run.chapterId] ?? [] : [];
  const step = run ? steps[run.index] : undefined;
  const runChapter = run ? GUIDE_CHAPTERS.find((chapter) => chapter.id === run.chapterId) : undefined;
  const introChapter = chapterIntro ? GUIDE_CHAPTERS.find((chapter) => chapter.id === chapterIntro.chapterId) : undefined;
  const stepOnCurrentPath = !step || guidePathMatches(step.href.replace(":artistId", artistId ?? "new"), pathname, step.descendantPath);
  const visibleRect = stepOnCurrentPath ? rect : null;
  const guideOpen = welcomeOpen || tocOpen || Boolean(chapterIntro) || Boolean(run);

  useEffect(() => {
    if (!userId) return;
    const key = `admin-guide-paused:${userId}`;
    if (pausedRun) localStorage.setItem(key, JSON.stringify(pausedRun));
    else localStorage.removeItem(key);
  }, [pausedRun, userId]);

  useEffect(() => {
    if (!userId || !role) return;
    let active = true;
    void Promise.all([
      supabase.from("admin_onboarding_progress").select("chapter_id,furthest_step_id,completed_at"),
      supabase.from("artist_scenes").select("id", { head: true, count: "exact" }).limit(1),
      supabase.from("artist_gallery").select("id", { head: true, count: "exact" }).limit(1),
    ]).then(([progressResult, scenesResult, galleryResult]) => {
      if (!active) return;
      const rows = (progressResult.data ?? []) as GuideProgressRow[];
      const nextRows = Object.fromEntries(rows.map((row) => [row.chapter_id, row]));
      progressRef.current = nextRows;
      setProgressRows(nextRows);
      setCapabilities({
        artistScenes: !missingTable(scenesResult.error?.message),
        artistGallery: !missingTable(galleryResult.error?.message),
      });
      setReady(true);
    });
    return () => { active = false; };
  }, [role, userId]);

  const saveStepProgress = async (chapterId: string, stepId: string) => {
    if (!userId) return;
    const current = progressRef.current[chapterId];
    const available = chapterSteps[chapterId] ?? [];
    const currentIndex = available.findIndex((item) => item.id === current?.furthest_step_id);
    const nextIndex = available.findIndex((item) => item.id === stepId);
    if (current?.completed_at || nextIndex <= currentIndex) return;
    const next: GuideProgressRow = {
      chapter_id: chapterId,
      furthest_step_id: stepId,
      completed_at: current?.completed_at ?? null,
    };
    progressRef.current = { ...progressRef.current, [chapterId]: next };
    setProgressRows(progressRef.current);
    const { error } = await supabase.from("admin_onboarding_progress").upsert({
      user_id: userId,
      ...next,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,chapter_id" });
    if (error) window.dispatchEvent(new CustomEvent("admin-toast", { detail: "가이드 진도를 저장하지 못했습니다." }));
  };

  const completeChapter = async (chapterId: string) => {
    if (!userId) return;
    const furthestStepId = chapterId === "0" ? "0-welcome" : chapterSteps[chapterId]?.at(-1)?.id ?? null;
    const completedAt = new Date().toISOString();
    const { error } = await supabase.from("admin_onboarding_progress").upsert({
      user_id: userId,
      chapter_id: chapterId,
      furthest_step_id: furthestStepId,
      completed_at: completedAt,
      updated_at: completedAt,
    }, { onConflict: "user_id,chapter_id" });
    if (error) {
      window.dispatchEvent(new CustomEvent("admin-toast", { detail: "가이드 진도를 저장하지 못했습니다." }));
      return;
    }
    const next = { chapter_id: chapterId, furthest_step_id: furthestStepId, completed_at: completedAt };
    progressRef.current = { ...progressRef.current, [chapterId]: next };
    setProgressRows(progressRef.current);
  };

  const resolvedHref = (nextStep: GuideStep) => nextStep.href.replace(":artistId", artistId ?? "new");

  const openStep = (chapterId: string, index: number, mode: GuideRun["mode"]) => {
    const nextSteps = chapterSteps[chapterId] ?? [];
    const nextStep = nextSteps[index];
    if (!nextStep) return false;
    const href = resolvedHref(nextStep);
    const currentHref = `${window.location.pathname}${window.location.search}`;
    const stayOnDescendant = Boolean(nextStep.descendantPath
      && guidePathMatches(href, window.location.pathname, true)
      && [nextStep.target, nextStep.interaction?.target].some((target) => target && document.querySelector(`[data-tour-id="${target}"]`)));
    const shouldNavigate = href !== currentHref && !stayOnDescendant;
    if (shouldNavigate && !canNavigate()) return false;
    setWelcomeOpen(false);
    setTocOpen(false);
    setChapterIntro(null);
    setRect(null);
    setPopoverPosition(null);
    setManualPopoverPosition(null);
    setInteractionPrompt(null);
    setPausedRun(null);
    setIsExploring(false);
    startGuideSandbox();
    setRun({ chapterId, index, mode });
    void saveStepProgress(chapterId, nextStep.id);
    if (shouldNavigate) router.push(href);
    return true;
  };

  const startChapter = (chapterId: string, mode: GuideRun["mode"] = "chapter", resume = true) => {
    if (chapterId === "0") {
      setRun(null);
      setTocOpen(false);
      setChapterIntro(null);
      setWelcomeOpen(true);
      return;
    }
    const available = chapterSteps[chapterId] ?? [];
    const row = progressRows[chapterId];
    const savedIndex = row?.completed_at ? -1 : available.findIndex((item) => item.id === row?.furthest_step_id);
    setRun(null);
    setPausedRun(null);
    setRect(null);
    setPopoverPosition(null);
    setInteractionPrompt(null);
    setIsExploring(false);
    setWelcomeOpen(false);
    setTocOpen(false);
    setChapterIntro({ chapterId, index: resume && savedIndex >= 0 ? savedIndex : 0, mode });
  };

  const finishOrAdvance = async () => {
    if (!run) return;
    if (run.index < steps.length - 1) {
      openStep(run.chapterId, run.index + 1, run.mode);
      return;
    }
    await completeChapter(run.chapterId);
    if (run.mode === "full") {
      const chapterIndex = GUIDE_CHAPTERS.findIndex((chapter) => chapter.id === run.chapterId);
      const nextChapter = GUIDE_CHAPTERS.slice(chapterIndex + 1).find((chapter) => chapterSteps[chapter.id]?.length);
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

  useEffect(() => {
    if (!step) return;
    if (!guidePathMatches(resolvedHref(step), pathname, step.descendantPath)) return;
    const navigationTimer = step.target === "admin-search" || step.interaction?.target === "admin-search"
      ? window.setTimeout(() => window.dispatchEvent(new Event("admin-guide-open-navigation")), 100)
      : 0;
    if (step.tabEvent) window.dispatchEvent(new CustomEvent(step.tabEvent.name, { detail: step.tabEvent.detail }));

    let target: HTMLElement | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let searchTimer = 0;
    let lostTimer = 0;
    let revealTimer = 0;
    let animationFrame = 0;
    let promptFrame = 0;
    let skipped = false;
    let awaitingInteraction = false;
    const isRendered = (element: HTMLElement) => {
      const bounds = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return element.isConnected && bounds.width > 0 && bounds.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };
    const isExposed = (element: HTMLElement) => {
      const bounds = element.getBoundingClientRect();
      const insetX = Math.min(8, bounds.width / 2);
      const insetY = Math.min(8, bounds.height / 2);
      const points = [
        [bounds.left + bounds.width / 2, bounds.top + bounds.height / 2],
        [bounds.left + insetX, bounds.top + insetY],
        [bounds.right - insetX, bounds.bottom - insetY],
      ];
      return points.some(([x, y]) => {
        if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return false;
        const top = document.elementsFromPoint(x, y).find((candidate) => !candidate.closest(".admin-guide-layer"));
        return Boolean(top && (top === element || element.contains(top)));
      });
    };
    const visibleTarget = (tourId: string) => {
      const candidates = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour-id="${tourId}"]`)).filter(isRendered);
      return candidates.find(isExposed) ?? candidates[0] ?? null;
    };
    const update = () => {
      if (!target) return;
      const next = target.getBoundingClientRect();
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const targetRect = { top: next.top, left: next.left, width: next.width, height: next.height };
      const popover = dialogRef.current?.getBoundingClientRect();
      setRect(getGuideHighlightRect(targetRect, viewport));
      setPopoverPosition(getGuidePosition(targetRect, {
        width: popover?.width ?? Math.min(380, viewport.width - 32),
        height: popover?.height ?? 360,
      }, viewport));
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(update);
    };
    const observeTarget = () => {
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(scheduleUpdate);
      if (target) resizeObserver.observe(target);
      if (dialogRef.current) resizeObserver.observe(dialogRef.current);
    };
    const revealTarget = (element: HTMLElement) => {
      const bounds = element.getBoundingClientRect();
      if (revealTimer || !shouldRevealGuideTarget(bounds, { width: window.innerWidth, height: window.innerHeight }, isExposed(element))) return;
      element.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
      revealTimer = window.setTimeout(() => {
        revealTimer = 0;
        if (element.isConnected && !isExposed(element)) {
          element.scrollIntoView({ block: "center", inline: "center", behavior: "auto" });
        }
        scheduleUpdate();
      }, 450);
    };
    const attach = (nextTarget: HTMLElement, prompt: string | null = null) => {
      awaitingInteraction = Boolean(prompt);
      cancelAnimationFrame(promptFrame);
      promptFrame = requestAnimationFrame(() => setInteractionPrompt(prompt));
      if (target === nextTarget) return true;
      target?.classList.remove("admin-guide-target");
      target = nextTarget;
      target.classList.add("admin-guide-target");
      revealTarget(target);
      scheduleUpdate();
      observeTarget();
      window.clearTimeout(lostTimer);
      lostTimer = 0;
      return true;
    };
    const findPrimary = () => {
      const nextTarget = visibleTarget(step.target);
      return nextTarget ? attach(nextTarget) : false;
    };
    const findInteraction = () => {
      const nextTarget = step.interaction ? visibleTarget(step.interaction.target) : null;
      return nextTarget && step.interaction ? attach(nextTarget, step.interaction.instruction) : false;
    };
    const skipMissingStep = () => {
      if (skipped) return;
      skipped = true;
      target?.classList.remove("admin-guide-target");
      setRect(null);
      setPopoverPosition(null);
      setInteractionPrompt(null);
      setIsExploring(false);
      void finishOrAdvance();
      window.dispatchEvent(new CustomEvent("admin-toast", { detail: "안내 요소를 찾지 못해 다음 단계로 넘어갑니다." }));
    };
    const validateTarget = () => {
      if (awaitingInteraction && findPrimary()) return;
      if (!target) { if (!findPrimary()) findInteraction(); return; }
      if (target && isRendered(target)) { revealTarget(target); return; }
      if (findPrimary()) return;
      if (findInteraction()) return;
      if (!lostTimer) lostTimer = window.setTimeout(skipMissingStep, 700);
    };
    const observer = new MutationObserver(validateTarget);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden"] });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);
    if (!findPrimary() && !findInteraction()) {
      searchTimer = window.setTimeout(() => {
        if (findPrimary()) return;
        if (findInteraction()) return;
        const fallbackTarget = step.fallbackTarget && step.fallbackTarget !== "admin-page" ? visibleTarget(step.fallbackTarget) : null;
        if (fallbackTarget) attach(fallbackTarget);
        else skipMissingStep();
      }, 4000);
    }
    return () => {
      observer.disconnect();
      target?.classList.remove("admin-guide-target");
      resizeObserver?.disconnect();
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(promptFrame);
      window.clearTimeout(navigationTimer);
      window.clearTimeout(searchTimer);
      window.clearTimeout(lostTimer);
      window.clearTimeout(revealTimer);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
    };
    // pathname repeats tab events after a route transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, step?.id]);

  useEffect(() => {
    document.body.classList.toggle("is-admin-guide-exploring", Boolean(run && isExploring));
    return () => document.body.classList.remove("is-admin-guide-exploring");
  }, [isExploring, run]);

  useEffect(() => {
    document.body.classList.toggle("is-admin-guide-sandbox", Boolean((run || pausedRun) && isGuideSandboxActive()));
    return () => document.body.classList.remove("is-admin-guide-sandbox");
  }, [pausedRun, run]);

  useEffect(() => {
    if (guideOpen && !guideWasOpenRef.current) previousFocusRef.current = document.activeElement as HTMLElement | null;
    if (!guideOpen && guideWasOpenRef.current) {
      const previous = previousFocusRef.current;
      requestAnimationFrame(() => (previous?.isConnected ? previous : launcherRef.current)?.focus());
    }
    guideWasOpenRef.current = guideOpen;
  }, [guideOpen]);

  useEffect(() => {
    if (!welcomeOpen && !tocOpen && !chapterIntro && !run) return;
    const frame = requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("button")?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setWelcomeOpen(false);
        setTocOpen(false);
        setChapterIntro(null);
        setRun(null);
        setPausedRun(null);
        setRect(null);
        localStorage.removeItem(`admin-guide-paused:${userId}`);
        if (isGuideSandboxActive()) {
          window.location.assign(finishGuideSandbox() || window.location.href);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", onKeyDown); };
  }, [chapterIntro, run, tocOpen, userId, welcomeOpen]);

  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled])"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const chooseWelcome = async (mode: "full" | "toc") => {
    await completeChapter("0");
    setWelcomeOpen(false);
    if (mode === "full") startChapter("1", "full", false);
    else setTocOpen(true);
  };

  const closeGuide = () => {
    setWelcomeOpen(false);
    setTocOpen(false);
    setChapterIntro(null);
    setRun(null);
    setPausedRun(null);
    setRect(null);
    setPopoverPosition(null);
    localStorage.removeItem(`admin-guide-paused:${userId}`);
    if (isGuideSandboxActive()) {
      window.location.assign(finishGuideSandbox() || window.location.href);
    }
  };

  const startPopoverDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (window.innerWidth <= 700 || event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    const bounds = dialogRef.current?.getBoundingClientRect();
    if (!bounds) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    popoverDragRef.current = { pointerId: event.pointerId, offsetX: event.clientX - bounds.left, offsetY: event.clientY - bounds.top, width: bounds.width, height: bounds.height };
    setManualPopoverPosition({ top: bounds.top, left: bounds.left });
    setIsPopoverDragging(true);
  };

  const movePopover = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = popoverDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setManualPopoverPosition(getSnappedGuidePosition(
      { top: event.clientY - drag.offsetY, left: event.clientX - drag.offsetX },
      { width: drag.width, height: drag.height },
      { width: window.innerWidth, height: window.innerHeight },
    ));
  };

  const stopPopoverDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (popoverDragRef.current?.pointerId !== event.pointerId) return;
    popoverDragRef.current = null;
    setIsPopoverDragging(false);
  };

  const activePopoverPosition = manualPopoverPosition ?? popoverPosition;

  const portal = mounted && (welcomeOpen || tocOpen || chapterIntro || run) ? createPortal(<>
    {welcomeOpen && <div className="admin-guide-modal-backdrop">
      <div ref={dialogRef} className="admin-guide-welcome" role="dialog" aria-modal="true" aria-labelledby="admin-guide-welcome-title" onKeyDown={trapFocus}>
        <button type="button" className="admin-guide-close" aria-label="가이드 닫기" onClick={closeGuide}><X aria-hidden="true" /></button>
        <span className="admin-guide-kicker">THE MUZE / ADMIN GUIDE</span>
        <h2 id="admin-guide-welcome-title">어디부터 둘러볼까요?</h2>
        <p>실제 데이터를 바꾸지 않고 모든 업무 버튼의 용도, 실행 결과와 주의사항을 화면에서 바로 익힐 수 있습니다.</p>
        <div className="admin-guide-welcome-actions">
          <button type="button" onClick={() => void chooseWelcome("full")}><span>01</span><b>전체 둘러보기</b><small>메인 노출부터 검색까지 업무 순서대로</small><ArrowRight aria-hidden="true" /></button>
          <button type="button" onClick={() => void chooseWelcome("toc")}><span>02</span><b>필요한 것만 보기</b><small>목차에서 원하는 업무를 골라 바로 이동</small><List aria-hidden="true" /></button>
        </div>
      </div>
    </div>}

    {tocOpen && <div className="admin-guide-modal-backdrop admin-guide-toc-backdrop">
      <aside ref={dialogRef} className="admin-guide-toc" role="dialog" aria-modal="true" aria-labelledby="admin-guide-toc-title" onKeyDown={trapFocus}>
        <header>
          <div><span>진행 {reachedSteps} / {totalSteps}</span><h2 id="admin-guide-toc-title">관리자 업무 가이드</h2></div>
          <button type="button" aria-label="목차 닫기" onClick={closeGuide}><X aria-hidden="true" /></button>
        </header>
        <div className="admin-guide-toc-progress"><i style={{ width: `${progress}%` }} /><span>{progress}% 확인</span></div>
        <nav aria-label="가이드 목차">
          {GUIDE_CHAPTERS.map((chapter, index) => {
            const stats = chapterStats[chapter.id];
            const chapterPercent = stats.total ? Math.round((stats.reached / stats.total) * 100) : 0;
            return <button type="button" key={chapter.id} style={{ "--guide-chapter-delay": `${110 + index * 34}ms` } as CSSProperties} className={completed.has(chapter.id) ? "is-complete" : ""} onClick={() => startChapter(chapter.id)}>
              <span className="admin-guide-chapter-number">{chapter.id.padStart(2, "0")}</span>
              <span><b>{chapter.title}</b><em><i style={{ width: `${chapterPercent}%` }} />{stats.reached}/{stats.total}</em></span>
              <i>{completed.has(chapter.id) ? <Check aria-label="완료" /> : <ChevronRight aria-hidden="true" />}</i>
            </button>;
          })}
        </nav>
      </aside>
    </div>}

    {chapterIntro && introChapter && <div className="admin-guide-modal-backdrop admin-guide-chapter-intro-backdrop">
      <section ref={dialogRef} className="admin-guide-chapter-intro" role="dialog" aria-modal="true" aria-labelledby="admin-guide-chapter-intro-title" onKeyDown={trapFocus}>
        <button type="button" className="admin-guide-close" aria-label="챕터 소개 닫기" onClick={closeGuide}><X aria-hidden="true" /></button>
        <span>챕터 {introChapter.id} · {chapterSteps[introChapter.id]?.length ?? 0}개 기능</span>
        <h2 id="admin-guide-chapter-intro-title">{introChapter.title}</h2>
        <p>{introChapter.description}</p>
        <footer>
          <button type="button" onClick={() => { setChapterIntro(null); setTocOpen(true); }}><List aria-hidden="true" /> 목차</button>
          <button type="button" className="is-next" onClick={() => openStep(chapterIntro.chapterId, chapterIntro.index, chapterIntro.mode)}>{chapterIntro.index > 0 ? "이어보기" : "시작하기"}<ArrowRight aria-hidden="true" /></button>
        </footer>
      </section>
    </div>}
    {run && step && <div className={`admin-guide-layer${isExploring ? " is-exploring" : ""}`} aria-live="polite">
      {visibleRect && !isExploring && <div className="admin-guide-spotlight" style={visibleRect} />}
      <section
        key={step.id}
        ref={dialogRef}
        className={`admin-guide-popover${visibleRect ? " is-anchored" : " is-loading"}${isPopoverDragging ? " is-dragging" : ""}`}
        style={visibleRect && activePopoverPosition ? { top: activePopoverPosition.top, left: activePopoverPosition.left, right: "auto", bottom: "auto" } : undefined}
        data-placement={popoverPosition?.placement}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-guide-step-title"
        onMouseEnter={() => setIsExploring(false)}
        onMouseLeave={() => setIsExploring(true)}
        onFocusCapture={() => setIsExploring(false)}
        onKeyDown={trapFocus}
      >
        <header onPointerDown={startPopoverDrag} onPointerMove={movePopover} onPointerUp={stopPopoverDrag} onPointerCancel={stopPopoverDrag} title="드래그해서 안내 박스 옮기기"><span>CHAPTER {run.chapterId.padStart(2, "0")} · {runChapter?.title}<GripHorizontal aria-hidden="true" /></span><button type="button" aria-label="가이드 종료" onClick={closeGuide}><X aria-hidden="true" /></button></header>
        {visibleRect ? <>
          <div className="admin-guide-step-progress"><i style={{ width: `${((run.index + 1) / steps.length) * 100}%` }} /><span>{run.index + 1} / {steps.length}</span></div>
          <div className="admin-guide-badges">
            <div className="admin-guide-safety">
              <button type="button" className="admin-guide-badge is-safe" aria-describedby="admin-guide-safety-tooltip"><ShieldCheck aria-hidden="true" />안전 모드</button>
              <span id="admin-guide-safety-tooltip" role="tooltip">가이드에서 변경·삭제·업로드해도 운영 DB와 실제 파일에는 반영되지 않습니다.</span>
            </div>
            <span className="admin-guide-badge is-feature">지금 보고 있는 기능 · {step.controlLabel}</span>
          </div>
          {interactionPrompt ? <>
            <span className="admin-guide-control-label is-action">먼저 직접 해주세요</span>
            <h2 id="admin-guide-step-title">세부 화면을 열어주세요</h2>
            <p className="admin-guide-purpose">{interactionPrompt}</p>
            <div className="admin-guide-action-cue">강조된 요소를 클릭하면 다음 안내가 자동으로 이어집니다.</div>
            <footer><button type="button" className="admin-guide-jump" onClick={() => { setRun(null); setRect(null); setTocOpen(true); }}><List aria-hidden="true" /> 목차</button></footer>
            <button type="button" className="admin-guide-skip" onClick={() => { setPausedRun(run); setRun(null); setRect(null); setPopoverPosition(null); }}>여기서 멈추기</button>
          </> : <>
            <h2 id="admin-guide-step-title">{step.title}</h2>
            <p className="admin-guide-purpose">{step.purpose}</p>
            {step.actionHint && <div className="admin-guide-action-cue">{step.actionHint}</div>}
            <span className="admin-guide-explore-hint">카드 밖으로 마우스를 옮기면 화면을 편하게 둘러볼 수 있어요.</span>
            <dl><div><dt>사용하면</dt><dd>{step.outcome}</dd></div>{step.caution && <div className="is-caution"><dt>확인하세요</dt><dd>{step.caution}</dd></div>}</dl>
            <footer>
              <button type="button" className="admin-guide-jump" onClick={() => { setRun(null); setRect(null); setTocOpen(true); }}><List aria-hidden="true" /> 목차</button>
              <button type="button" disabled={run.index === 0} onClick={() => openStep(run.chapterId, run.index - 1, run.mode)}><ArrowLeft aria-hidden="true" />이전</button>
              <button type="button" className="is-next" onClick={() => void finishOrAdvance()}>{run.index === steps.length - 1 ? "완료" : "다음 기능"}<ArrowRight aria-hidden="true" /></button>
            </footer>
            <button type="button" className="admin-guide-skip" onClick={() => { setPausedRun(run); setRun(null); setRect(null); setPopoverPosition(null); }}>여기서 멈추고 나중에 이어보기</button>
          </>}
        </> : <><span className="admin-guide-loader" /><p>안내할 위치를 찾고 있어요.</p></>}
      </section>
    </div>}
  </>, document.body) : null;

  if (!ready || !userId || !role) return null;

  return <>
    <button
      ref={launcherRef}
      type="button"
      className={`admin-guide-launcher${isCollapsed ? " is-collapsed" : ""}${pausedRun ? " is-paused" : ""}`}
      onClick={() => {
        if (pausedRun) {
          openStep(pausedRun.chapterId, pausedRun.index, pausedRun.mode);
          return;
        }
        setRun(null);
        if (Object.keys(progressRows).length === 0) setWelcomeOpen(true);
        else setTocOpen(true);
      }}
      aria-label={pausedRun ? "중단된 관리자 가이드 이어보기" : `관리자 가이드, ${progress}% 확인`}
      title={isCollapsed ? pausedRun ? "가이드 이어보기" : `관리자 가이드 · ${progress}%` : undefined}
    >
      <span className="admin-guide-launcher-ring" style={{ "--guide-progress": `${progress * 3.6}deg` } as CSSProperties}>{pausedRun ? <Play aria-hidden="true" /> : <BookOpen aria-hidden="true" />}</span>
      {!isCollapsed && <span><b>{pausedRun ? "가이드 이어보기" : "관리자 업무 가이드"}</b><small>{pausedRun ? `연습 모드 · ${GUIDE_CHAPTERS.find((chapter) => chapter.id === pausedRun.chapterId)?.title ?? "이전 단계"}` : `${reachedSteps}/${totalSteps} 스텝 · ${progress}%`}</small><i><em style={{ width: `${progress}%` }} /></i></span>}
      {!isCollapsed && <ChevronRight aria-hidden="true" />}
    </button>
    {portal}
  </>;
}
