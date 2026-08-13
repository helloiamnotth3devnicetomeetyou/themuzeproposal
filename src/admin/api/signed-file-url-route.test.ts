// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  isAdmin: vi.fn(),
  rpc: vi.fn(),
  createServerClient: vi.fn(),
  createServiceClient: vi.fn(),
  createSignedDownloadUrl: vi.fn(),
}));

vi.mock("@/core/auth/admin-auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/core/storage/r2", () => ({
  createSignedDownloadUrl: mocks.createSignedDownloadUrl,
}));
vi.mock("@/core/supabase/server", () => ({
  createSupabaseServerClient: mocks.createServerClient,
}));
vi.mock("@/core/uploads/service-storage", () => ({
  createServiceRoleClient: mocks.createServiceClient,
  isSafeStoragePath: () => true,
}));

import { POST } from "./signed-file-url-route";

describe("POST /api/files/signed-url", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    mocks.isAdmin.mockResolvedValue(true);
    mocks.createServerClient.mockResolvedValue({
      auth: { getUser: mocks.getUser },
    });
    mocks.createServiceClient.mockReturnValue({ rpc: mocks.rpc });
    mocks.createSignedDownloadUrl.mockResolvedValue(
      "https://signed.example/file",
    );
  });

  it("checks audition attachments in the database before signing", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });

    const response = await POST(
      new NextRequest("https://themuze.kr/api/files/signed-url", {
        method: "POST",
        headers: {
          origin: "https://themuze.kr",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bucket: "audition-attachments",
          path: "submission/file.pdf",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "audition_submission_has_attachment",
      { p_path: "submission/file.pdf" },
    );
  });
});
