// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  isAdmin: vi.fn(),
  createSessionClient: vi.fn(),
  createServiceClient: vi.fn(),
  rpc: vi.fn(),
  deleteObjects: vi.fn(),
}));

vi.mock("@/core/auth/admin-auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/core/storage/r2", () => ({ deleteObjects: mocks.deleteObjects }));
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
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    mocks.deleteObjects.mockResolvedValue({ error: false });
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

  it("deletes contact and protect attachments before finalizing each row", async () => {
    mocks.rpc.mockImplementation(
      async (name: string, args: Record<string, unknown>) => {
        if (name === "reserve_submission_deletion") {
          return {
            data:
              args.p_kind === "contact_inquiry"
                ? [{ bucket: "contact-attachments", path: "contact/file.pdf" }]
                : [{ bucket: "protect-evidence", path: "protect/file.png" }],
            error: null,
          };
        }
        return { data: null, error: null };
      },
    );

    const response = await POST(
      request({
        candidates: [
          { kind: "contact_inquiry", id: contactId },
          { kind: "protect_report", id: protectId },
        ],
      }),
    );
    if (!response) throw new Error("missing response");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      deleted_count: 2,
      failed: [],
    });
    expect(mocks.deleteObjects).toHaveBeenNthCalledWith(
      1,
      "contact-attachments",
      ["contact/file.pdf"],
    );
    expect(mocks.deleteObjects).toHaveBeenNthCalledWith(2, "protect-evidence", [
      "protect/file.png",
    ]);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "finalize_retention_deletion",
      expect.objectContaining({
        p_actor_id: actorId,
        p_objects_deleted: true,
      }),
    );
  });

  it("keeps a retryable job when R2 or database deletion fails", async () => {
    mocks.rpc.mockImplementation(async (name: string) => {
      if (name === "reserve_submission_deletion") {
        return {
          data: [{ bucket: "contact-attachments", path: "contact/file.pdf" }],
          error: null,
        };
      }
      if (name === "finalize_retention_deletion")
        return { data: null, error: new Error("database unavailable") };
      return { data: null, error: null };
    });
    mocks.deleteObjects.mockResolvedValueOnce({ error: true });

    const r2Response = await POST(
      request({ candidates: [{ kind: "contact_inquiry", id: contactId }] }),
    );
    if (!r2Response) throw new Error("missing response");
    expect(r2Response.status).toBe(503);
    await expect(r2Response.json()).resolves.toMatchObject({
      failed: [
        { kind: "contact_inquiry", id: contactId, code: "DELETE_FAILED" },
      ],
    });
    expect(mocks.rpc).toHaveBeenCalledWith(
      "retry_retention_deletion",
      expect.objectContaining({ p_objects_deleted: false }),
    );

    mocks.deleteObjects.mockResolvedValue({ error: false });
    const databaseResponse = await POST(
      request({ candidates: [{ kind: "contact_inquiry", id: contactId }] }),
    );
    if (!databaseResponse) throw new Error("missing response");
    expect(databaseResponse.status).toBe(503);
    await expect(databaseResponse.json()).resolves.toMatchObject({
      failed: [
        { kind: "contact_inquiry", id: contactId, code: "RETRY_REQUIRED" },
      ],
    });
    expect(mocks.rpc).toHaveBeenCalledWith(
      "retry_retention_deletion",
      expect.objectContaining({ p_objects_deleted: true }),
    );
  });
});
