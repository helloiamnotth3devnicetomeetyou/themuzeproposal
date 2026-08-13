import { beforeEach, describe, expect, it, vi } from "vitest";
const deleteAdminAssets = vi.hoisted(() => vi.fn());
vi.mock("@/admin/utils/delete-admin-assets", () => ({ deleteAdminAssets }));
import {
  cleanupAbandonedDraftImageAssets,
  finalizeDraftImageAssets,
  trackDraftImageAsset,
} from "./draft-assets";

const client = {
  storage: { from: vi.fn() },
};
const asset = (path: string) => ({
  bucket: "artist-assets" as const,
  path,
  url: `https://storage.example/artist-assets/${path}`,
});

describe("draft image asset lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_URL", "https://storage.example");
    localStorage.clear();
    deleteAdminAssets.mockResolvedValue(true);
  });

  it("deletes only abandoned tracked uploads", async () => {
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(31 * 60 * 1_000);
    trackDraftImageAsset(asset("artist/old.jpg"));

    await cleanupAbandonedDraftImageAssets(client as never);

    expect(deleteAdminAssets).toHaveBeenCalledWith("artist-assets", [
      "artist/old.jpg",
    ]);
    expect(localStorage.getItem("themuze:admin-draft-assets")).toBe("[]");
  });

  it("keeps referenced uploads and deletes replaced managed originals once", async () => {
    const kept = asset("artist/kept.jpg");
    const unused = asset("artist/unused.jpg");
    trackDraftImageAsset(kept);
    trackDraftImageAsset(unused);

    await finalizeDraftImageAssets(
      client as never,
      [kept, unused],
      [kept.url],
      [
        "https://storage.example/artist-assets/artist/old%20logo.jpg",
        "https://external.example/logo.jpg",
      ],
    );

    expect(deleteAdminAssets).toHaveBeenCalledWith("artist-assets", [
      "artist/unused.jpg",
      "artist/old logo.jpg",
    ]);
    expect(localStorage.getItem("themuze:admin-draft-assets")).toBe("[]");
  });
});
