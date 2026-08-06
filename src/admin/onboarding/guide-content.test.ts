import { describe, expect, it } from "vitest";
import { GUIDE_STEPS, availableGuideSteps, guideChapterProgress } from "./guide-content";

const context = { role: "editor" as const, hasArtist: true, artistScenes: true, artistGallery: true };

describe("admin guide content", () => {
  it("has unique, handover-ready button steps", () => {
    expect(new Set(GUIDE_STEPS.map((step) => step.id)).size).toBe(GUIDE_STEPS.length);
    expect(GUIDE_STEPS.length).toBeGreaterThan(60);
    for (const step of GUIDE_STEPS) {
      expect(step.controlLabel.trim()).not.toBe("");
      expect(step.purpose.trim()).not.toBe("");
      expect(step.outcome.trim()).not.toBe("");
      expect(step.fallbackTarget).toBeTruthy();
    }
  });

  it("skips unavailable migrations and super-admin-only controls", () => {
    const artistSteps = availableGuideSteps("2", { ...context, artistScenes: false, artistGallery: false });
    expect(artistSteps.some((step) => step.requires === "artist_scenes" || step.requires === "artist_gallery")).toBe(false);
    expect(availableGuideSteps("8", context).some((step) => step.role === "super_admin")).toBe(false);
    expect(availableGuideSteps("8", { ...context, role: "super_admin" }).some((step) => step.id === "8-admin-invite")).toBe(true);
  });

  it("counts reached steps and completion without regressing", () => {
    const steps = availableGuideSteps("1", context);
    expect(guideChapterProgress("1", steps)).toEqual({ reached: 0, total: steps.length });
    expect(guideChapterProgress("1", steps, { chapter_id: "1", furthest_step_id: steps[2].id, completed_at: null })).toEqual({ reached: 3, total: steps.length });
    expect(guideChapterProgress("1", steps, { chapter_id: "1", furthest_step_id: steps[2].id, completed_at: "2026-08-07" })).toEqual({ reached: steps.length, total: steps.length });
  });
});
