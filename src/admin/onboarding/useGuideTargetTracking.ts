import { useEffect, type RefObject } from "react";
import {
  getGuideHighlightRect,
  getGuidePosition,
  shouldRevealGuideTarget,
  type GuidePosition,
} from "./guide-position";
import { guidePathMatches, type GuideStep } from "./guide-content";

type Rect = { top: number; left: number; width: number; height: number };

const getScrollableParent = (element: HTMLElement) => {
  let parent = element.parentElement;
  while (parent) {
    const overflowY = window.getComputedStyle(parent).overflowY;
    if (
      /(auto|scroll)/.test(overflowY) &&
      parent.scrollHeight > parent.clientHeight
    )
      return parent;
    parent = parent.parentElement;
  }
  return null;
};

export function useGuideTargetTracking({
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
}: {
  step?: GuideStep;
  pathname: string;
  artistId?: string;
  dialogRef: RefObject<HTMLDivElement | null>;
  saveStepProgress: (chapterId: string, stepId: string) => Promise<void>;
  finishOrAdvance: () => Promise<void>;
  setRect: (value: Rect | null) => void;
  setPopoverPosition: (value: GuidePosition | null) => void;
  setInteractionPrompt: (value: string | null) => void;
  setIsExploring: (value: boolean) => void;
  setPracticeComplete: (value: boolean) => void;
  setMobileSheetExpanded: (value: boolean) => void;
}) {
  useEffect(() => {
    if (
      !step ||
      !guidePathMatches(
        step.href.replace(":artistId", artistId ?? "new"),
        pathname,
        step.descendantPath,
      )
    )
      return;
    const navigationTimer =
      step.target === "admin-search" ||
      step.interaction?.target === "admin-search"
        ? window.setTimeout(
            () =>
              window.dispatchEvent(new Event("admin-guide-open-navigation")),
            100,
          )
        : 0;
    if (step.tabEvent)
      window.dispatchEvent(
        new CustomEvent(step.tabEvent.name, { detail: step.tabEvent.detail }),
      );

    let target: HTMLElement | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let searchTimer = 0;
    let lostTimer = 0;
    let revealTimer = 0;
    let animationFrame = 0;
    let promptFrame = 0;
    let practiceTimer = 0;
    let skipped = false;
    let awaitingInteraction = false;
    let practiceDone = false;
    let practiceArmed = false;
    let revealedTarget: HTMLElement | null = null;
    const usableViewport = () => {
      const mobile = window.matchMedia("(max-width: 700px)").matches;
      const visualHeight = window.visualViewport?.height ?? window.innerHeight;
      const sheetHeight = mobile
        ? (dialogRef.current?.getBoundingClientRect().height ?? 0)
        : 0;
      return {
        width: window.innerWidth,
        height: Math.max(160, visualHeight - sheetHeight - (mobile ? 12 : 0)),
        visualHeight,
      };
    };
    const isRendered = (element: HTMLElement) => {
      const bounds = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        element.isConnected &&
        bounds.width > 0 &&
        bounds.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden"
      );
    };
    const isExposed = (element: HTMLElement) => {
      const bounds = element.getBoundingClientRect();
      const insetX = Math.min(8, bounds.width / 2);
      const insetY = Math.min(8, bounds.height / 2);
      return [
        [bounds.left + bounds.width / 2, bounds.top + bounds.height / 2],
        [bounds.left + insetX, bounds.top + insetY],
        [bounds.right - insetX, bounds.bottom - insetY],
      ].some(([x, y]) => {
        if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight)
          return false;
        const top = document
          .elementsFromPoint(x, y)
          .find((candidate) => !candidate.closest(".admin-guide-layer"));
        return Boolean(top && (top === element || element.contains(top)));
      });
    };
    const visibleTarget = (tourId: string) => {
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>(`[data-tour-id="${tourId}"]`),
      ).filter(isRendered);
      const exposed = candidates.filter(isExposed);
      return (
        exposed.find((candidate) => !candidate.matches(":disabled")) ??
        candidates.find((candidate) => !candidate.matches(":disabled")) ??
        exposed[0] ??
        candidates[0] ??
        null
      );
    };
    const update = () => {
      if (!target) return;
      const next = target.getBoundingClientRect();
      const viewport = usableViewport();
      const targetRect = {
        top: next.top,
        left: next.left,
        width: next.width,
        height: next.height,
      };
      const popover = dialogRef.current?.getBoundingClientRect();
      setRect(getGuideHighlightRect(targetRect, viewport));
      setPopoverPosition(
        getGuidePosition(
          targetRect,
          {
            width: popover?.width ?? Math.min(380, viewport.width - 32),
            height: popover?.height ?? 360,
          },
          viewport,
        ),
      );
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
    const revealTarget = (element: HTMLElement, force = false) => {
      if (!force && revealedTarget === element) return;
      revealedTarget = element;
      const bounds = element.getBoundingClientRect();
      const viewport = usableViewport();
      if (
        revealTimer ||
        !shouldRevealGuideTarget(bounds, viewport, isExposed(element))
      )
        return;
      element.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "smooth",
      });
      revealTimer = window.setTimeout(() => {
        revealTimer = 0;
        if (!element.isConnected) return;
        const next = element.getBoundingClientRect();
        const nextViewport = usableViewport();
        const delta =
          next.bottom > nextViewport.height - 20
            ? next.bottom - nextViewport.height + 20
            : next.top < 20
              ? next.top - 20
              : 0;
        if (delta)
          (getScrollableParent(element) ?? window).scrollBy({
            top: delta,
            behavior: "smooth",
          });
        scheduleUpdate();
      }, 360);
    };
    const markPracticeComplete = () => {
      if (!step.practice || practiceDone) return;
      practiceDone = true;
      setPracticeComplete(true);
      void saveStepProgress(step.chapterId, step.id);
      practiceTimer = window.setTimeout(() => void finishOrAdvance(), 400);
    };
    const completePractice = (event: Event) => {
      if (
        event.type === "admin-guide-practice" &&
        (event as CustomEvent<string>).detail === step.id
      ) {
        markPracticeComplete();
        return;
      }
      const practiceTourId = step.practice?.target ?? step.target;
      if (
        !event
          .composedPath()
          .some(
            (node) =>
              node instanceof HTMLElement &&
              node.dataset.tourId === practiceTourId,
          )
      )
        return;
      if (
        step.practice?.event === "input" ||
        step.practice?.event === "change"
      ) {
        const field = event.target;
        if (
          (field instanceof HTMLInputElement ||
            field instanceof HTMLTextAreaElement ||
            field instanceof HTMLSelectElement) &&
          !field.value.trim()
        )
          return;
        window.clearTimeout(practiceTimer);
        practiceTimer = window.setTimeout(markPracticeComplete, 350);
        return;
      }
      markPracticeComplete();
    };
    const armPractice = (tourId: string) => {
      const practiceTourId = step.practice?.target ?? step.target;
      if (!step.practice || tourId !== practiceTourId || practiceArmed) return;
      practiceArmed = true;
      document.addEventListener(step.practice.event, completePractice, true);
    };
    const attach = (
      nextTarget: HTMLElement,
      prompt: string | null = null,
      tourId = "",
    ) => {
      awaitingInteraction = Boolean(prompt);
      cancelAnimationFrame(promptFrame);
      promptFrame = requestAnimationFrame(() => {
        setInteractionPrompt(prompt);
        if (prompt && window.matchMedia("(max-width: 700px)").matches)
          setMobileSheetExpanded(false);
      });
      armPractice(tourId);
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
      return nextTarget ? attach(nextTarget, null, step.target) : false;
    };
    const findInteraction = () => {
      const nextTarget = step.interaction
        ? visibleTarget(step.interaction.target)
        : null;
      return nextTarget && step.interaction
        ? attach(
            nextTarget,
            step.interaction.instruction,
            step.interaction.target,
          )
        : false;
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
      window.dispatchEvent(
        new CustomEvent("admin-toast", {
          detail: "안내 요소를 찾지 못해 다음 단계로 넘어갑니다.",
        }),
      );
    };
    const validateTarget = () => {
      if (awaitingInteraction && findPrimary()) return;
      if (!target) {
        if (!findPrimary()) findInteraction();
        return;
      }
      if (isRendered(target) || findPrimary() || findInteraction()) return;
      if (!lostTimer) lostTimer = window.setTimeout(skipMissingStep, 700);
    };
    const observer = new MutationObserver(validateTarget);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden"],
    });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);
    if (!findPrimary() && !findInteraction()) {
      searchTimer = window.setTimeout(() => {
        if (findPrimary() || findInteraction()) return;
        const fallbackTarget =
          step.fallbackTarget && step.fallbackTarget !== "admin-page"
            ? visibleTarget(step.fallbackTarget)
            : null;
        if (fallbackTarget) attach(fallbackTarget, null, step.fallbackTarget);
        else skipMissingStep();
      }, 4000);
    }
    const revealActiveTarget = () => {
      if (target) revealTarget(target, true);
    };
    window.addEventListener("admin-guide-reveal-target", revealActiveTarget);
    window.visualViewport?.addEventListener("resize", scheduleUpdate);
    window.visualViewport?.addEventListener("scroll", scheduleUpdate);
    return () => {
      observer.disconnect();
      target?.classList.remove("admin-guide-target");
      if (practiceArmed && step.practice)
        document.removeEventListener(
          step.practice.event,
          completePractice,
          true,
        );
      resizeObserver?.disconnect();
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(promptFrame);
      window.clearTimeout(navigationTimer);
      window.clearTimeout(searchTimer);
      window.clearTimeout(lostTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(practiceTimer);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
      window.removeEventListener(
        "admin-guide-reveal-target",
        revealActiveTarget,
      );
      window.visualViewport?.removeEventListener("resize", scheduleUpdate);
      window.visualViewport?.removeEventListener("scroll", scheduleUpdate);
    };
    // pathname repeats tab events after a route transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, step?.id]);
}
