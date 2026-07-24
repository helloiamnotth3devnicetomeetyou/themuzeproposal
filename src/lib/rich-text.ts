const ALLOWED_TAGS = new Set([
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
]);

const BLOCK_TAGS = "p|div|h2|h3|blockquote|ul|ol|li";
const DANGEROUS_BLOCKS = /<(script|style|iframe|object|embed|svg|math|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const HTML_TAG = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g;
const ALLOWED_MARKUP = new RegExp(`<\\/?(?:${BLOCK_TAGS}|br|strong|b|em|i|u|s|a)\\b`, "i");

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function decodeUrlEntities(value: string): string {
  return value
    .replace(/&#(\d+);?/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);?/gi, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&colon;?/gi, ":")
    .replace(/&tab;?/gi, "\t")
    .replace(/&newline;?/gi, "\n")
    .replace(/&amp;/gi, "&");
}

function sanitizeHref(value: string): string {
  const decoded = decodeUrlEntities(value).trim();
  const compact = decoded.replace(/[\u0000-\u0020\u007f]+/g, "");
  if (
    compact.startsWith("/") ||
    compact.startsWith("#") ||
    /^(https?:|mailto:|tel:)/i.test(compact)
  ) {
    return escapeHtml(decoded);
  }
  return "";
}

function readHref(tag: string): string {
  const match = tag.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i);
  return sanitizeHref(match?.[1] ?? match?.[2] ?? match?.[3] ?? "");
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
 * Sanitizes the deliberately small HTML vocabulary supported by the notice editor.
 * This stays DOM-independent so the same guard can run in client and server renders.
 */
export function sanitizeRichText(value: string): string {
  const input = value.trim();
  if (!input) return "";
  if (!ALLOWED_MARKUP.test(input)) return plainTextToRichText(input);

  const withoutDangerousBlocks = input.replace(DANGEROUS_BLOCKS, "").replace(HTML_COMMENT, "");

  return withoutDangerousBlocks.replace(HTML_TAG, (tag, rawName: string) => {
    const name = rawName.toLowerCase();
    const closing = /^<\s*\//.test(tag);

    if (name === "div") return closing ? "</p>" : "<p>";
    if (!ALLOWED_TAGS.has(name)) return "";
    if (name === "br") return "<br>";
    if (closing) return `</${name}>`;
    if (name !== "a") return `<${name}>`;

    const href = readHref(tag);
    return href ? `<a href="${href}" target="_blank" rel="noopener noreferrer">` : "";
  });
}

function decodeTextEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#(\d+);?/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);?/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

export function richTextToPlainText(value: string): string {
  const sanitized = sanitizeRichText(value);
  return decodeTextEntities(
    sanitized
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(new RegExp(`</(?:${BLOCK_TAGS})>`, "gi"), "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function hasRichTextContent(value: string): boolean {
  return richTextToPlainText(value).length > 0;
}
