import "server-only";
import sharp from "sharp";

const ALLOWED_TAGS = new Set([
  "svg",
  "g",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "defs",
  "clipPath",
  "symbol",
  "use",
  "mask",
  "linearGradient",
  "radialGradient",
  "stop",
  "title",
  "desc",
  "style",
]);

const ALLOWED_ATTRIBUTES = new Set([
  "xmlns",
  "xmlns:xlink",
  "viewBox",
  "width",
  "height",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "d",
  "points",
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "opacity",
  "transform",
  "vector-effect",
  "paint-order",
  "gradientUnits",
  "gradientTransform",
  "offset",
  "stop-color",
  "stop-opacity",
  "clip-path",
  "mask",
  "id",
  "class",
  "style",
  "preserveAspectRatio",
  "version",
  "role",
  "aria-label",
  "focusable",
  "href",
  "xlink:href",
  "xml:space",
  "shape-rendering",
]);

const ALLOWED_STYLE_PROPERTIES = new Set([
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "opacity",
  "stop-color",
  "stop-opacity",
  "vector-effect",
  "paint-order",
  "clip-path",
  "mask",
]);

const TAG_NAME = /^[A-Za-z][A-Za-z0-9-]*$/;
const ATTRIBUTE_NAME = /^[A-Za-z_:][A-Za-z0-9_.:-]*$/;
const SAFE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_.:-]*$/;
const FORBIDDEN_VALUE = /(?:javascript\s*:|data\s*:|vbscript\s*:|expression\s*\(|@import|-moz-binding)/i;

export class UnsafeSvgError extends Error {
  constructor() {
    super("Unsafe SVG");
    this.name = "UnsafeSvgError";
  }
}

function unsafe(): never {
  throw new UnsafeSvgError();
}

function decodeXmlEntities(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos);/gi, (entity, code: string) => {
    if (code.toLowerCase() === "amp") return "&";
    if (code.toLowerCase() === "lt") return "<";
    if (code.toLowerCase() === "gt") return ">";
    if (code.toLowerCase() === "quot") return "\"";
    if (code.toLowerCase() === "apos") return "'";
    const point = code.toLowerCase().startsWith("#x")
      ? Number.parseInt(code.slice(2), 16)
      : Number.parseInt(code.slice(1), 10);
    if (!Number.isFinite(point) || point < 0x20 || point > 0x10ffff) unsafe();
    return String.fromCodePoint(point);
  }).replace(/&[A-Za-z0-9#]+;/g, () => unsafe());
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeStyleDeclarations(value: string) {
  if (FORBIDDEN_VALUE.test(value)) unsafe();

  return value
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const separator = declaration.indexOf(":");
      if (separator < 1) unsafe();
      const property = declaration.slice(0, separator).trim().toLowerCase();
      const propertyValue = declaration.slice(separator + 1).trim();
      if (!ALLOWED_STYLE_PROPERTIES.has(property) || !propertyValue) unsafe();
      if (/url\s*\(/i.test(propertyValue) && !/^url\(\s*#[A-Za-z_][A-Za-z0-9_.:-]*\s*\)$/i.test(propertyValue)) {
        unsafe();
      }
      return `${property}:${propertyValue}`;
    })
    .join(";");
}

function sanitizeStyleSheet(value: string) {
  const decoded = decodeXmlEntities(value).replace(/\/\*[\s\S]*?\*\//g, "").trim();
  if (!decoded) return "";
  if (FORBIDDEN_VALUE.test(decoded) || decoded.includes("<") || decoded.includes(">")) unsafe();

  let cursor = 0;
  const safeRules: string[] = [];
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  for (const match of decoded.matchAll(rulePattern)) {
    if (match.index !== cursor && decoded.slice(cursor, match.index).trim()) unsafe();
    const selector = match[1].trim();
    if (!/^(?:[.#][A-Za-z_][A-Za-z0-9_.:-]*)(?:\s*,\s*[.#][A-Za-z_][A-Za-z0-9_.:-]*)*$/.test(selector)) {
      unsafe();
    }
    safeRules.push(`${selector}{${sanitizeStyleDeclarations(match[2])}}`);
    cursor = (match.index ?? 0) + match[0].length;
  }
  if (!safeRules.length || decoded.slice(cursor).trim()) unsafe();
  return safeRules.join("");
}

function sanitizeAttribute(name: string, rawValue: string) {
  if (!ALLOWED_ATTRIBUTES.has(name) || /^on/i.test(name)) unsafe();
  const value = decodeXmlEntities(rawValue);
  if (/[\u0000-\u001f\u007f]/.test(value) || FORBIDDEN_VALUE.test(value)) unsafe();

  if ((name === "id" || name === "class") && !value.split(/\s+/).every((item) => SAFE_IDENTIFIER.test(item))) {
    unsafe();
  }
  if (name === "xmlns" && value !== "http://www.w3.org/2000/svg") unsafe();
  if (name === "xmlns:xlink" && value !== "http://www.w3.org/1999/xlink") unsafe();
  if (name === "href" || name === "xlink:href") {
    if (!/^#[A-Za-z_][A-Za-z0-9_.:-]*$/.test(value)) unsafe();
    return value;
  }
  if (name === "style") return sanitizeStyleDeclarations(value);
  if (/url\s*\(/i.test(value) && !/^url\(\s*#[A-Za-z_][A-Za-z0-9_.:-]*\s*\)$/i.test(value)) unsafe();

  return value;
}

function parseOpeningTag(source: string) {
  const selfClosing = /\/\s*$/.test(source);
  const content = source.replace(/\/\s*$/, "").trim();
  const nameMatch = /^([A-Za-z][A-Za-z0-9-]*)/.exec(content);
  if (!nameMatch || !TAG_NAME.test(nameMatch[1])) unsafe();

  const name = nameMatch[1];
  if (!ALLOWED_TAGS.has(name)) unsafe();

  let cursor = nameMatch[0].length;
  const attributes: string[] = [];
  const seen = new Set<string>();

  while (cursor < content.length) {
    const whitespace = /^\s+/.exec(content.slice(cursor));
    if (!whitespace) unsafe();
    cursor += whitespace[0].length;
    if (cursor >= content.length) break;

    const attributeMatch = /^([A-Za-z_:][A-Za-z0-9_.:-]*)/.exec(content.slice(cursor));
    if (!attributeMatch || !ATTRIBUTE_NAME.test(attributeMatch[1])) unsafe();
    const attributeName = attributeMatch[1];
    if (seen.has(attributeName)) unsafe();
    seen.add(attributeName);
    cursor += attributeMatch[0].length;

    cursor += (/^\s*/.exec(content.slice(cursor))?.[0].length ?? 0);
    if (content[cursor] !== "=") unsafe();
    cursor += 1;
    cursor += (/^\s*/.exec(content.slice(cursor))?.[0].length ?? 0);

    const quote = content[cursor];
    if (quote !== "\"" && quote !== "'") unsafe();
    cursor += 1;
    const end = content.indexOf(quote, cursor);
    if (end < 0) unsafe();
    const value = sanitizeAttribute(attributeName, content.slice(cursor, end));
    attributes.push(`${attributeName}="${escapeXml(value)}"`);
    cursor = end + 1;
  }

  return { name, selfClosing, attributes };
}

function readTag(source: string, start: number) {
  let quote = "";
  for (let index = start + 1; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === quote) quote = "";
      continue;
    }
    if (character === "\"" || character === "'") {
      quote = character;
    } else if (character === ">") {
      return { token: source.slice(start + 1, index), next: index + 1 };
    }
  }
  unsafe();
}

const SVG_TRIM_RASTER_SIZE = 1024;
const SVG_TRIM_PADDING_RATIO = 0.015;

function formatViewBoxNumber(value: number) {
  return Number(value.toFixed(4)).toString();
}

export async function trimSvgToContent(source: string) {
  const openingTag = source.match(/^<svg\b[^>]*>/)?.[0];
  const viewBoxValue = openingTag?.match(/\sviewBox="([^"]+)"/)?.[1];
  if (!openingTag || !viewBoxValue) return source;

  const viewBox = viewBoxValue.trim().split(/[\s,]+/).map(Number);
  if (viewBox.length !== 4 || viewBox.some((value) => !Number.isFinite(value)) || viewBox[2] <= 0 || viewBox[3] <= 0) {
    return source;
  }

  const { data, info } = await sharp(Buffer.from(source), {
    density: 144,
    limitInputPixels: 40_000_000,
  })
    .resize(SVG_TRIM_RASTER_SIZE, SVG_TRIM_RASTER_SIZE, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  const alphaChannel = info.channels - 1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * info.channels + alphaChannel] <= 2) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return source;

  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;
  const paddingX = Math.max(2, Math.round(contentWidth * SVG_TRIM_PADDING_RATIO));
  const paddingY = Math.max(2, Math.round(contentHeight * SVG_TRIM_PADDING_RATIO));
  minX = Math.max(0, minX - paddingX);
  minY = Math.max(0, minY - paddingY);
  maxX = Math.min(info.width - 1, maxX + paddingX);
  maxY = Math.min(info.height - 1, maxY + paddingY);

  const [sourceX, sourceY, sourceWidth, sourceHeight] = viewBox;
  const nextViewBox = [
    sourceX + (minX / info.width) * sourceWidth,
    sourceY + (minY / info.height) * sourceHeight,
    ((maxX - minX + 1) / info.width) * sourceWidth,
    ((maxY - minY + 1) / info.height) * sourceHeight,
  ].map(formatViewBoxNumber).join(" ");

  const nextOpeningTag = openingTag
    .replace(/\sviewBox="[^"]+"/, ` viewBox="${nextViewBox}"`)
    .replace(/\s(?:width|height)="[^"]*"/g, "");
  return source.replace(openingTag, nextOpeningTag);
}

export function sanitizeSvg(source: string) {
  const input = source.replace(/^\uFEFF/, "").trim();
  if (!input || input.length > 10 * 1024 * 1024 || /<!DOCTYPE|<!ENTITY/i.test(input)) unsafe();

  const output: string[] = [];
  const stack: string[] = [];
  let cursor = 0;
  let nodeCount = 0;
  let rootSeen = false;

  while (cursor < input.length) {
    if (input.startsWith("<!--", cursor)) {
      const commentEnd = input.indexOf("-->", cursor + 4);
      if (commentEnd < 0) unsafe();
      cursor = commentEnd + 3;
      continue;
    }

    if (input[cursor] !== "<") {
      const nextTag = input.indexOf("<", cursor);
      const text = input.slice(cursor, nextTag < 0 ? input.length : nextTag);
      const current = stack.at(-1);
      if (text.trim()) {
        if (current === "style") output.push(sanitizeStyleSheet(text));
        else if (current === "title" || current === "desc") output.push(escapeXml(decodeXmlEntities(text)));
        else unsafe();
      }
      cursor = nextTag < 0 ? input.length : nextTag;
      continue;
    }

    if (input.startsWith("<?xml", cursor)) {
      const declarationEnd = input.indexOf("?>", cursor + 5);
      if (cursor !== 0 || declarationEnd < 0) unsafe();
      cursor = declarationEnd + 2;
      continue;
    }
    if (input.startsWith("<!", cursor) || input.startsWith("<?", cursor)) unsafe();

    const { token, next } = readTag(input, cursor);
    const trimmed = token.trim();
    if (trimmed.startsWith("/")) {
      const name = trimmed.slice(1).trim();
      if (!TAG_NAME.test(name) || stack.pop() !== name) unsafe();
      output.push(`</${name}>`);
    } else {
      const parsed = parseOpeningTag(trimmed);
      nodeCount += 1;
      if (nodeCount > 2000) unsafe();
      if (!rootSeen) {
        if (parsed.name !== "svg") unsafe();
        rootSeen = true;
        if (!parsed.attributes.some((attribute) => attribute.startsWith("xmlns="))) {
          parsed.attributes.unshift("xmlns=\"http://www.w3.org/2000/svg\"");
        }
      } else if (stack.length === 0) {
        unsafe();
      }
      output.push(`<${parsed.name}${parsed.attributes.length ? ` ${parsed.attributes.join(" ")}` : ""}${parsed.selfClosing ? "/>" : ">"}`);
      if (!parsed.selfClosing) stack.push(parsed.name);
    }
    cursor = next;
  }

  if (!rootSeen || stack.length) unsafe();
  return output.join("");
}
