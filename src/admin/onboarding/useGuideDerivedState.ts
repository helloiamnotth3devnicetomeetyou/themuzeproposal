import { useMemo } from "react";
import {
  availableGuideSteps,
  GUIDE_CHAPTERS,
  guideChapterProgress,
  guidePathMatches,
  type GuideProgressRow,
  type GuideRole,
  type GuideRun,
  type GuideStep,
} from "./guide-content";

export function useGuideDerivedState({
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
}: {
  role?: GuideRole;
  artistId?: string;
  capabilities: { artistScenes: boolean; artistGallery: boolean };
  progressRows: Record<string, GuideProgressRow>;
  run: GuideRun | null;
  chapterIntro: GuideRun | null;
  pathname: string;
  rect: { top: number; left: number; width: number; height: number } | null;
  welcomeOpen: boolean;
  tocOpen: boolean;
}) {
  const context = useMemo(
    () => ({
      role: role ?? "editor",
      hasArtist: Boolean(artistId),
      ...capabilities,
    }),
    [artistId, capabilities, role],
  );
  const chapterSteps = useMemo(
    () =>
      Object.fromEntries(
        GUIDE_CHAPTERS.map((chapter) => [
          chapter.id,
          availableGuideSteps(chapter.id, context),
        ]),
      ) as Record<string, GuideStep[]>,
    [context],
  );
  const chapterStats = useMemo(
    () =>
      Object.fromEntries(
        GUIDE_CHAPTERS.map((chapter) => [
          chapter.id,
          guideChapterProgress(
            chapter.id,
            chapterSteps[chapter.id],
            progressRows[chapter.id],
          ),
        ]),
      ),
    [chapterSteps, progressRows],
  );
  const completed = useMemo(
    () =>
      new Set(
        Object.values(progressRows)
          .filter((row) => row.completed_at)
          .map((row) => row.chapter_id),
      ),
    [progressRows],
  );
  const totalSteps = Object.values(chapterStats).reduce(
    (sum, item) => sum + item.total,
    0,
  );
  const reachedSteps = Object.values(chapterStats).reduce(
    (sum, item) => sum + item.reached,
    0,
  );
  const progress = totalSteps
    ? Math.round((reachedSteps / totalSteps) * 100)
    : 0;
  const steps = run ? (chapterSteps[run.chapterId] ?? []) : [];
  const step = run ? steps[run.index] : undefined;
  const runChapter = run
    ? GUIDE_CHAPTERS.find((chapter) => chapter.id === run.chapterId)
    : undefined;
  const introChapter = chapterIntro
    ? GUIDE_CHAPTERS.find((chapter) => chapter.id === chapterIntro.chapterId)
    : undefined;
  const visibleRect =
    !step ||
    guidePathMatches(
      step.href.replace(":artistId", artistId ?? "new"),
      pathname,
      step.descendantPath,
    )
      ? rect
      : null;
  const guideOpen =
    welcomeOpen || tocOpen || Boolean(chapterIntro) || Boolean(run);
  return {
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
  };
}
