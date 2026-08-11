// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  isAdmin: vi.fn(),
  getUser: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));
vi.mock("@/core/auth/admin-auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/core/supabase/server", () => ({ createSupabaseServerClient: mocks.createClient }));

import { POST } from "./route";

function request(body: unknown, origin = "https://themuze.kr") {
  return new NextRequest("https://themuze.kr/api/admin/revalidate", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/revalidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    mocks.isAdmin.mockResolvedValue(true);
    mocks.createClient.mockResolvedValue({ auth: { getUser: mocks.getUser } });
  });

  it("rejects cross-origin and non-admin requests", async () => {
    expect((await POST(request({ tag: "public-notices" }, "https://attacker.example"))).status).toBe(400);
    expect(mocks.createClient).not.toHaveBeenCalled();

    mocks.isAdmin.mockResolvedValueOnce(false);
    expect((await POST(request({ tag: "public-notices" }))).status).toBe(403);
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("only revalidates the explicit tag allowlist", async () => {
    expect((await POST(request({ tag: "everything" }))).status).toBe(400);
    expect(mocks.revalidateTag).not.toHaveBeenCalled();

    const response = await POST(request({ tag: "public-home-slides" }));
    expect(response.status).toBe(200);
    expect(mocks.revalidateTag).toHaveBeenCalledWith("public-home-slides", "max");
  });
});
