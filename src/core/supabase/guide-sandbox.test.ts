// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  finishGuideSandbox,
  guideSandboxFetch,
  isGuideSandboxActive,
  isGuideSandboxWrite,
  startGuideSandbox,
} from "./guide-sandbox";

describe("admin guide sandbox", () => {
  beforeEach(() => localStorage.clear());

  it("blocks content writes but keeps reads and guide progress", () => {
    startGuideSandbox();
    expect(isGuideSandboxActive()).toBe(true);
    expect(
      isGuideSandboxWrite(
        "https://example.supabase.co/rest/v1/artists",
        "PATCH",
      ),
    ).toBe(true);
    expect(
      isGuideSandboxWrite("https://example.supabase.co/rest/v1/artists", "GET"),
    ).toBe(false);
    expect(
      isGuideSandboxWrite(
        "https://example.supabase.co/rest/v1/admin_onboarding_progress",
        "POST",
      ),
    ).toBe(false);
    expect(
      isGuideSandboxWrite(
        "https://example.supabase.co/storage/v1/object/sign/protect-evidence/file.webp",
        "POST",
      ),
    ).toBe(false);
  });

  it("restores drafts that existed before the guide", () => {
    localStorage.setItem("admin-draft:profile:1", "before");
    startGuideSandbox();
    expect(localStorage.getItem("admin-draft:profile:1")).toBeNull();
    localStorage.setItem("admin-draft:profile:1", "during");
    localStorage.setItem("admin-draft:settings", "new");
    finishGuideSandbox();
    expect(localStorage.getItem("admin-draft:profile:1")).toBe("before");
    expect(localStorage.getItem("admin-draft:settings")).toBeNull();
    expect(isGuideSandboxActive()).toBe(false);
  });

  it("returns a local representation for a blocked database update", async () => {
    startGuideSandbox();
    const response = await guideSandboxFetch(
      "https://example.supabase.co/rest/v1/artists?id=eq.artist-1",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/vnd.pgrst.object+json",
        },
        body: JSON.stringify({ name: "연습용" }),
      },
    );
    expect(await response.json()).toEqual({ id: "artist-1", name: "연습용" });
  });
});
