import { test as base, expect } from "@playwright/test";

export const test = base;
export { expect };

// Minimal file generators for signature validation tests
export function createMockFile(
  type: "pdf" | "jpg" | "png" | "zip" | "mp3" | "invalid_png",
  sizeInBytes: number = 1024
): Buffer {
  const buffer = Buffer.alloc(sizeInBytes);

  switch (type) {
    case "pdf":
      buffer.write("%PDF-1.4\n%EOF\n", 0);
      break;
    case "jpg":
      buffer[0] = 0xff;
      buffer[1] = 0xd8;
      buffer[2] = 0xff;
      break;
    case "png":
      buffer.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
      break;
    case "zip":
      buffer.set([0x50, 0x4b, 0x03, 0x04], 0);
      break;
    case "mp3":
      buffer.write("ID3", 0);
      break;
    case "invalid_png":
      // Fake extension png but text body
      buffer.write("THIS_IS_NOT_A_PNG_HEADER", 0);
      break;
  }

  return buffer;
}
