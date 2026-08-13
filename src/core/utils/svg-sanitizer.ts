import "server-only";
import sharp from "sharp";
import DOMPurify from "isomorphic-dompurify";

export class UnsafeSvgError extends Error {
  constructor() {
    super("Unsafe SVG");
    this.name = "UnsafeSvgError";
  }
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

  const viewBox = viewBoxValue
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (
    viewBox.length !== 4 ||
    viewBox.some((value) => !Number.isFinite(value)) ||
    viewBox[2] <= 0 ||
    viewBox[3] <= 0
  ) {
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
      if (data[(y * info.width + x) * info.channels + alphaChannel] <= 2)
        continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return source;

  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;
  const paddingX = Math.max(
    2,
    Math.round(contentWidth * SVG_TRIM_PADDING_RATIO),
  );
  const paddingY = Math.max(
    2,
    Math.round(contentHeight * SVG_TRIM_PADDING_RATIO),
  );
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
  ]
    .map(formatViewBoxNumber)
    .join(" ");

  const nextOpeningTag = openingTag
    .replace(/\sviewBox="[^"]+"/, ` viewBox="${nextViewBox}"`)
    .replace(/\s(?:width|height)="[^"]*"/g, "");
  return source.replace(openingTag, nextOpeningTag);
}

export function sanitizeSvg(source: string): string {
  const input = source.replace(/^\uFEFF/, "").trim();
  if (
    !input ||
    input.length > 10 * 1024 * 1024 ||
    /<!DOCTYPE|<!ENTITY/i.test(input)
  ) {
    throw new UnsafeSvgError();
  }

  // Sanitize SVG using DOMPurify with the SVG profile
  const sanitized = DOMPurify.sanitize(input, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_ATTR: ["viewBox", "id", "class"],
    FORBID_TAGS: ["style", "image", "foreignObject"],
    FORBID_ATTR: ["href", "xlink:href"],
    RETURN_TRUSTED_TYPE: false,
  });

  if (
    !sanitized ||
    sanitized.trim() === "" ||
    /<script|\b(?:href|xlink:href)\s*=|url\s*\(/i.test(sanitized)
  ) {
    throw new UnsafeSvgError();
  }

  // Ensure it remains an SVG and root tag is <svg
  if (!sanitized.trim().startsWith("<svg")) {
    throw new UnsafeSvgError();
  }

  return sanitized;
}
