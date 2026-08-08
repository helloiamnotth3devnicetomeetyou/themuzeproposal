// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  isSuperAdmin: vi.fn(),
  createSessionClient: vi.fn(),
  createServiceClient: vi.fn(),
  serviceFrom: vi.fn(),
  targetResult: vi.fn(),
  countResult: vi.fn(),
  update: vi.fn(),
  updateEq: vi.fn(),
}));

vi.mock("@/core/auth/admin-auth", () => ({ isSuperAdmin: mocks.isSuperAdmin }));
vi.mock("@/core/supabase/server", () => ({ createSupabaseServerClient: mocks.createSessionClient }));
vi.mock("@/core/supabase/service", () => ({ createServiceRoleClient: mocks.createServiceClient }));

import { DELETE, PATCH } from "./admin-accounts-route";

const actorId = "11111111-1111-4111-8111-111111111111";
const targetId = "22222222-2222-4222-8222-222222222222";

function request(method: "PATCH" | "DELETE", body: unknown, origin = "https://themuze.kr") {
  return new NextRequest("https://themuze.kr/api/admin/accounts", {
    method,
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}

describe("/api/admin/accounts role safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: actorId } }, error: null });
    mocks.isSuperAdmin.mockResolvedValue(true);
    mocks.updateEq.mockResolvedValue({ error: null });
    mocks.update.mockReturnValue({ eq: mocks.updateEq });
    mocks.createSessionClient.mockResolvedValue({
      auth: { getUser: mocks.getUser },
      from: vi.fn(() => ({ update: mocks.update })),
    });
    mocks.targetResult.mockResolvedValue({ data: { role: "editor" }, error: null });
    mocks.countResult.mockReturnValue({ count: 2, error: null });
    mocks.serviceFrom.mockReturnValue({
      select: vi.fn((_columns: string, options?: { head?: boolean }) => ({
        eq: vi.fn(() => options?.head
          ? mocks.countResult()
          : { maybeSingle: mocks.targetResult }),
      })),
    });
    mocks.createServiceClient.mockReturnValue({ from: mocks.serviceFrom });
  });

  it("rejects cross-origin mutations before checking authentication", async () => {
    const response = (await PATCH(request("PATCH", { id: targetId, role: "editor" }, "https://attacker.example")))!;

    expect(response.status).toBe(400);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("prevents a super admin from changing their own role", async () => {
    const response = (await PATCH(request("PATCH", { id: actorId, role: "editor" })))!;

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ code: "CANNOT_CHANGE_OWN_ROLE" });
    expect(mocks.serviceFrom).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects malformed account identifiers and roles before using the service client", async () => {
    expect((await PATCH(request("PATCH", { id: "not-a-uuid", role: "editor" })))!.status).toBe(400);
    expect((await PATCH(request("PATCH", { id: targetId, role: "owner" })))!.status).toBe(400);
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
  });

  it("preserves the last super admin", async () => {
    mocks.targetResult.mockResolvedValueOnce({ data: { role: "super_admin" }, error: null });
    mocks.countResult.mockReturnValueOnce({ count: 1, error: null });

    const response = (await DELETE(request("DELETE", { id: targetId })))!;

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ code: "LAST_SUPER_ADMIN" });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("updates another administrator when the safety rules pass", async () => {
    const response = (await PATCH(request("PATCH", { id: targetId, role: "super_admin" })))!;

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.update).toHaveBeenCalledWith({ role: "super_admin" });
    expect(mocks.updateEq).toHaveBeenCalledWith("id", targetId);
  });
});
