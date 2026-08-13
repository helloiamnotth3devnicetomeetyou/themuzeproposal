import { describe, it, expect } from "vitest";
import { normalizeSiteSettings, EMPTY_SETTINGS } from "./data";

describe("normalizeSiteSettings", () => {
  it("returns cloned EMPTY_SETTINGS for null/undefined", () => {
    const result = normalizeSiteSettings(null);
    expect(result.company.name_ko).toBe("");
    expect(result.social).toEqual([]);
    expect(result).not.toBe(EMPTY_SETTINGS);
  });

  it("merges company data from rows", () => {
    const result = normalizeSiteSettings([
      { key: "company", value: { name_ko: "더뮤즈", email: "hi@themuze.kr" } },
    ]);
    expect(result.company.name_ko).toBe("더뮤즈");
    expect(result.company.email).toBe("hi@themuze.kr");
    expect(result.company.name_en).toBe("");
  });

  it("merges footer data from rows", () => {
    const result = normalizeSiteSettings([
      { key: "footer", value: { copyright: "© 2026 THE MUZE" } },
    ]);
    expect(result.footer.copyright).toBe("© 2026 THE MUZE");
  });

  it("ignores malformed non-string display settings", () => {
    const result = normalizeSiteSettings([
      {
        key: "company",
        value: { name_en: { toString: () => "unsafe" }, address_en: 42 },
      },
      { key: "footer", value: { copyright: { toString: () => "unsafe" } } },
    ]);
    expect(result.company.name_en).toBe("");
    expect(result.company.address_en).toBe("");
    expect(result.footer.copyright).toBe("");
  });

  it("normalizes social as array of objects", () => {
    const result = normalizeSiteSettings([
      {
        key: "social",
        value: [
          {
            id: "s1",
            url: "https://instagram.com/themuze",
            platform: "instagram",
            label: "Instagram",
          },
          {
            id: "s2",
            url: "https://youtube.com/themuze",
            platform: "youtube",
            label: "",
          },
        ],
      },
    ]);
    expect(result.social.length).toBe(2);
    expect(result.social[0].platform).toBe("instagram");
  });

  it("filters out social entries with empty urls", () => {
    const result = normalizeSiteSettings([
      {
        key: "social",
        value: [
          { id: "s1", url: "", platform: "instagram", label: "" },
          {
            id: "s2",
            url: "https://youtube.com/themuze",
            platform: "youtube",
            label: "",
          },
        ],
      },
    ]);
    expect(result.social.length).toBe(1);
    expect(result.social[0].platform).toBe("youtube");
  });

  it("normalizes social as legacy object format", () => {
    const result = normalizeSiteSettings([
      {
        key: "social",
        value: {
          instagram: "https://instagram.com/themuze",
          youtube: "https://youtube.com/themuze",
        },
      },
    ]);
    expect(result.social.length).toBe(2);
  });

  it("ignores unknown keys", () => {
    const result = normalizeSiteSettings([
      { key: "unknown_key", value: { foo: "bar" } },
    ]);
    expect(result).toEqual(expect.objectContaining({ social: [] }));
  });
});
