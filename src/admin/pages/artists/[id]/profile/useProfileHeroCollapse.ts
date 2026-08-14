"use client";

import { useEffect, type RefObject } from "react";

export function useProfileHeroCollapse(
  editorBodyRef: RefObject<HTMLDivElement | null>,
  loading: boolean,
) {
  useEffect(() => {
    const body = editorBodyRef.current;
    if (!body || loading) return;
    let collapse = 0;

    const setHeroCollapse = (
      shell: HTMLElement,
      nextCollapse: number,
      maximum: number,
    ) => {
      collapse = nextCollapse;
      shell.style.setProperty("--profile-hero-collapse", `${nextCollapse}px`);
      shell.classList.toggle("is-hero-compact", nextCollapse > maximum * 0.55);
    };

    const handleWheel = (event: globalThis.WheelEvent) => {
      if (!event.deltaY) return;
      const shell = body.closest(".profile-workbench") as HTMLElement | null;
      if (!shell) return;

      const maximum =
        window.innerWidth <= 560 ? 92 : window.innerWidth <= 850 ? 109 : 128;
      const current = Math.min(collapse, maximum);

      if (event.deltaY > 0) {
        const remainingOverflow = Math.max(
          0,
          body.scrollHeight - body.clientHeight,
        );
        const usefulMaximum = Math.min(maximum, current + remainingOverflow);
        if (current >= usefulMaximum) return;

        event.preventDefault();
        const next = Math.min(usefulMaximum, current + event.deltaY);
        const unconsumedDelta = Math.max(0, event.deltaY - (next - current));
        setHeroCollapse(shell, next, maximum);
        if (unconsumedDelta) body.scrollTop += unconsumedDelta;
        return;
      }

      if (body.scrollTop <= 0 && current > 0) {
        event.preventDefault();
        setHeroCollapse(shell, Math.max(0, current + event.deltaY), maximum);
      }
    };

    body.addEventListener("wheel", handleWheel, { passive: false });
    return () => body.removeEventListener("wheel", handleWheel);
  }, [editorBodyRef, loading]);
}
