export type ValidatedFileType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif"
  | "application/pdf"
  | "application/vnd.ms-powerpoint"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  | "audio/mpeg";

export type FileValidationProfile =
  | "public-image"
  | "track-asset"
  | "protect-evidence"
  | "contact-attachment";

export type ValidatedFile = {
  mimeType: ValidatedFileType;
  extension: "jpg" | "png" | "webp" | "gif" | "pdf" | "ppt" | "pptx" | "mp3";
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
  "contact-attachment": new Set([
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ]),
};

const EXTENSIONS: Record<ValidatedFileType, ValidatedFile["extension"]> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "audio/mpeg": "mp3",
};

function startsWith(bytes: Uint8Array, signature: readonly number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return new TextDecoder("ascii").decode(bytes.subarray(start, start + length));
}

function includesAscii(bytes: Uint8Array, value: string) {
  return ascii(bytes, 0, bytes.length).includes(value);
}

function includesUtf16Le(bytes: Uint8Array, value: string) {
  const pattern = new Uint8Array(value.length * 2);
  for (let index = 0; index < value.length; index += 1) {
    pattern[index * 2] = value.charCodeAt(index);
  }

  outer: for (let index = 0; index <= bytes.length - pattern.length; index += 1) {
    for (let offset = 0; offset < pattern.length; offset += 1) {
      if (bytes[index + offset] !== pattern[offset]) continue outer;
    }
    return true;
  }
  return false;
}

function detectType(bytes: Uint8Array): ValidatedFileType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") return "image/gif";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "image/webp";

  const pdfHeader = ascii(bytes.subarray(0, 1024), 0, Math.min(bytes.length, 1024));
  if (pdfHeader.includes("%PDF-")) return "application/pdf";

  const isOle = startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  if (isOle && includesUtf16Le(bytes, "PowerPoint Document")) {
    return "application/vnd.ms-powerpoint";
  }

  const isZip = startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])
    || startsWith(bytes, [0x50, 0x4b, 0x05, 0x06])
    || startsWith(bytes, [0x50, 0x4b, 0x07, 0x08]);
  if (isZip && includesAscii(bytes, "[Content_Types].xml") && includesAscii(bytes, "ppt/")) {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }

  if (ascii(bytes, 0, 3) === "ID3") return "audio/mpeg";
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return "audio/mpeg";
  return null;
}

export async function validateFileSignature(
  file: Blob,
  profile: FileValidationProfile,
): Promise<ValidatedFile | null> {
  if (file.size < 1) return null;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = detectType(bytes);
  if (!mimeType || !PROFILE_TYPES[profile].has(mimeType)) return null;

  return { mimeType, extension: EXTENSIONS[mimeType] };
}

export function extensionMatches(fileName: string, extension: ValidatedFile["extension"]) {
  const actual = fileName.split(".").pop()?.toLowerCase();
  if (extension === "jpg") return actual === "jpg" || actual === "jpeg";
  return actual === extension;
}
