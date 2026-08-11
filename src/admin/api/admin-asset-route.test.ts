// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  isAdmin: vi.fn(),
  createSessionClient: vi.fn(),
  createServiceClient: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  insert: vi.fn(),
  consumeUploadAttempt: vi.fn(),
}));

vi.mock("@/core/auth/admin-auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/core/config/public-env", () => ({ getPublicSupabaseConfig: () => ({ storageUrl: "https://storage.example" }) }));
vi.mock("@/core/supabase/server", () => ({ createSupabaseServerClient: mocks.createSessionClient }));
vi.mock("@/core/http/submission-rate-limit", () => ({ consumeAdminUploadAttemptRateLimit: mocks.consumeUploadAttempt }));
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
    mocks.consumeUploadAttempt.mockResolvedValue({ error: false, allowed: true });
    mocks.createSessionClient.mockResolvedValue({ auth: { getUser: mocks.getUser } });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.remove.mockResolvedValue({ error: null });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.createServiceClient.mockReturnValue({
      storage: { from: vi.fn(() => ({ upload: mocks.upload, remove: mocks.remove })) },
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

  it("never enables caller-controlled overwrites", async () => {
    const form = new FormData();
    form.set("bucket", "album-covers");
    form.set("path", "artist-1/asset.jpg");
    form.set("upsert", "true");
    form.set("file", new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "asset.jpg"));

    const response = await POST(new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
      method: "POST", headers: { origin: "https://themuze.kr" }, body: form,
    }));

    expect(response.status).toBe(200);
    expect(mocks.upload).toHaveBeenCalledWith("artist-1/asset.png", expect.any(File), expect.objectContaining({ upsert: false }));
  });

  it("limits an admin before parsing or writing an upload", async () => {
    mocks.consumeUploadAttempt.mockResolvedValueOnce({ error: false, allowed: false });
    const response = await POST(new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
      method: "POST", headers: { origin: "https://themuze.kr" }, body: new FormData(),
    }));

    expect(response.status).toBe(429);
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
  });

  it("deletes only a newly created immutable object when its audit event cannot be persisted", async () => {
    mocks.insert.mockResolvedValueOnce({ error: new Error("audit unavailable") });
    const form = new FormData();
    form.set("bucket", "album-covers");
    form.set("path", "artist-1/asset.jpg");
    form.set("file", new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "asset.jpg"));

    const response = await POST(new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
      method: "POST", headers: { origin: "https://themuze.kr" }, body: form,
    }));

    expect(response.status).toBe(503);
    expect(mocks.remove).toHaveBeenCalledWith(["artist-1/asset.png"]);
  });

  it("derives immutable business asset paths on the server", async () => {
    const form = new FormData();
    form.set("bucket", "business-assets");
    form.set("path", "profile.pdf");
    form.set("file", new File(["%PDF-1.7\ncontent"], "profile.pdf"));

    const response = await POST(new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
      method: "POST", headers: { origin: "https://themuze.kr" }, body: form,
    }));

    expect(response.status).toBe(200);
    expect(mocks.upload).toHaveBeenCalledWith(expect.stringMatching(/^profile\/[0-9a-f-]+\.pdf$/), expect.any(File), expect.objectContaining({ upsert: false }));
  });

  it("uploads and validates the actual MP3 object through the service route", async () => {
    const form = new FormData();
    form.set("bucket", "track-assets");
    form.set("path", "artist-1/album-1/track-1/audio.mp3");
    form.set("file", new File([new Uint8Array([0x49, 0x44, 0x33, 0x04])], "audio.mp3", { type: "audio/mpeg" }));

    const response = await POST(new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
      method: "POST", headers: { origin: "https://themuze.kr" }, body: form,
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ asset: { path: "artist-1/album-1/track-1/audio.mp3" } });
    expect(mocks.upload).toHaveBeenCalledWith("artist-1/album-1/track-1/audio.mp3", expect.any(File), expect.objectContaining({ contentType: "audio/mpeg" }));
  });

  it("accepts converted WebM clips only through the hero-video bucket", async () => {
    const form = new FormData();
    form.set("bucket", "hero-videos");
    form.set("path", "clips/slide-1/clip.webm");
    form.set("file", new File([new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x77, 0x65, 0x62, 0x6d])], "clip.webm", { type: "video/webm" }));

    const response = await POST(new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
      method: "POST", headers: { origin: "https://themuze.kr" }, body: form,
    }));

    expect(response.status).toBe(200);
    expect(mocks.upload).toHaveBeenCalledWith("clips/slide-1/clip.webm", expect.any(File), expect.objectContaining({ contentType: "video/webm" }));
  });
});
