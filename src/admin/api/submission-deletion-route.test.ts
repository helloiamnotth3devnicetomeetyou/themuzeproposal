// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  isAdmin: vi.fn(),
  createSessionClient: vi.fn(),
  createServiceClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/core/auth/admin-auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/core/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSessionClient,
}));
vi.mock("@/core/supabase/service", () => ({
  createServiceRoleClient: mocks.createServiceClient,
}));

import { POST } from "./submission-deletion-route";

const actorId = "11111111-1111-4111-8111-111111111111";
const contactId = "22222222-2222-4222-8222-222222222222";
const protectId = "33333333-3333-4333-8333-333333333333";

function request(body: unknown, origin = "https://themuze.kr") {
  return new NextRequest("https://themuze.kr/api/admin/submissions", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/admin/submissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: actorId, email: "admin@themuze.kr" } },
      error: null,
    });
    mocks.isAdmin.mockResolvedValue(true);
    mocks.createSessionClient.mockResolvedValue({
      auth: { getUser: mocks.getUser },
    });
    mocks.createServiceClient.mockReturnValue({ rpc: mocks.rpc });
    mocks.rpc.mockResolvedValue({ data: [], error: null });
  });

  it("rejects cross-origin requests before reading the session", async () => {
    const response = await POST(
      request(
        { candidates: [{ kind: "contact_inquiry", id: contactId }] },
        "https://attacker.example",
      ),
    );
    if (!response) throw new Error("missing response");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_REQUEST" });
    expect(mocks.createSessionClient).not.toHaveBeenCalled();
  });

  it("requires an authenticated administrator and UUID candidates", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const unauthenticated = await POST(
      request({ candidates: [{ kind: "contact_inquiry", id: contactId }] }),
    );
    if (!unauthenticated) throw new Error("missing response");
    expect(unauthenticated.status).toBe(401);

    mocks.getUser.mockResolvedValue({
      data: { user: { id: actorId } },
      error: null,
    });
    mocks.isAdmin.mockResolvedValueOnce(false);
    const forbidden = await POST(
      request({ candidates: [{ kind: "contact_inquiry", id: contactId }] }),
    );
    if (!forbidden) throw new Error("missing response");
    expect(forbidden.status).toBe(403);

    const invalid = await POST(
      request({ candidates: [{ kind: "contact_inquiry", id: "not-a-uuid" }] }),
    );
    if (!invalid) throw new Error("missing response");
    expect(invalid.status).toBe(400);
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
  });

  it("moves both kinds to the trash without touching stored files", async () => {
    mocks.rpc.mockImplementation(
      async (_name: string, args: Record<string, unknown>) => ({
        data: args.p_ids,
        error: null,
      }),
    );

    const response = await POST(
      request({
        items: [
          { kind: "contact_inquiry", id: contactId },
          { kind: "protect_report", id: protectId },
        ],
      }),
    );
    if (!response) throw new Error("missing response");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      action: "trash",
      deleted_count: 2,
      failed: [],
    });
    expect(mocks.rpc).toHaveBeenCalledWith("set_submission_trash", {
      p_kind: "contact_inquiry",
      p_ids: [contactId],
      p_actor_id: actorId,
      p_trashed: true,
    });
    expect(mocks.rpc).toHaveBeenCalledWith(
      "set_submission_trash",
      expect.objectContaining({ p_kind: "protect_report", p_trashed: true }),
    );
  });

  it("restores trashed submissions when asked", async () => {
    mocks.rpc.mockResolvedValue({ data: [contactId], error: null });

    const response = await POST(
      request({
        action: "restore",
        items: [{ kind: "contact_inquiry", id: contactId }],
      }),
    );
    if (!response) throw new Error("missing response");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      action: "restore",
      deleted_count: 1,
    });
    expect(mocks.rpc).toHaveBeenCalledWith(
      "set_submission_trash",
      expect.objectContaining({ p_trashed: false }),
    );
  });

  it("reports rows the database refused", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "administrator access required" },
    });

    const response = await POST(
      request({ items: [{ kind: "contact_inquiry", id: contactId }] }),
    );
    if (!response) throw new Error("missing response");

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      failed: [{ kind: "contact_inquiry", id: contactId, code: "FORBIDDEN" }],
    });
  });
});
