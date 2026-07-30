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

    it("should strip script tags completely without executing or leaving multi-character bypasses", () => {
      const input = "<p>Hello <script>alert('xss')</script>World</p>";
      expect(richTextToPlainText(input)).toBe("Hello World");
    });

    it("should convert block tags and br tags to newlines", () => {
      const input = "<p>Line 1<br>Line 2</p><p>Line 3</p>";
      expect(richTextToPlainText(input)).toBe("Line 1\nLine 2\nLine 3");
    });
  });

  describe("plainTextToRichText", () => {
    it("should wrap paragraphs in p tags", () => {
      const input = "Hello\n\nWorld";
      expect(plainTextToRichText(input)).toBe("<p>Hello</p><p>World</p>");
    });
  });
});
