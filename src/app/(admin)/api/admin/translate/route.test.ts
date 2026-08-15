// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSessionClient: vi.fn(),
  getUser: vi.fn(),
  isAdmin: vi.fn(),
  translate: vi.fn(),
}));

vi.mock("@/core/auth/admin-auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/core/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSessionClient,
}));
vi.mock("@/core/ai/translate-admin-content", () => ({
  translateAdminContent: mocks.translate,
}));

import { POST } from "./route";

const body = {
  documentKind: "artist",
  fields: [
    {
      key: "description",
      label: "아티스트 소개",
      format: "richtext",
      source: "<p>한국어 소개</p>",
      targetLocales: ["en", "ja"],
    },
  ],
};

describe("POST /api/admin/translate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
      error: null,
    });
    mocks.createSessionClient.mockResolvedValue({
      auth: { getUser: mocks.getUser },
    });
    mocks.isAdmin.mockResolvedValue(true);
    mocks.translate.mockResolvedValue([
      { key: "description", en: "<p>English</p>", ja: "<p>日本語</p>" },
    ]);
  });

  it("rejects cross-origin requests before authentication", async () => {
    const result = await POST(
      new Request("https://themuze.kr/api/admin/translate", {
        method: "POST",
        headers: { origin: "https://attacker.example" },
        body: JSON.stringify(body),
      }),
    );
    expect(result.status).toBe(403);
    expect(mocks.createSessionClient).not.toHaveBeenCalled();
  });

  it("returns draft translations for authenticated administrators", async () => {
    const result = await POST(
      new Request("https://themuze.kr/api/admin/translate", {
        method: "POST",
        headers: {
          origin: "https://themuze.kr",
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      }),
    );
    expect(result.status).toBe(200);
    await expect(result.json()).resolves.toEqual({
      translations: [
        { key: "description", en: "<p>English</p>", ja: "<p>日本語</p>" },
      ],
    });
    expect(mocks.translate).toHaveBeenCalledWith("artist", body.fields);
  });

  it("rejects duplicate keys and excessive source content", async () => {
    const invalid = {
      ...body,
      fields: [
        ...body.fields,
        { ...body.fields[0], source: "가".repeat(12_000) },
      ],
    };
    const result = await POST(
      new Request("https://themuze.kr/api/admin/translate", {
        method: "POST",
        headers: {
          origin: "https://themuze.kr",
          "content-type": "application/json",
        },
        body: JSON.stringify(invalid),
      }),
    );
    expect(result.status).toBe(400);
    expect(mocks.createSessionClient).not.toHaveBeenCalled();
  });
});
