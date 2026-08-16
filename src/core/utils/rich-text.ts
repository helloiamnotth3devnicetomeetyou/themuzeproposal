import DOMPurify from "isomorphic-dompurify";
import { safeHref } from "@/core/http/safe-href";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "h2",
  "h3",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
];

const BLOCK_TAGS = "p|div|h2|h3|blockquote|ul|ol|li";

// Hook to dynamically enforce safe link attributes and protocols.
if (typeof DOMPurify.addHook === "function") {
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName !== "A") return;

    const href = safeHref(node.getAttribute("href"));
    if (!href) {
      node.removeAttribute("href");
      node.removeAttribute("target");
      node.removeAttribute("rel");
      return;
    }

    node.setAttribute("href", href);
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  });
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function plainTextToRichText(value: string): string {
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return "";

  return normalized
    .split(/\n{2,}/)
    .map(
      (paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
}

/**
 * Sanitizes rich text HTML using DOMPurify.
 */
export function sanitizeRichText(value: string): string {
  const input = value.trim();
  if (!input) return "";

  // Normalize div tags to p tags to align with formatting rules
  const preProcessed = input
    .replace(/<div\b[^>]*>/gi, "<p>")
    .replace(/<\/div>/gi, "</p>");

  return DOMPurify.sanitize(preProcessed, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}

function decodeTextEntities(value: string): string {
  const decodeNumericEntity = (code: string, radix: number) => {
    const codePoint = Number.parseInt(code, radix);
    if (
      !Number.isInteger(codePoint) ||
      codePoint < 0 ||
      codePoint > 0x10ffff ||
      (codePoint >= 0xd800 && codePoint <= 0xdfff)
    ) {
      return "\ufffd";
    }
    return String.fromCodePoint(codePoint);
  };

  return (
    value
      .replace(/&nbsp;/gi, " ")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#0*39;|&apos;/gi, "'")
      .replace(/&#(\d+);?/g, (_, code: string) => decodeNumericEntity(code, 10))
      .replace(/&#x([0-9a-f]+);?/gi, (_, code: string) =>
        decodeNumericEntity(code, 16),
      )
      // &amp; must be decoded last: decoding it first would allow double-encoded
      // entities like &amp;lt; to pass through as < (CodeQL High #7).
      .replace(/&amp;/gi, "&")
  );
}

export function richTextToPlainText(value: string): string {
  if (!value) return "";
  const preProcessed = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(new RegExp(`</(?:${BLOCK_TAGS})>`, "gi"), "\n");

  const stripped = DOMPurify.sanitize(preProcessed, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  return decodeTextEntities(stripped)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function hasRichTextContent(value: string): boolean {
  return richTextToPlainText(value).length > 0;
}
