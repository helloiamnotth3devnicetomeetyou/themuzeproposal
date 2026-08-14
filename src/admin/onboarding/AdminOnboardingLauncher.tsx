import { BookOpen, ChevronRight, Play } from "lucide-react";
import type { CSSProperties, RefObject } from "react";
import { GUIDE_CHAPTERS, type GuideRun } from "./guide-content";

export function AdminOnboardingLauncher({
  launcherRef,
  isCollapsed,
  pausedRun,
  progress,
  reachedSteps,
  totalSteps,
  onOpen,
}: {
  launcherRef: RefObject<HTMLButtonElement | null>;
  isCollapsed: boolean;
  pausedRun: GuideRun | null;
  progress: number;
  reachedSteps: number;
  totalSteps: number;
  onOpen: () => void;
}) {
  return (
    <button
      ref={launcherRef}
      type="button"
      className={`admin-guide-launcher${isCollapsed ? " is-collapsed" : ""}${pausedRun ? " is-paused" : ""}`}
      onClick={onOpen}
      aria-label={
        pausedRun
          ? "\uC911\uB2E8\uB41C \uAD00\uB9AC\uC790 \uAC00\uC774\uB4DC \uC774\uC5B4\uBCF4\uAE30"
          : `\uAD00\uB9AC\uC790 \uAC00\uC774\uB4DC, ${progress}% \uD655\uC778`
      }
      title={
        isCollapsed
          ? pausedRun
            ? "\uAC00\uC774\uB4DC \uC774\uC5B4\uBCF4\uAE30"
            : `\uAD00\uB9AC\uC790 \uAC00\uC774\uB4DC \u00B7 ${progress}%`
          : undefined
      }
    >
      <span
        className="admin-guide-launcher-ring"
        style={
          { "--guide-progress": `${progress * 3.6}deg` } as CSSProperties
        }
      >
        {pausedRun ? (
          <Play aria-hidden="true" />
        ) : (
          <BookOpen aria-hidden="true" />
        )}
      </span>
      {!isCollapsed && (
        <span>
          <b>
            {pausedRun
              ? "\uAC00\uC774\uB4DC \uC774\uC5B4\uBCF4\uAE30"
              : "\uAD00\uB9AC\uC790 \uC5C5\uBB34 \uAC00\uC774\uB4DC"}
          </b>
          <small>
            {pausedRun
              ? `\uC5F0\uC2B5 \uBAA8\uB4DC \u00B7 ${GUIDE_CHAPTERS.find((chapter) => chapter.id === pausedRun.chapterId)?.title ?? "\uC774\uC804 \uB2E8\uACC4"}`
              : `${reachedSteps}/${totalSteps} \uC2A4\uD15D \u00B7 ${progress}%`}
          </small>
          <i>
            <em style={{ width: `${progress}%` }} />
          </i>
        </span>
      )}
      {!isCollapsed && <ChevronRight aria-hidden="true" />}
    </button>
  );
}
