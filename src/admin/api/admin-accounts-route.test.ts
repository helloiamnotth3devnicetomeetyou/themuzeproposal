// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  isSuperAdmin: vi.fn(),
  createSessionClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/core/auth/admin-auth", () => ({ isSuperAdmin: mocks.isSuperAdmin }));
vi.mock("@/core/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSessionClient,
}));
vi.mock("@/core/supabase/service", () => ({
  createServiceRoleClient: vi.fn(),
}));

import { DELETE, PATCH } from "./admin-accounts-route";

const actorId = "11111111-1111-4111-8111-111111111111";
const targetId = "22222222-2222-4222-8222-222222222222";

function request(
  method: "PATCH" | "DELETE",
  body: unknown,
  origin = "https://themuze.kr",
) {
  return new NextRequest("https://themuze.kr/api/admin/accounts", {
    method,
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}

describe("/api/admin/accounts role safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: actorId } },
      error: null,
    });
    mocks.isSuperAdmin.mockResolvedValue(true);
    mocks.rpc.mockResolvedValue({ error: null });
    mocks.createSessionClient.mockResolvedValue({
      auth: { getUser: mocks.getUser },
      rpc: mocks.rpc,
    });
  });

  it("rejects cross-origin mutations before checking authentication", async () => {
    const response = (await PATCH(
      request(
        "PATCH",
        { id: targetId, role: "editor" },
        "https://attacker.example",
      ),
    ))!;
    expect(response.status).toBe(400);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("delegates role invariants to the transactional database function", async () => {
    mocks.rpc.mockResolvedValueOnce({
      error: { message: "CANNOT_CHANGE_OWN_ROLE" },
    });
    const response = (await PATCH(
      request("PATCH", { id: actorId, role: "editor" }),
    ))!;
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      code: "CANNOT_CHANGE_OWN_ROLE",
    });
  });

  it("preserves the last super admin", async () => {
    mocks.rpc.mockResolvedValueOnce({ error: { message: "LAST_SUPER_ADMIN" } });
    const response = (await DELETE(request("DELETE", { id: targetId })))!;
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      code: "LAST_SUPER_ADMIN",
    });
  });

  it("changes another administrator through one RPC", async () => {
    const response = (await PATCH(
      request("PATCH", { id: targetId, role: "super_admin" }),
    ))!;
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("set_admin_role", {
      p_target_id: targetId,
      p_role: "super_admin",
    });
  });
});
