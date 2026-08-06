"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, List, X } from "lucide-react";
import { supabase } from "@/core/supabase/client";
import {
  GUIDE_CHAPTERS,
  availableGuideSteps,
  guideChapterProgress,
  type GuideProgressRow,
  type GuideRole,
  type GuideStep,
} from "./guide-content";

type Artist = { id: string; name: string };
type Run = { chapterId: string; index: number; mode: "full" | "chapter" };
type ChapterIntro = Run;
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
  const progressRef = useRef<Record<string, GuideProgressRow>>({});
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [ready, setReady] = useState(false);
  const [progressRows, setProgressRows] = useState<Record<string, GuideProgressRow>>({});
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [chapterIntro, setChapterIntro] = useState<ChapterIntro | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
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
  const introChapter = chapterIntro ? GUIDE_CHAPTERS.find((chapter) => chapter.id === chapterIntro.chapterId) : undefined;
  const stepOnCurrentPath = !step || pathname === step.href.replace(":artistId", artistId ?? "new").split("?")[0];
  const visibleRect = stepOnCurrentPath ? rect : null;

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
      if (!progressResult.error && rows.length === 0) setWelcomeOpen(true);
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

  const openStep = (chapterId: string, index: number, mode: Run["mode"]) => {
    const nextSteps = chapterSteps[chapterId] ?? [];
    const nextStep = nextSteps[index];
    if (!nextStep) return false;
    const href = resolvedHref(nextStep);
    const currentHref = `${window.location.pathname}${window.location.search}`;
    if (href !== currentHref && !canNavigate()) return false;
    setWelcomeOpen(false);
    setTocOpen(false);
    setChapterIntro(null);
    setRect(null);
    setRun({ chapterId, index, mode });
    void saveStepProgress(chapterId, nextStep.id);
    if (href !== currentHref) router.push(href);
    return true;
  };

  const startChapter = (chapterId: string, mode: Run["mode"] = "chapter", resume = true) => {
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
    setRect(null);
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
    setTocOpen(true);
  };

  useEffect(() => {
    if (!step) return;
    const expectedPath = new URL(resolvedHref(step), window.location.origin).pathname;
    if (pathname !== expectedPath) return;
    const navigationTimer = step.target === "admin-search"
      ? window.setTimeout(() => window.dispatchEvent(new Event("admin-guide-open-navigation")), 100)
      : 0;
    if (step.tabEvent) window.dispatchEvent(new CustomEvent(step.tabEvent.name, { detail: step.tabEvent.detail }));

    let target: HTMLElement | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let fallbackTimer = 0;
    const visibleTarget = (tourId: string) => Array.from(document.querySelectorAll<HTMLElement>(`[data-tour-id="${tourId}"]`))
      .find((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0;
      }) ?? null;
    const update = () => {
      if (!target) return;
      const next = target.getBoundingClientRect();
      const padding = 8;
      setRect({
        top: Math.max(8, next.top - padding),
        left: Math.max(8, next.left - padding),
        width: Math.min(window.innerWidth - 16, next.width + padding * 2),
        height: Math.min(window.innerHeight - 16, next.height + padding * 2),
      });
    };
    const attach = (nextTarget: HTMLElement) => {
      if (target) return true;
      target = nextTarget;
      target.scrollIntoView({ block: "nearest", inline: "nearest" });
      update();
      resizeObserver = new ResizeObserver(update);
      resizeObserver.observe(target);
      window.addEventListener("resize", update);
      window.addEventListener("scroll", update, true);
      return true;
    };
    const findPrimary = () => {
      const nextTarget = visibleTarget(step.target);
      return nextTarget ? attach(nextTarget) : false;
    };
    if (!findPrimary()) {
      const observer = new MutationObserver(() => { if (findPrimary()) observer.disconnect(); });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      fallbackTimer = window.setTimeout(() => {
        observer.disconnect();
        const fallbackTarget = step.fallbackTarget ? visibleTarget(step.fallbackTarget) : null;
        if (fallbackTarget) attach(fallbackTarget);
      }, 700);
      return () => {
        observer.disconnect();
        resizeObserver?.disconnect();
        window.clearTimeout(navigationTimer);
        window.clearTimeout(fallbackTimer);
        window.removeEventListener("resize", update);
        window.removeEventListener("scroll", update, true);
      };
    }
    return () => {
      resizeObserver?.disconnect();
      window.clearTimeout(navigationTimer);
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
    // pathname repeats tab events after a route transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, step?.id]);

  useEffect(() => {
    if (!welcomeOpen && !tocOpen && !chapterIntro && !run) return;
    const frame = requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("button")?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setWelcomeOpen(false);
        setTocOpen(false);
        setChapterIntro(null);
        setRun(null);
        setRect(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", onKeyDown); };
  }, [chapterIntro, run, tocOpen, welcomeOpen]);

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

  const portal = mounted && (welcomeOpen || tocOpen || chapterIntro || run) ? createPortal(<>
    {welcomeOpen && <div className="admin-guide-modal-backdrop">
      <div ref={dialogRef} className="admin-guide-welcome" role="dialog" aria-modal="true" aria-labelledby="admin-guide-welcome-title" onKeyDown={trapFocus}>
        <button type="button" className="admin-guide-close" aria-label="가이드 닫기" onClick={() => setWelcomeOpen(false)}><X aria-hidden="true" /></button>
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
          <button type="button" aria-label="목차 닫기" onClick={() => setTocOpen(false)}><X aria-hidden="true" /></button>
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
        <button type="button" className="admin-guide-close" aria-label="챕터 소개 닫기" onClick={() => setChapterIntro(null)}><X aria-hidden="true" /></button>
        <span>챕터 {introChapter.id} · {chapterSteps[introChapter.id]?.length ?? 0}개 기능</span>
        <h2 id="admin-guide-chapter-intro-title">{introChapter.title}</h2>
        <p>{introChapter.description}</p>
        <footer>
          <button type="button" onClick={() => { setChapterIntro(null); setTocOpen(true); }}><List aria-hidden="true" /> 목차</button>
          <button type="button" className="is-next" onClick={() => openStep(chapterIntro.chapterId, chapterIntro.index, chapterIntro.mode)}>{chapterIntro.index > 0 ? "이어보기" : "시작하기"}<ArrowRight aria-hidden="true" /></button>
        </footer>
      </section>
    </div>}
    {run && step && <div className="admin-guide-layer" aria-live="polite">
      {visibleRect && <div className="admin-guide-highlight" style={visibleRect} />}
      <section ref={dialogRef} className={`admin-guide-popover${visibleRect ? "" : " is-loading"}`} role="dialog" aria-modal="true" aria-labelledby="admin-guide-step-title" onKeyDown={trapFocus}>
        <header><span>CHAPTER {run.chapterId.padStart(2, "0")}</span><button type="button" aria-label="가이드 닫기" onClick={() => { setRun(null); setRect(null); }}><X aria-hidden="true" /></button></header>
        {visibleRect ? <>
          <div className="admin-guide-step-progress"><i style={{ width: `${((run.index + 1) / steps.length) * 100}%` }} /><span>{run.index + 1} / {steps.length}</span></div>
          <span className="admin-guide-control-label">버튼 · {step.controlLabel}</span>
          <h2 id="admin-guide-step-title">{step.title}</h2>
          <p className="admin-guide-purpose">{step.purpose}</p>
          <dl><div><dt>실행 결과</dt><dd>{step.outcome}</dd></div>{step.caution && <div className="is-caution"><dt>주의</dt><dd>{step.caution}</dd></div>}</dl>
          <footer>
            <button type="button" className="admin-guide-jump" onClick={() => { setRun(null); setRect(null); setTocOpen(true); }}><List aria-hidden="true" /> 목차</button>
            <button type="button" disabled={run.index === 0} aria-label="이전 단계" onClick={() => openStep(run.chapterId, run.index - 1, run.mode)}><ArrowLeft aria-hidden="true" /></button>
            <button type="button" className="is-next" onClick={() => void finishOrAdvance()}>{run.index === steps.length - 1 ? "완료" : "다음"}<ArrowRight aria-hidden="true" /></button>
          </footer>
          <button type="button" className="admin-guide-skip" onClick={() => { setRun(null); setRect(null); }}>나중에 이어보기</button>
        </> : <><span className="admin-guide-loader" /><p>안내할 버튼을 찾는 중입니다.</p></>}
      </section>
    </div>}
  </>, document.body) : null;

  if (!ready || !userId || !role) return null;

  return <>
    <button
      type="button"
      className={`admin-guide-launcher${isCollapsed ? " is-collapsed" : ""}`}
      onClick={() => { setRun(null); setWelcomeOpen(false); setTocOpen(true); }}
      aria-label={`관리자 가이드, ${progress}% 확인`}
      title={isCollapsed ? `관리자 가이드 · ${progress}%` : undefined}
    >
      <span className="admin-guide-launcher-ring" style={{ "--guide-progress": `${progress * 3.6}deg` } as CSSProperties}><BookOpen aria-hidden="true" /></span>
      {!isCollapsed && <span><b>관리자 업무 가이드</b><small>{reachedSteps}/{totalSteps} 스텝 · {progress}%</small><i><em style={{ width: `${progress}%` }} /></i></span>}
      {!isCollapsed && <ChevronRight aria-hidden="true" />}
    </button>
    {portal}
  </>;
}
