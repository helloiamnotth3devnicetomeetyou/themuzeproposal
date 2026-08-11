import sharp from "sharp";

type ValidatedFileType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif"
  | "application/pdf"
  | "application/zip"
  | "audio/mpeg"
  | "video/mp4"
  | "video/webm";

export type FileValidationProfile =
  | "public-image"
  | "track-asset"
  | "protect-evidence"
  | "contact-attachment"
  | "business-asset"
  | "hero-video"
  | "audition-attachment";

export type ValidatedFile = {
  mimeType: ValidatedFileType;
  extension: "jpg" | "png" | "webp" | "gif" | "pdf" | "zip" | "mp3" | "mp4" | "webm";
};

const PROFILE_TYPES: Record<FileValidationProfile, ReadonlySet<ValidatedFileType>> = {
  "public-image": new Set(["image/jpeg", "image/png", "image/webp"]),
  "track-asset": new Set(["image/jpeg", "image/png", "image/webp", "audio/mpeg"]),
  "protect-evidence": new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ]),
  "contact-attachment": new Set(["application/pdf"]),
  "business-asset": new Set(["application/pdf", "application/zip"]),
  "hero-video": new Set(["video/webm"]),
  // Images (portfolio screenshots, photos) and PDF for audition attachments.
  "audition-attachment": new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "audio/mpeg",
    "video/mp4",
  ]),
};

const EXTENSIONS: Record<ValidatedFileType, ValidatedFile["extension"]> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "application/zip": "zip",
  "audio/mpeg": "mp3",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

const SIGNATURE_HEADER_BYTES = 4 * 1024;
const MAX_EVIDENCE_PIXELS = 25_000_000;
const MAX_EVIDENCE_EDGE = 10_000;
const MAX_EVIDENCE_FRAMES = 20;
const MAX_DISPLAY_FILE_NAME_LENGTH = 255;

function startsWith(bytes: Uint8Array, signature: readonly number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return new TextDecoder("ascii").decode(bytes.subarray(start, start + length));
}

function detectType(bytes: Uint8Array): ValidatedFileType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") return "image/gif";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "image/webp";

  const pdfHeader = ascii(bytes.subarray(0, 1024), 0, Math.min(bytes.length, 1024));
  if (pdfHeader.includes("%PDF-")) return "application/pdf";

  const isZip = startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])
    || startsWith(bytes, [0x50, 0x4b, 0x05, 0x06])
    || startsWith(bytes, [0x50, 0x4b, 0x07, 0x08]);
  if (isZip) return "application/zip";

  if (ascii(bytes, 0, 3) === "ID3") return "audio/mpeg";
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return "audio/mpeg";
  if (ascii(bytes, 4, 4) === "ftyp") return "video/mp4";
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3]) && ascii(bytes, 0, bytes.length).includes("webm")) return "video/webm";
  return null;
}

export async function validateFileSignature(
  file: Blob,
  profile: FileValidationProfile,
): Promise<ValidatedFile | null> {
  if (file.size < 1) return null;

  const headerBytes = new Uint8Array(
    await file.slice(0, Math.min(file.size, SIGNATURE_HEADER_BYTES)).arrayBuffer(),
  );
  const mimeType = detectType(headerBytes);

  if (!mimeType || !PROFILE_TYPES[profile].has(mimeType)) return null;

  if ((profile === "protect-evidence" || profile === "audition-attachment")
    && mimeType.startsWith("image/")) {
    try {
      const metadata = await sharp(await file.arrayBuffer(), {
        animated: true,
        limitInputPixels: MAX_EVIDENCE_PIXELS,
      }).metadata();
      const width = metadata.width ?? 0;
      const height = metadata.height ?? 0;
      const frames = metadata.pages ?? 1;
      if (!width || !height || width > MAX_EVIDENCE_EDGE || height > MAX_EVIDENCE_EDGE
        || width * height * frames > MAX_EVIDENCE_PIXELS || frames > MAX_EVIDENCE_FRAMES) return null;
    } catch {
      return null;
    }
  }

  return { mimeType, extension: EXTENSIONS[mimeType] };
}

export function extensionMatches(fileName: string, extension: ValidatedFile["extension"]) {
  const actual = fileName.split(".").pop()?.toLowerCase();
  if (extension === "jpg") return actual === "jpg" || actual === "jpeg";
  return actual === extension;
}

export function boundedFileName(fileName: string) {
  const normalized = fileName.normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, "").replace(/[\\/]/g, "_");
  return Array.from(normalized).slice(0, MAX_DISPLAY_FILE_NAME_LENGTH).join("") || "attachment";
}
