// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  isAdmin: vi.fn(),
  createSessionClient: vi.fn(),
  createServiceClient: vi.fn(),
  upload: vi.fn(),
  createSignedUploadUrl: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/core/auth/admin-auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/core/config/public-env", () => ({ getPublicSupabaseConfig: () => ({ storageUrl: "https://storage.example" }) }));
vi.mock("@/core/supabase/server", () => ({ createSupabaseServerClient: mocks.createSessionClient }));
vi.mock("@/core/uploads/service-storage", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/core/uploads/service-storage")>(),
  createServiceRoleClient: mocks.createServiceClient,
}));

import { POST } from "./admin-asset-route";

describe("POST /api/uploads/admin-asset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
    mocks.isAdmin.mockResolvedValue(true);
    mocks.createSessionClient.mockResolvedValue({ auth: { getUser: mocks.getUser } });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.createSignedUploadUrl.mockResolvedValue({ data: { token: "signed-token" }, error: null });
    mocks.createServiceClient.mockReturnValue({
      storage: { from: vi.fn(() => ({ upload: mocks.upload, createSignedUploadUrl: mocks.createSignedUploadUrl })) },
      from: vi.fn(() => ({ insert: mocks.insert })),
    });
  });

  it.each(["artist-assets", "album-covers", "track-assets"] as const)("uploads %s through the validated service-role route", async (bucket) => {
    const form = new FormData();
    form.set("bucket", bucket);
    form.set("path", "artist-1/asset.jpg");
    form.set("file", new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "asset.jpg", { type: "image/jpeg" }));

    const response = await POST(new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
      method: "POST", headers: { origin: "https://themuze.kr" }, body: form,
    }));

    expect(response.status).toBe(200);
    expect(mocks.upload).toHaveBeenCalledWith("artist-1/asset.png", expect.any(File), expect.objectContaining({ contentType: "image/png" }));
  });

  it("returns a direct upload token for a large MP3 without proxying its body", async () => {
    const form = new FormData();
    form.set("bucket", "track-assets");
    form.set("path", "artist-1/album-1/track-1/audio.mp3");
    form.set("file", new File([new Uint8Array([0x49, 0x44, 0x33, 0x04])], "audio.mp3", { type: "audio/mpeg" }));
    form.set("direct", "true");
    form.set("size", String(20 * 1024 * 1024));

    const response = await POST(new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
      method: "POST", headers: { origin: "https://themuze.kr" }, body: form,
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ token: "signed-token", asset: { path: "artist-1/album-1/track-1/audio.mp3" } });
    expect(mocks.createSignedUploadUrl).toHaveBeenCalledWith("artist-1/album-1/track-1/audio.mp3", { upsert: false });
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});
