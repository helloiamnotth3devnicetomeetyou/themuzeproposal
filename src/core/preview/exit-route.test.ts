// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ disable: vi.fn(), draftMode: vi.fn() }));

vi.mock("next/headers", () => ({ draftMode: mocks.draftMode }));

import { POST } from "./exit-route";

describe("POST /api/admin/preview/exit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("only clears preview mode for same-origin requests", async () => {
    mocks.draftMode.mockResolvedValue({ disable: mocks.disable });

    const response = await POST(new NextRequest("https://themuze.kr/api/admin/preview/exit", {
      method: "POST",
      headers: { origin: "https://themuze.kr" },
    }));

    expect(response.status).toBe(200);
    expect(mocks.disable).toHaveBeenCalledOnce();
  });

  it("rejects cross-origin requests before touching preview mode", async () => {
    const response = await POST(new NextRequest("https://themuze.kr/api/admin/preview/exit", {
      method: "POST",
      headers: { origin: "https://attacker.example" },
    }));

    expect(response.status).toBe(400);
    expect(mocks.draftMode).not.toHaveBeenCalled();
  });
});
