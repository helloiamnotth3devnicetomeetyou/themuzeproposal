import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check, ChevronRight, GripHorizontal, List, ShieldCheck, X } from "lucide-react";
import type { CSSProperties, KeyboardEvent, PointerEvent, RefObject } from "react";
import { GUIDE_CHAPTERS, type GuideChapter, type GuideRun, type GuideStep } from "./guide-content";
import type { GuidePosition } from "./guide-position";

type Rect = { top: number; left: number; width: number; height: number };
type Stats = { total: number; reached: number };
type ActivePopoverPosition = { top: number; left: number };

export function AdminOnboardingPortal({
  mounted, welcomeOpen, tocOpen, chapterIntro, introChapter, run, step, dialogRef, trapFocus, closeGuide, chooseWelcome,
  reachedSteps, totalSteps, progress, chapterStats, completed, startChapter, chapterSteps, openStep, isExploring,
  isMobileGuide, mobileSheetExpanded, visibleRect, activePopoverPosition, popoverPosition, isPopoverDragging,
  interactionPrompt, practiceComplete, runChapter, steps, mobileSheetDragRef, toggleMobileSheet, startMobileSheetDrag,
  stopMobileSheetDrag, startPopoverDrag, movePopover, stopPopoverDrag, updateMobileSheet, setIsExploring, setChapterIntro, setTocOpen,
  setRun, setRect, setPausedRun, setPopoverPosition, finishOrAdvance,
}: {
  mounted: boolean; welcomeOpen: boolean; tocOpen: boolean; chapterIntro: GuideRun | null; introChapter?: GuideChapter;
  run: GuideRun | null; step?: GuideStep; dialogRef: RefObject<HTMLDivElement | null>; trapFocus: (event: KeyboardEvent<HTMLDivElement>) => void;
  closeGuide: () => void; chooseWelcome: (mode: "full" | "toc") => Promise<void>; reachedSteps: number; totalSteps: number; progress: number;
  chapterStats: Record<string, Stats>; completed: Set<string>; startChapter: (id: string) => void; chapterSteps: Record<string, GuideStep[]>;
  openStep: (chapterId: string, index: number, mode: GuideRun["mode"]) => boolean; isExploring: boolean; isMobileGuide: boolean;
  mobileSheetExpanded: boolean; visibleRect: Rect | null; activePopoverPosition: ActivePopoverPosition | null; popoverPosition: GuidePosition | null;
  isPopoverDragging: boolean; interactionPrompt: string | null; practiceComplete: boolean; runChapter?: GuideChapter; steps: GuideStep[];
  mobileSheetDragRef: RefObject<number | null>; toggleMobileSheet: () => void; startMobileSheetDrag: (event: PointerEvent<HTMLButtonElement>) => void;
  stopMobileSheetDrag: (event: PointerEvent<HTMLButtonElement>) => void; startPopoverDrag: (event: PointerEvent<HTMLElement>) => void;
  movePopover: (event: PointerEvent<HTMLElement>) => void; stopPopoverDrag: (event: PointerEvent<HTMLElement>) => void;
  updateMobileSheet: (expanded: boolean) => void; setIsExploring: (value: boolean) => void; setChapterIntro: (value: GuideRun | null) => void; setTocOpen: (value: boolean) => void;
  setRun: (value: GuideRun | null) => void; setRect: (value: Rect | null) => void; setPausedRun: (value: GuideRun | null) => void;
  setPopoverPosition: (value: GuidePosition | null) => void; finishOrAdvance: () => Promise<void>;
}) {
  if (!mounted || (!welcomeOpen && !tocOpen && !chapterIntro && !run)) return null;
  return createPortal(<>
    {welcomeOpen && <div className="admin-guide-modal-backdrop"><div ref={dialogRef} className="admin-guide-welcome" role="dialog" aria-modal="true" aria-labelledby="admin-guide-welcome-title" onKeyDown={trapFocus}>
      <button type="button" className="admin-guide-close" aria-label="가이드 닫기" onClick={closeGuide}><X aria-hidden="true" /></button>
      <span className="admin-guide-kicker">THE MUZE / ADMIN GUIDE</span><h2 id="admin-guide-welcome-title">어디부터 둘러볼까요?</h2>
      <p>실제 데이터를 바꾸지 않고 모든 업무 버튼의 용도, 실행 결과와 주의사항을 화면에서 바로 익힐 수 있습니다.</p>
      <div className="admin-guide-welcome-actions">
        <button type="button" onClick={() => void chooseWelcome("full")}><span>01</span><b>전체 둘러보기</b><small>메인 노출부터 검색까지 업무 순서대로</small><ArrowRight aria-hidden="true" /></button>
        <button type="button" onClick={() => void chooseWelcome("toc")}><span>02</span><b>필요한 것만 보기</b><small>목차에서 원하는 업무를 골라 바로 이동</small><List aria-hidden="true" /></button>
      </div>
    </div></div>}
    {tocOpen && <div className="admin-guide-modal-backdrop admin-guide-toc-backdrop"><aside ref={dialogRef} className="admin-guide-toc" role="dialog" aria-modal="true" aria-labelledby="admin-guide-toc-title" onKeyDown={trapFocus}>
      <header><div><span>진행 {reachedSteps} / {totalSteps}</span><h2 id="admin-guide-toc-title">관리자 업무 가이드</h2></div><button type="button" aria-label="목차 닫기" onClick={closeGuide}><X aria-hidden="true" /></button></header>
      <div className="admin-guide-toc-progress"><i style={{ width: `${progress}%` }} /><span>{progress}% 확인</span></div>
      <nav aria-label="가이드 목차">{GUIDE_CHAPTERS.map((chapter, index) => { const stats = chapterStats[chapter.id]; const percent = stats.total ? Math.round(stats.reached / stats.total * 100) : 0; return <button type="button" key={chapter.id} style={{ "--guide-chapter-delay": `${110 + index * 34}ms` } as CSSProperties} className={completed.has(chapter.id) ? "is-complete" : ""} onClick={() => startChapter(chapter.id)}><span className="admin-guide-chapter-number">{chapter.id.padStart(2, "0")}</span><span><b>{chapter.title}</b><em><i style={{ width: `${percent}%` }} />{stats.reached}/{stats.total}</em></span><i>{completed.has(chapter.id) ? <Check aria-label="완료" /> : <ChevronRight aria-hidden="true" />}</i></button>; })}</nav>
    </aside></div>}
    {chapterIntro && introChapter && <div className="admin-guide-modal-backdrop admin-guide-chapter-intro-backdrop"><section ref={dialogRef} className="admin-guide-chapter-intro" role="dialog" aria-modal="true" aria-labelledby="admin-guide-chapter-intro-title" onKeyDown={trapFocus}>
      <button type="button" className="admin-guide-close" aria-label="챕터 소개 닫기" onClick={closeGuide}><X aria-hidden="true" /></button><span>챕터 {introChapter.id} · {chapterSteps[introChapter.id]?.length ?? 0}개 기능</span><h2 id="admin-guide-chapter-intro-title">{introChapter.title}</h2><p>{introChapter.description}</p>
      <footer><button type="button" onClick={() => { setChapterIntro(null); setTocOpen(true); }}><List aria-hidden="true" /> 목차</button>{chapterIntro.index > 0 && <button type="button" onClick={() => openStep(chapterIntro.chapterId, 0, chapterIntro.mode)}>처음부터 보기</button>}<button type="button" className="is-next" onClick={() => openStep(chapterIntro.chapterId, chapterIntro.index, chapterIntro.mode)}>{chapterIntro.index > 0 ? "이어보기" : "시작하기"}<ArrowRight aria-hidden="true" /></button></footer>
    </section></div>}
    {run && step && <div className={`admin-guide-layer${isExploring ? " is-exploring" : ""}${isMobileGuide && !mobileSheetExpanded ? " is-sheet-collapsed" : ""}`} aria-live="polite">
      {visibleRect && !isExploring && <div className="admin-guide-spotlight" style={visibleRect} />}
      <section key={step.id} ref={dialogRef} className={`admin-guide-popover${visibleRect ? " is-anchored" : " is-loading"}${isPopoverDragging ? " is-dragging" : ""}${isMobileGuide && !mobileSheetExpanded ? " is-mobile-collapsed" : ""}`} style={visibleRect && activePopoverPosition ? { top: activePopoverPosition.top, left: activePopoverPosition.left, right: "auto", bottom: "auto" } : undefined} data-placement={popoverPosition?.placement} role="dialog" aria-modal={!isMobileGuide} aria-labelledby="admin-guide-step-title" onMouseEnter={() => setIsExploring(false)} onMouseLeave={() => setIsExploring(true)} onFocusCapture={() => setIsExploring(false)} onKeyDown={isMobileGuide ? undefined : trapFocus}>
        <div className="admin-guide-mobile-bar"><button type="button" onClick={toggleMobileSheet} onPointerDown={startMobileSheetDrag} onPointerUp={stopMobileSheetDrag} onPointerCancel={() => { mobileSheetDragRef.current = null; }} aria-expanded={mobileSheetExpanded}><span><small>{run.index + 1} / {steps.length}{practiceComplete ? " · 실습 완료" : ""}</small><b>{interactionPrompt ? "화면에서 직접 해보기" : step.title}</b><strong>{interactionPrompt ?? step.instruction}</strong></span><em>{mobileSheetExpanded ? "화면에서 보기" : "설명 보기"}</em></button><button type="button" aria-label="가이드 종료" onClick={closeGuide}><X aria-hidden="true" /></button></div>
        <header onPointerDown={startPopoverDrag} onPointerMove={movePopover} onPointerUp={stopPopoverDrag} onPointerCancel={stopPopoverDrag} title="드래그해서 안내 박스 옮기기"><span>CHAPTER {run.chapterId.padStart(2, "0")} · {runChapter?.title}<GripHorizontal aria-hidden="true" /></span><button type="button" aria-label="가이드 종료" onClick={closeGuide}><X aria-hidden="true" /></button></header>
        {visibleRect ? <><div className="admin-guide-step-progress"><i style={{ width: `${(run.index + 1) / steps.length * 100}%` }} /><span>{run.index + 1} / {steps.length}</span></div>{!isMobileGuide && <div className="admin-guide-badges"><div className="admin-guide-safety"><button type="button" className="admin-guide-badge is-safe" aria-describedby="admin-guide-safety-tooltip"><ShieldCheck aria-hidden="true" />안전 모드</button><span id="admin-guide-safety-tooltip" role="tooltip">가이드에서 변경·삭제·업로드해도 운영 DB와 실제 파일에는 반영되지 않습니다.</span></div><span className="admin-guide-badge is-feature">지금 보고 있는 기능 · {step.controlLabel}</span></div>}
          {interactionPrompt ? <><span className="admin-guide-control-label is-action">먼저 직접 해주세요</span><h2 id="admin-guide-step-title">세부 화면을 열어주세요</h2><p className="admin-guide-purpose">{interactionPrompt}</p><div className="admin-guide-action-cue">강조된 요소를 클릭하면 다음 안내가 자동으로 이어집니다.</div><footer><button type="button" className="admin-guide-jump" onClick={() => { setRun(null); setRect(null); setTocOpen(true); }}><List aria-hidden="true" /> 목차</button></footer><button type="button" className="admin-guide-skip" onClick={() => { setPausedRun(run); setRun(null); setRect(null); setPopoverPosition(null); }}>여기서 멈추기</button></> : <><h2 id="admin-guide-step-title">{step.title}</h2><p className="admin-guide-purpose">{step.purpose}</p>{step.actionHint && <div className="admin-guide-action-cue">{step.actionHint}</div>}<div className={`admin-guide-task${practiceComplete ? " is-complete" : ""}`}><span>{step.practice ? practiceComplete ? "실습 완료" : "지금 해볼 일" : "확인할 위치"}</span><p>{step.instruction}</p>{step.practice?.example && <code>{step.practice.example}</code>}{isMobileGuide && <button type="button" onClick={() => { updateMobileSheet(false); window.dispatchEvent(new Event("admin-guide-reveal-target")); }}>대상 다시 보기</button>}</div>{!isMobileGuide && <span className="admin-guide-explore-hint">카드 밖으로 마우스를 옮기면 화면을 편하게 둘러볼 수 있어요.</span>}<dl><div><dt>사용하면</dt><dd>{step.outcome}</dd></div>{step.caution && <div className="is-caution"><dt>확인하세요</dt><dd>{step.caution}</dd></div>}</dl><footer><button type="button" className="admin-guide-jump" onClick={() => { setRun(null); setRect(null); setTocOpen(true); }}><List aria-hidden="true" /> 목차</button>{step.practice && !practiceComplete && <button type="button" className="admin-guide-practice-skip" onClick={() => void finishOrAdvance()}>실습 건너뛰기</button>}<button type="button" disabled={run.index === 0} onClick={() => openStep(run.chapterId, run.index - 1, run.mode)}><ArrowLeft aria-hidden="true" />이전</button><button type="button" className="is-next" disabled={Boolean(step.practice && !practiceComplete)} onClick={() => void finishOrAdvance()}>{run.index === steps.length - 1 ? "완료" : "다음 기능"}<ArrowRight aria-hidden="true" /></button></footer><button type="button" className="admin-guide-skip" onClick={() => { setPausedRun(run); setRun(null); setRect(null); setPopoverPosition(null); }}>여기서 멈추고 나중에 이어보기</button></>}</> : <><span className="admin-guide-loader" /><p>안내할 위치를 찾고 있어요.</p></>}
      </section>
    </div>}
  </>, document.body);
}
