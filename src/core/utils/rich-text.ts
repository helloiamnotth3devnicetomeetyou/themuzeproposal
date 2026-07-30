import DOMPurify from "isomorphic-dompurify";

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

// Hook to dynamically enforce safe link attributes
if (typeof DOMPurify.addHook === "function") {
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
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
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
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
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#(\d+);?/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);?/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    // &amp; must be decoded last: decoding it first would allow double-encoded
    // entities like &amp;lt; to pass through as < (CodeQL High #7).
    .replace(/&amp;/gi, "&");
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
