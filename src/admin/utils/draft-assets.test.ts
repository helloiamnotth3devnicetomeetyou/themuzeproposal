import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanupAbandonedDraftImageAssets,
  finalizeDraftImageAssets,
  trackDraftImageAsset,
} from "./draft-assets";

const remove = vi.fn();
const client = {
  storage: { from: vi.fn(() => ({ remove })) },
};
const asset = (path: string) => ({
  bucket: "artist-assets" as const,
  path,
  url: `https://storage.example/storage/v1/object/public/artist-assets/${path}`,
});

describe("draft image asset lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    remove.mockResolvedValue({ error: null });
  });

  it("deletes only abandoned tracked uploads", async () => {
    vi.spyOn(Date, "now").mockReturnValueOnce(1_000).mockReturnValueOnce(31 * 60 * 1_000);
    trackDraftImageAsset(asset("artist/old.jpg"));

    await cleanupAbandonedDraftImageAssets(client as never);

    expect(remove).toHaveBeenCalledWith(["artist/old.jpg"]);
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
      ["https://storage.example/storage/v1/object/public/artist-assets/artist/old%20logo.jpg", "https://external.example/logo.jpg"],
    );

    expect(remove).toHaveBeenCalledWith(["artist/unused.jpg", "artist/old logo.jpg"]);
    expect(localStorage.getItem("themuze:admin-draft-assets")).toBe("[]");
  });
});
