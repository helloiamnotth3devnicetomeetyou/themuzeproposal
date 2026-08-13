import { describe, expect, it } from "vitest";
import {
  GUIDE_STEPS,
  availableGuideSteps,
  guideChapterProgress,
  guidePathMatches,
  parseGuideRun,
} from "./guide-content";

const context = {
  role: "editor" as const,
  hasArtist: true,
  artistScenes: true,
  artistGallery: true,
};

describe("admin guide content", () => {
  it("has unique, handover-ready button steps", () => {
    expect(new Set(GUIDE_STEPS.map((step) => step.id)).size).toBe(
      GUIDE_STEPS.length,
    );
    expect(GUIDE_STEPS.length).toBeGreaterThan(60);
    for (const step of GUIDE_STEPS) {
      expect(step.controlLabel.trim()).not.toBe("");
      expect(step.purpose.trim()).not.toBe("");
      expect(step.outcome.trim()).not.toBe("");
      expect(step.instruction.trim()).not.toBe("");
      expect(step.fallbackTarget).toBeTruthy();
    }
  });

  it("defines concrete, optional practice tasks for the core mobile flows", () => {
    const practices = new Map(
      GUIDE_STEPS.filter((step) => step.practice).map((step) => [
        step.id,
        step.practice,
      ]),
    );
    expect(practices.get("1-add")).toMatchObject({ event: "click" });
    expect(practices.get("1-reorder")).toMatchObject({ event: "pointerup" });
    expect(practices.get("3-search")).toMatchObject({
      event: "input",
      example: "공지",
    });
    expect(practices.get("4-question-add")?.instruction).toContain("질문 추가");
    expect(practices.get("9-search")?.example).toBe("공지");
  });

  it("keeps the mobile quick start on the planned bottom-navigation routes", () => {
    expect(
      availableGuideSteps("mobile", context).map(({ id, href, target }) => ({
        id,
        href,
        target,
      })),
    ).toEqual([
      {
        id: "mobile-dashboard",
        href: "/admin",
        target: "admin-mobile-dashboard",
      },
      {
        id: "mobile-inbox",
        href: "/admin/inbox",
        target: "admin-mobile-inbox",
      },
      {
        id: "mobile-content",
        href: "/admin/content",
        target: "admin-mobile-content",
      },
      { id: "mobile-more", href: "/admin", target: "admin-mobile-more" },
    ]);
  });

  it("skips unavailable migrations and super-admin-only controls", () => {
    const artistSteps = availableGuideSteps("2", {
      ...context,
      artistScenes: false,
      artistGallery: false,
    });
    expect(
      artistSteps.some(
        (step) =>
          step.requires === "artist_scenes" ||
          step.requires === "artist_gallery",
      ),
    ).toBe(false);
    expect(
      availableGuideSteps("8", context).some(
        (step) => step.role === "super_admin",
      ),
    ).toBe(false);
    expect(
      availableGuideSteps("8", { ...context, role: "super_admin" }).some(
        (step) => step.id === "8-admin-invite",
      ),
    ).toBe(true);
  });

  it("counts reached steps and completion without regressing", () => {
    const steps = availableGuideSteps("1", context);
    expect(guideChapterProgress("1", steps)).toEqual({
      reached: 0,
      total: steps.length,
    });
    expect(
      guideChapterProgress("1", steps, {
        chapter_id: "1",
        furthest_step_id: steps[2].id,
        completed_at: null,
      }),
    ).toEqual({ reached: 3, total: steps.length });
    expect(
      guideChapterProgress("1", steps, {
        chapter_id: "1",
        furthest_step_id: steps[2].id,
        completed_at: "2026-08-07",
      }),
    ).toEqual({ reached: steps.length, total: steps.length });
  });

  it("keeps an interactive step active on its nested detail route", () => {
    expect(
      guidePathMatches(
        "/admin/auditions/campaigns",
        "/admin/auditions/campaigns/123/builder",
        true,
      ),
    ).toBe(true);
    expect(
      guidePathMatches(
        "/admin/auditions/campaigns",
        "/admin/auditions/campaigns/123/builder",
      ),
    ).toBe(false);
  });

  it("restores only valid paused guide state", () => {
    expect(
      parseGuideRun('{"chapterId":"4","index":5,"mode":"chapter"}'),
    ).toEqual({ chapterId: "4", index: 5, mode: "chapter" });
    expect(parseGuideRun("broken")).toBeNull();
    expect(
      parseGuideRun('{"chapterId":"4","index":"5","mode":"chapter"}'),
    ).toBeNull();
  });

  it("finishes each tab before moving to the next tab", () => {
    const artist = availableGuideSteps("2", context).map((step) => step.id);
    expect(artist.indexOf("2-profile-social")).toBeLessThan(
      artist.indexOf("2-scene-import"),
    );
    expect(artist.indexOf("2-scene-delete")).toBeLessThan(
      artist.indexOf("2-gallery-upload"),
    );
    expect(artist.indexOf("2-gallery-delete")).toBeLessThan(
      artist.indexOf("2-profile-publish"),
    );

    const settings = availableGuideSteps("8", context).map((step) => step.id);
    expect(
      settings.slice(
        settings.indexOf("8-history-tab"),
        settings.indexOf("8-footer"),
      ),
    ).toEqual(["8-history-tab", "8-history-add", "8-history-delete"]);
    expect(settings.indexOf("8-avatar-delete")).toBeLessThan(
      settings.indexOf("8-save"),
    );
  });
});
