import { describe, it, expect } from "vitest";
import { sanitizeRichText, richTextToPlainText, plainTextToRichText } from "./rich-text";

describe("Rich Text Utilities", () => {
  describe("sanitizeRichText", () => {
    it("should allow safe HTML tags", () => {
      const input = "<p>Hello <strong>World</strong></p>";
      expect(sanitizeRichText(input)).toBe("<p>Hello <strong>World</strong></p>");
    });

    it("should strip unsafe tags and attributes", () => {
      const input = "<p>Hello <script>alert(1)</script><img src=x onerror=alert(2)></p>";
      const sanitized = sanitizeRichText(input);
      expect(sanitized).not.toContain("script");
      expect(sanitized).not.toContain("img");
      expect(sanitized).not.toContain("onerror");
    });

    it("should convert div to p tags", () => {
      const input = "<div>Hello World</div>";
      expect(sanitizeRichText(input)).toBe("<p>Hello World</p>");
    });

    it("should add target='_blank' and rel='noopener noreferrer' to links", () => {
      const input = '<a href="https://example.com">Link</a>';
      const sanitized = sanitizeRichText(input);
      expect(sanitized).toContain('target="_blank"');
      expect(sanitized).toContain('rel="noopener noreferrer"');
    });
  });

  describe("richTextToPlainText", () => {
    it("should strip HTML and decode entities", () => {
      const input = "<p>Hello &amp; <strong>World</strong></p>";
      expect(richTextToPlainText(input)).toBe("Hello & World");
    });
  });

  describe("plainTextToRichText", () => {
    it("should wrap paragraphs in p tags", () => {
      const input = "Hello\n\nWorld";
      expect(plainTextToRichText(input)).toBe("<p>Hello</p><p>World</p>");
    });
  });
});
