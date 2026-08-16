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
  extension:
    "jpg" | "png" | "webp" | "gif" | "pdf" | "zip" | "mp3" | "mp4" | "webm";
};

const PROFILE_TYPES: Record<
  FileValidationProfile,
  ReadonlySet<ValidatedFileType>
> = {
  "public-image": new Set(["image/jpeg", "image/png", "image/webp"]),
  "track-asset": new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "audio/mpeg",
  ]),
  "protect-evidence": new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ]),
  "contact-attachment": new Set(["application/pdf"]),
  "business-asset": new Set(["application/pdf", "application/zip"]),
  "hero-video": new Set(["video/mp4"]),
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
const MAX_IMAGE_PIXELS = 25_000_000;
const MAX_IMAGE_EDGE = 10_000;
const MAX_IMAGE_FRAMES = 20;
const MAX_DISPLAY_FILE_NAME_LENGTH = 255;
const PDF_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
const PDF_EOF = [0x25, 0x25, 0x45, 0x4f, 0x46]; // %%EOF
const ZIP_LOCAL_FILE = [0x50, 0x4b, 0x03, 0x04];
const ZIP_CENTRAL_FILE = [0x50, 0x4b, 0x01, 0x02];
const ZIP_END_OF_CENTRAL_DIRECTORY = [0x50, 0x4b, 0x05, 0x06];
const ZIP64_END_OF_CENTRAL_DIRECTORY = [0x50, 0x4b, 0x06, 0x06];
const MAX_ZIP_ENTRIES = 1_000;
const MAX_ZIP_UNCOMPRESSED_BYTES = 250 * 1024 * 1024;
const MAX_ZIP_COMPRESSION_RATIO = 100;
const ZIP_END_OF_CENTRAL_DIRECTORY_BYTES = 22;
const ZIP_CENTRAL_DIRECTORY_HEADER_BYTES = 46;
const ZIP_LOCAL_FILE_HEADER_BYTES = 30;
const ZIP_MAX_COMMENT_BYTES = 0xffff;

function startsWith(bytes: Uint8Array, signature: readonly number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return new TextDecoder("ascii").decode(bytes.subarray(start, start + length));
}

function indexOfBytes(
  bytes: Uint8Array,
  signature: readonly number[],
  start = 0,
  end = bytes.length,
) {
  const lastStart = Math.min(end, bytes.length) - signature.length;
  for (let index = Math.max(0, start); index <= lastStart; index += 1) {
    if (startsWith(bytes.subarray(index), signature)) return index;
  }
  return -1;
}

function lastIndexOfBytes(
  bytes: Uint8Array,
  signature: readonly number[],
  end = bytes.length,
) {
  const firstStart = Math.min(end, bytes.length) - signature.length;
  for (let index = firstStart; index >= 0; index -= 1) {
    if (startsWith(bytes.subarray(index), signature)) return index;
  }
  return -1;
}

function isPdfWhitespace(value: number) {
  return (
    value === 0 ||
    value === 9 ||
    value === 10 ||
    value === 12 ||
    value === 13 ||
    value === 32
  );
}

function hasAscii(
  bytes: Uint8Array,
  value: string,
  start = 0,
  end = bytes.length,
) {
  return (
    indexOfBytes(
      bytes,
      Array.from(new TextEncoder().encode(value)),
      start,
      end,
    ) >= 0
  );
}

function parseUnsignedDecimal(bytes: Uint8Array, start: number, end: number) {
  let index = start;
  while (index < end && isPdfWhitespace(bytes[index])) index += 1;
  const numberStart = index;
  while (index < end && bytes[index] >= 0x30 && bytes[index] <= 0x39)
    index += 1;
  if (index === numberStart) return null;
  const value = Number(ascii(bytes, numberStart, index - numberStart));
  return Number.isSafeInteger(value) ? { value, end: index } : null;
}

function isPdfIndirectObjectAt(bytes: Uint8Array, start: number, end: number) {
  const objectNumber = parseUnsignedDecimal(bytes, start, end);
  if (!objectNumber) return false;
  const generationNumber = parseUnsignedDecimal(bytes, objectNumber.end, end);
  if (!generationNumber) return false;
  let tokenStart = generationNumber.end;
  while (tokenStart < end && isPdfWhitespace(bytes[tokenStart]))
    tokenStart += 1;
  return startsWith(bytes.subarray(tokenStart), [0x6f, 0x62, 0x6a]);
}

function hasPdfIndirectObject(bytes: Uint8Array, start: number, end: number) {
  const objectToken = [0x6f, 0x62, 0x6a];
  let token = indexOfBytes(bytes, objectToken, start, end);
  while (token >= 0) {
    for (
      let candidate = Math.max(start, token - 64);
      candidate < token;
      candidate += 1
    ) {
      if (
        bytes[candidate] >= 0x30 &&
        bytes[candidate] <= 0x39 &&
        (candidate === start ||
          bytes[candidate - 1] < 0x30 ||
          bytes[candidate - 1] > 0x39) &&
        isPdfIndirectObjectAt(bytes, candidate, token + objectToken.length)
      )
        return true;
    }
    token = indexOfBytes(bytes, objectToken, token + objectToken.length, end);
  }
  return false;
}

function hasPdfStructure(bytes: Uint8Array) {
  if (
    bytes.length < 16 ||
    !startsWith(bytes, PDF_HEADER) ||
    (bytes[5] !== 0x31 && bytes[5] !== 0x32) ||
    bytes[6] !== 0x2e ||
    bytes[7] < 0x30 ||
    bytes[7] > 0x37
  )
    return false;

  const eof = lastIndexOfBytes(bytes, PDF_EOF);
  if (eof < 0) return false;
  for (let index = eof + PDF_EOF.length; index < bytes.length; index += 1) {
    if (!isPdfWhitespace(bytes[index])) return false;
  }

  // A valid PDF has an indirect object and either a classic xref table or an
  // xref stream. This rejects header-only and text/polyglot lookalikes while
  // accepting both pre-1.5 and xref-stream PDFs.
  const hasIndirectObject = hasPdfIndirectObject(bytes, 8, eof);
  const hasEndObject = hasAscii(bytes, "endobj", 8, eof);
  const startXref = indexOfBytes(
    bytes,
    Array.from(new TextEncoder().encode("startxref")),
    8,
    eof,
  );
  if (!hasIndirectObject || !hasEndObject || startXref < 0) return false;
  const xref = hasAscii(bytes, "xref", 8, startXref);
  const xrefStream = hasAscii(bytes, "/Type /XRef", 8, eof);
  if (!xref && !xrefStream) return false;
  const pointer = parseUnsignedDecimal(
    bytes,
    startXref + "startxref".length,
    eof,
  );
  if (!pointer || pointer.value >= eof) return false;
  const pointerEnd = Math.min(eof, pointer.value + 256);
  return (
    startsWith(bytes.subarray(pointer.value), [0x78, 0x72, 0x65, 0x66]) ||
    isPdfIndirectObjectAt(bytes, pointer.value, pointerEnd)
  );
}

function readUint16(view: DataView, offset: number) {
  return view.getUint16(offset, true);
}

function readUint32(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}

function hasZipSignature(bytes: Uint8Array) {
  return (
    indexOfBytes(bytes, ZIP_LOCAL_FILE) >= 0 ||
    indexOfBytes(bytes, ZIP_CENTRAL_FILE) >= 0 ||
    indexOfBytes(bytes, ZIP_END_OF_CENTRAL_DIRECTORY) >= 0 ||
    indexOfBytes(bytes, ZIP64_END_OF_CENTRAL_DIRECTORY) >= 0
  );
}

function isSafeZipEntryName(bytes: Uint8Array, start: number, length: number) {
  const name = new TextDecoder("utf-8", { fatal: true });
  let value: string;
  try {
    value = name.decode(bytes.subarray(start, start + length));
  } catch {
    return false;
  }
  return (
    value.length > 0 &&
    !value.includes("\0") &&
    !value.startsWith("/") &&
    !/^[A-Za-z]:[\\/]/.test(value) &&
    !value.split(/[\\/]/).includes("..")
  );
}

function hasValidZipStructure(bytes: Uint8Array) {
  if (bytes.length < ZIP_END_OF_CENTRAL_DIRECTORY_BYTES) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minimumEocdOffset = Math.max(
    0,
    bytes.length - ZIP_END_OF_CENTRAL_DIRECTORY_BYTES - ZIP_MAX_COMMENT_BYTES,
  );
  let eocd = -1;
  for (
    let offset = bytes.length - ZIP_END_OF_CENTRAL_DIRECTORY_BYTES;
    offset >= minimumEocdOffset;
    offset -= 1
  ) {
    if (!startsWith(bytes.subarray(offset), ZIP_END_OF_CENTRAL_DIRECTORY))
      continue;
    const commentLength = readUint16(view, offset + 20);
    if (
      offset + ZIP_END_OF_CENTRAL_DIRECTORY_BYTES + commentLength ===
      bytes.length
    ) {
      eocd = offset;
      break;
    }
  }
  if (
    eocd < 0 ||
    readUint16(view, eocd + 4) !== 0 ||
    readUint16(view, eocd + 6) !== 0
  )
    return false;

  const entryCount = readUint16(view, eocd + 10);
  const centralDirectorySize = readUint32(view, eocd + 12);
  const centralDirectoryOffset = readUint32(view, eocd + 16);
  if (
    entryCount > MAX_ZIP_ENTRIES ||
    (entryCount === 0 ? eocd !== 0 : !startsWith(bytes, ZIP_LOCAL_FILE))
  )
    return false;
  if (
    entryCount === 0 &&
    (centralDirectorySize !== 0 || centralDirectoryOffset !== 0)
  )
    return false;
  if (
    centralDirectoryOffset > eocd ||
    centralDirectorySize > eocd - centralDirectoryOffset ||
    centralDirectoryOffset + centralDirectorySize !== eocd
  )
    return false;
  if (
    readUint16(view, eocd + 8) !== entryCount ||
    (entryCount === 0 ? eocd !== 0 : centralDirectoryOffset === 0)
  )
    return false;

  let cursor = centralDirectoryOffset;
  let totalUncompressed = 0;
  const ranges: Array<[number, number]> = [];
  for (let entry = 0; entry < entryCount; entry += 1) {
    if (
      cursor + ZIP_CENTRAL_DIRECTORY_HEADER_BYTES > eocd ||
      !startsWith(bytes.subarray(cursor), ZIP_CENTRAL_FILE)
    )
      return false;
    const flags = readUint16(view, cursor + 8);
    const compressionMethod = readUint16(view, cursor + 10);
    const compressedSize = readUint32(view, cursor + 20);
    const uncompressedSize = readUint32(view, cursor + 24);
    const fileNameLength = readUint16(view, cursor + 28);
    const extraLength = readUint16(view, cursor + 30);
    const commentLength = readUint16(view, cursor + 32);
    const diskNumber = readUint16(view, cursor + 34);
    const localOffset = readUint32(view, cursor + 42);
    const next =
      cursor +
      ZIP_CENTRAL_DIRECTORY_HEADER_BYTES +
      fileNameLength +
      extraLength +
      commentLength;
    if (
      next > eocd ||
      diskNumber !== 0 ||
      (flags & 0x1) !== 0 ||
      (compressionMethod !== 0 && compressionMethod !== 8) ||
      (compressionMethod === 0 && compressedSize !== uncompressedSize) ||
      !isSafeZipEntryName(
        bytes,
        cursor + ZIP_CENTRAL_DIRECTORY_HEADER_BYTES,
        fileNameLength,
      )
    )
      return false;
    if (
      uncompressedSize > MAX_ZIP_UNCOMPRESSED_BYTES ||
      compressedSize > MAX_ZIP_UNCOMPRESSED_BYTES ||
      totalUncompressed > MAX_ZIP_UNCOMPRESSED_BYTES - uncompressedSize ||
      (compressedSize === 0 && uncompressedSize > 0) ||
      (compressedSize > 0 &&
        uncompressedSize / compressedSize > MAX_ZIP_COMPRESSION_RATIO)
    )
      return false;
    totalUncompressed += uncompressedSize;

    if (
      localOffset + ZIP_LOCAL_FILE_HEADER_BYTES > centralDirectoryOffset ||
      !startsWith(bytes.subarray(localOffset), ZIP_LOCAL_FILE)
    )
      return false;
    const localFlags = readUint16(view, localOffset + 6);
    const localMethod = readUint16(view, localOffset + 8);
    const localNameLength = readUint16(view, localOffset + 26);
    const localExtraLength = readUint16(view, localOffset + 28);
    const dataStart =
      localOffset +
      ZIP_LOCAL_FILE_HEADER_BYTES +
      localNameLength +
      localExtraLength;
    const dataEnd = dataStart + compressedSize;
    if (
      localFlags !== flags ||
      localMethod !== compressionMethod ||
      localNameLength !== fileNameLength ||
      dataStart > centralDirectoryOffset ||
      dataEnd > centralDirectoryOffset ||
      dataEnd < dataStart ||
      ascii(
        bytes,
        localOffset + ZIP_LOCAL_FILE_HEADER_BYTES,
        localNameLength,
      ) !==
        ascii(
          bytes,
          cursor + ZIP_CENTRAL_DIRECTORY_HEADER_BYTES,
          fileNameLength,
        )
    )
      return false;
    ranges.push([localOffset, dataEnd]);
    cursor = next;
  }
  if (cursor !== eocd) return false;
  ranges.sort(([left], [right]) => left - right);
  return ranges.every(
    (range, index) => index === 0 || range[0] >= ranges[index - 1][1],
  );
}

function detectType(bytes: Uint8Array): ValidatedFileType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return "image/png";
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a")
    return "image/gif";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP")
    return "image/webp";

  const pdfHeader = ascii(
    bytes.subarray(0, 1024),
    0,
    Math.min(bytes.length, 1024),
  );
  if (pdfHeader.includes("%PDF-")) return "application/pdf";

  const isZip =
    startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(bytes, [0x50, 0x4b, 0x07, 0x08]);
  if (isZip) return "application/zip";

  if (ascii(bytes, 0, 3) === "ID3") return "audio/mpeg";
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return "audio/mpeg";
  if (ascii(bytes, 4, 4) === "ftyp") return "video/mp4";
  if (
    startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3]) &&
    ascii(bytes, 0, bytes.length).includes("webm")
  )
    return "video/webm";
  return null;
}

export async function validateFileSignature(
  file: Blob,
  profile: FileValidationProfile,
): Promise<ValidatedFile | null> {
  if (file.size < 1) return null;

  const headerBytes = new Uint8Array(
    await file
      .slice(0, Math.min(file.size, SIGNATURE_HEADER_BYTES))
      .arrayBuffer(),
  );
  const mimeType = detectType(headerBytes);

  if (!mimeType || !PROFILE_TYPES[profile].has(mimeType)) return null;

  if (mimeType === "application/pdf" || mimeType === "application/zip") {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (
      mimeType === "application/pdf"
        ? !hasPdfStructure(bytes) || hasZipSignature(bytes.subarray(8))
        : !hasValidZipStructure(bytes)
    )
      return null;
  }

  if (mimeType.startsWith("image/")) {
    try {
      const metadata = await sharp(await file.arrayBuffer(), {
        animated: true,
        limitInputPixels: MAX_IMAGE_PIXELS,
      }).metadata();
      const width = metadata.width ?? 0;
      const height = metadata.height ?? 0;
      const frames = metadata.pages ?? 1;
      if (
        !width ||
        !height ||
        width > MAX_IMAGE_EDGE ||
        height > MAX_IMAGE_EDGE ||
        width * height * frames > MAX_IMAGE_PIXELS ||
        frames > MAX_IMAGE_FRAMES
      )
        return null;
    } catch {
      return null;
    }
  }

  return { mimeType, extension: EXTENSIONS[mimeType] };
}

export function extensionMatches(
  fileName: string,
  extension: ValidatedFile["extension"],
) {
  const actual = fileName.split(".").pop()?.toLowerCase();
  if (extension === "jpg") return actual === "jpg" || actual === "jpeg";
  return actual === extension;
}

export function boundedFileName(fileName: string) {
  const normalized = fileName
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]/g, "_");
  return (
    Array.from(normalized).slice(0, MAX_DISPLAY_FILE_NAME_LENGTH).join("") ||
    "attachment"
  );
}
