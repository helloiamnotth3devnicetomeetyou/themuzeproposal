import { describe, expect, it } from "vitest";
import { isLocale, localizeText } from "./localized";

describe("localizeText", () => {
  const value = { ko: "한국어", en: "English", ja: "日本語" };

  it("uses the selected locale first", () => {
    expect(localizeText(value, "ja")).toBe("日本語");
  });

  it("falls back to Korean before English and Japanese", () => {
    expect(localizeText({ ko: "한국어", en: "English" }, "ja")).toBe("한국어");
  });

  it("treats whitespace as missing and uses the canonical value last", () => {
    expect(localizeText({ ko: " ", en: "" }, "en", "Canonical")).toBe("Canonical");
  });

  it("returns an empty string when no value exists", () => {
    expect(localizeText({}, "ko")).toBe("");
  });
});

describe("isLocale", () => {
  it("accepts only supported locale codes", () => {
    expect(isLocale("ko")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });
});
