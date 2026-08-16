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

vi.mock("@/core/auth/admin-auth", () => ({
  isAdmin: mocks.isAdmin,
}));
vi.mock("@/core/storage/r2", () => ({
  deleteObjects: mocks.deleteObjects,
}));
vi.mock("@/core/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSessionClient,
}));
vi.mock("@/core/supabase/service", () => ({
  createServiceRoleClient: mocks.createServiceClient,
}));

import { GET, POST } from "./retention-route";

const actorId = "11111111-1111-4111-8111-111111111111";
const contactId = "22222222-2222-4222-8222-222222222222";
const protectId = "33333333-3333-4333-8333-333333333333";

function request(
  method: "GET" | "POST",
  body?: unknown,
  origin = "https://themuze.kr",
) {
  const headers: HeadersInit = { origin };
  if (body !== undefined) headers["content-type"] = "application/json";
  return new NextRequest("https://themuze.kr/api/admin/retention", {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function retentionCandidate(id: string, kind: "contact_inquiry" | "protect_report") {
  return {
    kind,
    id,
    created_at: "2026-07-01T00:00:00.000Z",
    expires_at: "2026-07-31T00:00:00.000Z",
    attachment_count: 1,
    retryable: false,
  };
}

describe("/api/admin/retention", () => {
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
        "POST",
        { candidates: [{ kind: "contact_inquiry", id: contactId }] },
        "https://attacker.example",
      ),
    );
    if (!response) throw new Error("missing response");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      code: "INVALID_REQUEST",
    });
    expect(mocks.createSessionClient).not.toHaveBeenCalled();
  });

  it("blocks unauthenticated and non-admin requests before touching retention data", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const unauthenticated = await POST(
      request("POST", {
        candidates: [{ kind: "contact_inquiry", id: contactId }],
      }),
    );
    if (!unauthenticated) throw new Error("missing response");

    expect(unauthenticated.status).toBe(401);
    expect(mocks.isAdmin).not.toHaveBeenCalled();
    expect(mocks.createServiceClient).not.toHaveBeenCalled();

    mocks.getUser.mockResolvedValue({
      data: { user: { id: actorId } },
      error: null,
    });
    mocks.isAdmin.mockResolvedValueOnce(false);
    const editor = await POST(
      request("POST", {
        candidates: [{ kind: "contact_inquiry", id: contactId }],
      }),
    );
    if (!editor) throw new Error("missing response");

    expect(editor.status).toBe(403);
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns only safe metadata for admin retention candidates", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [
        {
          ...retentionCandidate(contactId, "contact_inquiry"),
          message: "submitted body must not be returned",
          email: "private@example.com",
          attachment_path: "private/evidence.pdf",
        },
      ],
      error: null,
    });

    const response = await GET(
      new NextRequest(
        "https://themuze.kr/api/admin/retention?limit=10",
        { headers: { origin: "https://themuze.kr" } },
      ),
    );
    if (!response) throw new Error("missing response");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      policy: { days: 30, basis: "created_at" },
      candidates: [retentionCandidate(contactId, "contact_inquiry")],
    });
    expect(mocks.rpc).toHaveBeenCalledWith("get_retention_candidates", {
      p_limit: 10,
    });
  });

  it("deletes contact and protect objects before finalizing each database record", async () => {
    mocks.rpc.mockImplementation(async (name: string, args: Record<string, unknown>) => {
      if (name === "reserve_retention_deletion") {
        return {
          data:
            args.p_kind === "contact_inquiry"
              ? [
                  {
                    bucket: "contact-attachments",
                    path: "contact/attachment.pdf",
                  },
                ]
              : [
                  {
                    bucket: "protect-evidence",
                    path: "protect/evidence.png",
                  },
                ],
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const response = await POST(
      request("POST", {
        candidates: [
          { kind: "contact_inquiry", id: contactId },
          { kind: "protect_report", id: protectId },
        ],
      }),
    );
    if (!response) throw new Error("missing response");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      deleted: [
        { kind: "contact_inquiry", id: contactId },
        { kind: "protect_report", id: protectId },
      ],
      deleted_count: 2,
      failed: [],
      failed_count: 0,
    });
    expect(mocks.deleteObjects).toHaveBeenNthCalledWith(
      1,
      "contact-attachments",
      ["contact/attachment.pdf"],
    );
    expect(mocks.deleteObjects).toHaveBeenNthCalledWith(
      2,
      "protect-evidence",
      ["protect/evidence.png"],
    );
    expect(mocks.rpc).toHaveBeenCalledWith(
      "finalize_retention_deletion",
      expect.objectContaining({
        p_kind: "contact_inquiry",
        p_id: contactId,
        p_actor_id: actorId,
        p_objects_deleted: true,
      }),
    );
    expect(mocks.rpc).toHaveBeenCalledWith(
      "finalize_retention_deletion",
      expect.objectContaining({
        p_kind: "protect_report",
        p_id: protectId,
        p_actor_id: actorId,
        p_objects_deleted: true,
      }),
    );
  });

  it("records a retryable reservation when R2 deletion fails", async () => {
    mocks.rpc.mockImplementation(async (name: string) => {
      if (name === "reserve_retention_deletion") {
        return {
          data: [
            { bucket: "contact-attachments", path: "contact/attachment.pdf" },
          ],
          error: null,
        };
      }
      return { data: null, error: null };
    });
    mocks.deleteObjects.mockResolvedValueOnce({ error: true });

    const response = await POST(
      request("POST", {
        candidates: [{ kind: "contact_inquiry", id: contactId }],
      }),
    );
    if (!response) throw new Error("missing response");

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      deleted: [],
      failed: [{ kind: "contact_inquiry", id: contactId, code: "DELETE_FAILED" }],
      failed_count: 1,
    });
    expect(mocks.deleteObjects).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenCalledWith(
      "retry_retention_deletion",
      expect.objectContaining({
        p_kind: "contact_inquiry",
        p_id: contactId,
        p_actor_id: actorId,
        p_objects_deleted: false,
      }),
    );
    expect(mocks.rpc).not.toHaveBeenCalledWith(
      "finalize_retention_deletion",
      expect.anything(),
    );
  });

  it("preserves an objects-deleted retry state when database finalization fails", async () => {
    mocks.rpc.mockImplementation(async (name: string) => {
      if (name === "reserve_retention_deletion") {
        return {
          data: [
            { bucket: "protect-evidence", path: "protect/evidence.png" },
          ],
          error: null,
        };
      }
      if (name === "finalize_retention_deletion") {
        return { data: null, error: new Error("database unavailable") };
      }
      return { data: null, error: null };
    });

    const response = await POST(
      request("POST", {
        candidates: [{ kind: "protect_report", id: protectId }],
      }),
    );
    if (!response) throw new Error("missing response");

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      deleted: [],
      failed: [{ kind: "protect_report", id: protectId, code: "RETRY_REQUIRED" }],
      failed_count: 1,
    });
    expect(mocks.deleteObjects).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenCalledWith(
      "retry_retention_deletion",
      expect.objectContaining({
        p_kind: "protect_report",
        p_id: protectId,
        p_actor_id: actorId,
        p_objects_deleted: true,
      }),
    );
  });
});
