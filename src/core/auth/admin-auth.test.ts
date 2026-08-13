// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { getAdminRole, isAdmin, isSuperAdmin } from "./admin-auth";

function client(result: { data: { role: unknown } | null; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  return { client: { from: vi.fn(() => ({ select })) }, select, eq };
}

describe("admin roles", () => {
  it.each([
    ["super_admin", "super_admin"],
    ["editor", "editor"],
    ["member", null],
    [null, null],
  ])("maps %s to %s", async (role, expected) => {
    const query = client({ data: { role }, error: null });
    await expect(getAdminRole(query.client as never, "user-1")).resolves.toBe(
      expected,
    );
    expect(query.select).toHaveBeenCalledWith("role");
    expect(query.eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("fails closed on database errors", async () => {
    const query = client({
      data: { role: "super_admin" },
      error: new Error("database unavailable"),
    });
    await expect(isAdmin(query.client as never, "user-1")).resolves.toBe(false);
  });

  it("distinguishes super admins from editors", async () => {
    const query = client({ data: { role: "editor" }, error: null });
    await expect(isSuperAdmin(query.client as never, "user-1")).resolves.toBe(
      false,
    );
  });
});
