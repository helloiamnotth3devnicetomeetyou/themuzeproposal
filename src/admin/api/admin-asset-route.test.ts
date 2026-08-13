// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLZ9wAAAABJRU5ErkJggg==",
  "base64",
);

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  isAdmin: vi.fn(),
  createSessionClient: vi.fn(),
  createServiceClient: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  select: vi.fn(),
  rpc: vi.fn(),
  insert: vi.fn(),
  consumeUploadAttempt: vi.fn(),
  createSignedUploadUrl: vi.fn(),
  getObjectForValidation: vi.fn(),
}));

vi.mock("@/core/auth/admin-auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/core/storage/public-url", () => ({
  getPublicAssetUrl: (bucket: string, path: string) =>
    `https://storage.example/${bucket}/${path}`,
}));
vi.mock("@/core/storage/r2", () => ({
  uploadObject: (options: {
    bucket: string;
    path: string;
    body: unknown;
    contentType: string;
    cacheControl?: string;
  }) =>
    mocks.upload(options.path, options.body, {
      contentType: options.contentType,
      cacheControl: options.cacheControl,
      upsert: false,
    }),
  deleteObjects: (_bucket: string, paths: string[]) => mocks.remove(paths),
  createSignedUploadUrl: (...args: unknown[]) =>
    mocks.createSignedUploadUrl(...args),
  getObjectForValidation: (...args: unknown[]) =>
    mocks.getObjectForValidation(...args),
}));
vi.mock("@/core/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSessionClient,
}));
vi.mock("@/core/http/submission-rate-limit", () => ({
  consumeAdminUploadAttemptRateLimit: mocks.consumeUploadAttempt,
}));
vi.mock("@/core/uploads/service-storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/core/uploads/service-storage")>()),
  createServiceRoleClient: mocks.createServiceClient,
}));
import { DELETE, POST } from "./admin-asset-route";

describe("POST /api/uploads/admin-asset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
      error: null,
    });
    mocks.isAdmin.mockResolvedValue(true);
    mocks.consumeUploadAttempt.mockResolvedValue({
      error: false,
      allowed: true,
    });
    mocks.createSessionClient.mockResolvedValue({
      auth: { getUser: mocks.getUser },
    });
    mocks.upload.mockResolvedValue({ error: false });
    mocks.remove.mockResolvedValue({ error: false });
    mocks.select.mockResolvedValue({ data: [], error: null });
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn(() => ({ insert: mocks.insert, select: mocks.select })),
      rpc: mocks.rpc,
    });
    mocks.createSignedUploadUrl.mockResolvedValue("https://r2.example/signed");
  });

  it.each(["artist-assets", "album-covers", "track-assets"] as const)(
    "uploads %s through the validated service-role route",
    async (bucket) => {
      const form = new FormData();
      form.set("bucket", bucket);
      form.set("path", "artist-1/asset.jpg");
      form.set("file", new File([PNG], "asset.jpg", { type: "image/jpeg" }));

      const response = await POST(
        new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
          method: "POST",
          headers: { origin: "https://themuze.kr" },
          body: form,
        }),
      );

      expect(response.status).toBe(200);
      expect(mocks.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^[0-9a-f-]{36}\.png$/),
        expect.any(File),
        expect.objectContaining({ contentType: "image/png" }),
      );
    },
  );

  it("uses a server-generated immutable upload path", async () => {
    const form = new FormData();
    form.set("bucket", "album-covers");
    form.set("path", "artist-1/asset.jpg");
    form.set("upsert", "true");
    form.set("file", new File([PNG], "asset.jpg"));

    const response = await POST(
      new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
        method: "POST",
        headers: { origin: "https://themuze.kr" },
        body: form,
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^[0-9a-f-]{36}\.png$/),
      expect.any(File),
      expect.objectContaining({ upsert: false }),
    );
  });

  it("limits an admin before parsing or writing an upload", async () => {
    mocks.consumeUploadAttempt.mockResolvedValueOnce({
      error: false,
      allowed: false,
    });
    const response = await POST(
      new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
        method: "POST",
        headers: { origin: "https://themuze.kr" },
        body: new FormData(),
      }),
    );

    expect(response.status).toBe(429);
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
  });

  it("deletes only a newly created immutable object when its audit event cannot be persisted", async () => {
    mocks.insert.mockResolvedValueOnce({
      error: new Error("audit unavailable"),
    });
    const form = new FormData();
    form.set("bucket", "album-covers");
    form.set("path", "artist-1/asset.jpg");
    form.set("file", new File([PNG], "asset.jpg"));

    const response = await POST(
      new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
        method: "POST",
        headers: { origin: "https://themuze.kr" },
        body: form,
      }),
    );

    expect(response.status).toBe(503);
    expect(mocks.remove).toHaveBeenCalledWith([
      expect.stringMatching(/^[0-9a-f-]{36}\.png$/),
    ]);
  });

  it("derives immutable business asset paths on the server", async () => {
    const form = new FormData();
    form.set("bucket", "business-assets");
    form.set("path", "profile.pdf");
    form.set("file", new File(["%PDF-1.7\ncontent"], "profile.pdf"));

    const response = await POST(
      new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
        method: "POST",
        headers: { origin: "https://themuze.kr" },
        body: form,
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^profile\/[0-9a-f-]+\.pdf$/),
      expect.any(File),
      expect.objectContaining({ upsert: false }),
    );
  });

  it("keeps avatar assets under the artist-scoped database path", async () => {
    const artistId = "123e4567-e89b-12d3-a456-426614174000";
    const form = new FormData();
    form.set("bucket", "artist-assets");
    form.set(
      "path",
      `${artistId}/avatars/123e4567-e89b-12d3-a456-426614174001.png`,
    );
    form.set("file", new File([PNG], "avatar.png", { type: "image/png" }));

    const response = await POST(
      new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
        method: "POST",
        headers: { origin: "https://themuze.kr" },
        body: form,
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(
        new RegExp(`^${artistId}/avatars/[0-9a-f-]{36}\\.png$`),
      ),
      expect.any(File),
      expect.objectContaining({ contentType: "image/png" }),
    );
  });

  it("uploads and validates the actual MP3 object through the service route", async () => {
    const form = new FormData();
    form.set("bucket", "track-assets");
    form.set("path", "artist-1/album-1/track-1/audio.mp3");
    form.set(
      "file",
      new File([new Uint8Array([0x49, 0x44, 0x33, 0x04])], "audio.mp3", {
        type: "audio/mpeg",
      }),
    );

    const response = await POST(
      new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
        method: "POST",
        headers: { origin: "https://themuze.kr" },
        body: form,
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      asset: { path: expect.stringMatching(/^[0-9a-f-]{36}\.mp3$/) },
    });
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^[0-9a-f-]{36}\.mp3$/),
      expect.any(File),
      expect.objectContaining({ contentType: "audio/mpeg" }),
    );
  });

  it("accepts MP4 clips only through the hero-video bucket", async () => {
    const form = new FormData();
    form.set("bucket", "hero-videos");
    form.set("path", "clips/slide-1/clip.mp4");
    form.set(
      "file",
      new File(
        [
          new Uint8Array([
            0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
          ]),
        ],
        "clip.mp4",
        { type: "video/mp4" },
      ),
    );

    const response = await POST(
      new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
        method: "POST",
        headers: { origin: "https://themuze.kr" },
        body: form,
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^[0-9a-f-]{36}\.mp4$/),
      expect.any(File),
      expect.objectContaining({ contentType: "video/mp4" }),
    );
  });

  it("uploads large hero videos directly to a server-generated R2 path and validates them before publishing", async () => {
    const prepared = await POST(
      new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
        method: "POST",
        headers: {
          origin: "https://themuze.kr",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "prepareHeroVideo",
          fileSize: 10 * 1024 * 1024,
          contentType: "video/mp4",
          path: "caller-controlled.mp4",
        }),
      }),
    );
    const preparation = await prepared.json();

    expect(prepared.status).toBe(200);
    expect(preparation.upload.path).toMatch(/^pending\/[0-9a-f-]{36}\.mp4$/);
    expect(mocks.createSignedUploadUrl).toHaveBeenCalledWith(
      "hero-videos",
      preparation.upload.path,
      "video/mp4",
      10 * 1024 * 1024,
    );

    mocks.getObjectForValidation.mockResolvedValue({
      body: new Uint8Array([
        0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
      ]),
      contentType: "video/mp4",
    });
    const completed = await POST(
      new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
        method: "POST",
        headers: {
          origin: "https://themuze.kr",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "completeHeroVideo",
          path: preparation.upload.path,
        }),
      }),
    );

    expect(completed.status).toBe(200);
    const finalPath = preparation.upload.path.replace("pending/", "clips/");
    expect(mocks.getObjectForValidation).toHaveBeenCalledWith(
      "hero-videos",
      preparation.upload.path,
      20 * 1024 * 1024,
    );
    expect(mocks.upload).toHaveBeenCalledWith(
      finalPath,
      expect.any(Uint8Array),
      expect.objectContaining({ contentType: "video/mp4" }),
    );
    expect(mocks.remove).toHaveBeenCalledWith([preparation.upload.path]);
    expect(await completed.json()).toMatchObject({
      asset: { bucket: "hero-videos", path: finalPath },
    });
  });

  it("rejects deletion for unknown buckets", async () => {
    const response = await DELETE(
      new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
        method: "DELETE",
        headers: {
          origin: "https://themuze.kr",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bucket: "unknown-bucket",
          paths: ["artist-1/asset.png"],
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("deletes a server-generated pending hero upload", async () => {
    const path = "pending/123e4567-e89b-12d3-a456-426614174000.mp4";
    const response = await DELETE(
      new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
        method: "DELETE",
        headers: {
          origin: "https://themuze.kr",
          "content-type": "application/json",
        },
        body: JSON.stringify({ bucket: "hero-videos", paths: [path] }),
      }),
    );

    expect(response.status).toBe(204);
    expect(mocks.remove).toHaveBeenCalledWith([path]);
  });

  it("rejects an invalid audition path before reserving it", async () => {
    const response = await DELETE(
      new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
        method: "DELETE",
        headers: {
          origin: "https://themuze.kr",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bucket: "audition-attachments",
          paths: ["not-a-submission.pdf"],
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("refuses to delete a public asset still referenced by content", async () => {
    mocks.select.mockResolvedValueOnce({
      data: [{ cover_url: "https://storage.example/album-covers/live.png" }],
      error: null,
    });

    const response = await DELETE(
      new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
        method: "DELETE",
        headers: {
          origin: "https://themuze.kr",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bucket: "album-covers",
          paths: ["live.png"],
        }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("refuses to delete an audition attachment still referenced by a submission", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: null });
    mocks.rpc.mockResolvedValueOnce({ data: true, error: null });
    const path =
      "123e4567-e89b-12d3-a456-426614174000/123e4567-e89b-12d3-a456-426614174001/123e4567-e89b-12d3-a456-426614174002/123e4567-e89b-12d3-a456-426614174003.pdf";

    const response = await DELETE(
      new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
        method: "DELETE",
        headers: {
          origin: "https://themuze.kr",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bucket: "audition-attachments",
          paths: [path],
        }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "audition_submission_has_attachment",
      { p_path: path },
    );
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("reserves an unreferenced asset before deleting and finalizes the reservation", async () => {
    const path = "pending/123e4567-e89b-12d3-a456-426614174000.mp4";
    const response = await DELETE(
      new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
        method: "DELETE",
        headers: {
          origin: "https://themuze.kr",
          "content-type": "application/json",
        },
        body: JSON.stringify({ bucket: "hero-videos", paths: [path] }),
      }),
    );

    expect(response.status).toBe(204);
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, "reserve_r2_asset_deletions", {
      p_bucket: "hero-videos",
      p_paths: [path],
      p_actor_id: "admin-1",
    });
    expect(mocks.rpc).toHaveBeenNthCalledWith(
      2,
      "complete_r2_asset_deletions",
      {
        p_bucket: "hero-videos",
        p_paths: [path],
        p_actor_id: "admin-1",
      },
    );
  });

  it("rate-limits deletion attempts before touching storage", async () => {
    mocks.consumeUploadAttempt.mockResolvedValueOnce({
      error: false,
      allowed: false,
    });

    const response = await DELETE(
      new NextRequest("https://themuze.kr/api/uploads/admin-asset", {
        method: "DELETE",
        headers: {
          origin: "https://themuze.kr",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bucket: "hero-videos",
          paths: ["pending/123e4567-e89b-12d3-a456-426614174000.mp4"],
        }),
      }),
    );

    expect(response.status).toBe(429);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
