import { describe, it, expect } from "vitest";
import { safeRedirect } from "./redirect";

describe("safeRedirect", () => {
  it("returns / for null", () => {
    expect(safeRedirect(null)).toBe("/");
  });

  it("returns / for undefined", () => {
    expect(safeRedirect(undefined)).toBe("/");
  });

  it("returns / for empty string", () => {
    expect(safeRedirect("")).toBe("/");
  });

  it("returns the path for a valid relative URL", () => {
    expect(safeRedirect("/dashboard")).toBe("/dashboard");
    expect(safeRedirect("/admin/notices")).toBe("/admin/notices");
  });

  it("strips double-slash protocol-relative URLs", () => {
    expect(safeRedirect("//evil.com")).toBe("/");
  });

  it("rejects absolute URLs", () => {
    expect(safeRedirect("https://evil.com")).toBe("/");
    expect(safeRedirect("http://evil.com/path")).toBe("/");
  });

  it("rejects javascript: URIs", () => {
    expect(safeRedirect("javascript:alert(1)")).toBe("/");
  });

  it("uses first element when given an array", () => {
    expect(safeRedirect(["/admin", "/other"])).toBe("/admin");
  });

  it("returns / for array with invalid first element", () => {
    expect(safeRedirect(["//evil.com", "/ok"])).toBe("/");
  });

  it("preserves query strings and hashes in safe paths", () => {
    expect(safeRedirect("/search?q=hello")).toBe("/search?q=hello");
  });
});
