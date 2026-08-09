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
}));

vi.mock("@/core/auth/admin-auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/core/config/public-env", () => ({ getPublicSupabaseConfig: () => ({ storageUrl: "https://storage.example" }) }));
vi.mock("@/core/supabase/server", () => ({ createSupabaseServerClient: mocks.createSessionClient }));
vi.mock("@/core/uploads/service-storage", () => ({ createServiceRoleClient: mocks.createServiceClient }));

import { POST } from "./artist-logo-route";

describe("POST /api/uploads/artist-logo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-1", email: "admin@example.com" } }, error: null });
    mocks.isAdmin.mockResolvedValue(true);
    mocks.createSessionClient.mockResolvedValue({ auth: { getUser: mocks.getUser } });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.remove.mockResolvedValue({ error: null });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.createServiceClient.mockReturnValue({
      storage: { from: vi.fn(() => ({ upload: mocks.upload, remove: mocks.remove })) },
      from: vi.fn(() => ({ insert: mocks.insert })),
    });
  });

  it("rejects an oversized chunked body by bytes read", async () => {
    const response = await POST(new NextRequest("https://themuze.kr/api/uploads/artist-logo", {
      method: "POST",
      headers: { origin: "https://themuze.kr", "content-type": "multipart/form-data; boundary=x" },
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(10 * 1024 * 1024 + 64 * 1024 + 1));
          controller.close();
        },
      }),
      duplex: "half",
    }));

    expect(response.status).toBe(413);
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
  });

  it("removes the uploaded logo when audit persistence fails", async () => {
    mocks.insert.mockResolvedValueOnce({ error: new Error("audit unavailable") });
    const form = new FormData();
    form.set("artistKey", "artist-1");
    form.set("entityKey", "logo");
    form.set("file", new File(["<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1 1\"><path d=\"M0 0h1v1z\"/></svg>"], "logo.svg", { type: "image/svg+xml" }));

    const response = await POST(new NextRequest("https://themuze.kr/api/uploads/artist-logo", {
      method: "POST", headers: { origin: "https://themuze.kr" }, body: form,
    }));

    expect(response.status).toBe(503);
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ actor_id: "admin-1", table_name: "storage.objects" }));
    expect(mocks.remove).toHaveBeenCalledWith([expect.stringMatching(/^artist-1\/artist-logo-sanitized\/logo\/.+\.svg$/)]);
  });
});
