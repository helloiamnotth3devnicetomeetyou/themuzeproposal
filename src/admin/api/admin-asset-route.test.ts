// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  isAdmin: vi.fn(),
  createSessionClient: vi.fn(),
  createServiceClient: vi.fn(),
  upload: vi.fn(),
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
    mocks.createServiceClient.mockReturnValue({
      storage: { from: vi.fn(() => ({ upload: mocks.upload })) },
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
});
