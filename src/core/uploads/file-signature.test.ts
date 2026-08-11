// @vitest-environment node
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  boundedFileName,
  extensionMatches,
  validateFileSignature,
} from "./file-signature";

function blob(bytes: number[] | string) {
  return new Blob([typeof bytes === "string" ? new TextEncoder().encode(bytes) : new Uint8Array(bytes)]);
}

describe("validateFileSignature", () => {
  it("recognizes raster images from bytes instead of the declared MIME type", async () => {
    const png = blob([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
    const disguisedHtml = blob("<script>alert(1)</script>");

    await expect(validateFileSignature(png, "public-image")).resolves.toEqual({
      mimeType: "image/png",
      extension: "png",
    });
    await expect(validateFileSignature(disguisedHtml, "public-image")).resolves.toBeNull();
  });

  it("rejects active presentation formats for contact attachments", async () => {
    const pptName = Array.from("PowerPoint Document").flatMap((character) => [character.charCodeAt(0), 0]);
    const ppt = blob([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, ...pptName]);
    const pptx = blob("PK\u0003\u0004payload/[Content_Types].xml/ppt/presentation.xml");
    const genericZip = blob("PK\u0003\u0004payload/[Content_Types].xml/word/document.xml");

    await expect(validateFileSignature(ppt, "contact-attachment")).resolves.toBeNull();
    await expect(validateFileSignature(pptx, "contact-attachment")).resolves.toBeNull();
    await expect(validateFileSignature(genericZip, "contact-attachment")).resolves.toBeNull();
  });

  it("does not accept a valid file type in a profile that forbids it", async () => {
    const pdf = blob("%PDF-1.7\nbody");
    await expect(validateFileSignature(pdf, "protect-evidence")).resolves.toEqual({
      mimeType: "application/pdf",
      extension: "pdf",
    });
    await expect(validateFileSignature(pdf, "public-image")).resolves.toBeNull();
  });

  it("accepts only ZIP and PDF business assets without inspecting ZIP contents", async () => {
    const zip = blob("PK\u0003\u0004opaque archive payload");
    const pdf = blob("%PDF-1.7\nbody");

    await expect(validateFileSignature(zip, "business-asset")).resolves.toEqual({
      mimeType: "application/zip",
      extension: "zip",
    });
    await expect(validateFileSignature(pdf, "business-asset")).resolves.toEqual({
      mimeType: "application/pdf",
      extension: "pdf",
    });
  });

  it("recognizes audition audio and MP4 containers by signature", async () => {
    await expect(validateFileSignature(blob("ID3audio"), "audition-attachment")).resolves.toEqual({ mimeType: "audio/mpeg", extension: "mp3" });
    await expect(validateFileSignature(blob([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]), "audition-attachment")).resolves.toEqual({ mimeType: "video/mp4", extension: "mp4" });
  });

  it("accepts WebM only for hero clips", async () => {
    const webm = blob([0x1a, 0x45, 0xdf, 0xa3, ...Array.from("webm", (character) => character.charCodeAt(0))]);
    await expect(validateFileSignature(webm, "hero-video")).resolves.toEqual({ mimeType: "video/webm", extension: "webm" });
    await expect(validateFileSignature(webm, "public-image")).resolves.toBeNull();
  });

  it("rejects evidence images whose decoded dimensions exceed the pixel budget", async () => {
    const safe = new Blob([await sharp({
      create: { width: 16, height: 16, channels: 3, background: "white" },
    }).png().toBuffer()]);
    const oversizedHeader = new Uint8Array(await sharp({
      create: { width: 1, height: 1, channels: 3, background: "white" },
    }).png().toBuffer());
    new DataView(oversizedHeader.buffer).setUint32(16, 20_000);
    new DataView(oversizedHeader.buffer).setUint32(20, 20_000);

    await expect(validateFileSignature(safe, "protect-evidence")).resolves.toEqual({ mimeType: "image/png", extension: "png" });
    await expect(validateFileSignature(new Blob([oversizedHeader]), "protect-evidence")).resolves.toBeNull();
  });
});

describe("extensionMatches", () => {
  it("handles JPEG aliases and rejects misleading extensions", () => {
    expect(extensionMatches("cover.jpeg", "jpg")).toBe(true);
    expect(extensionMatches("deck.exe", "pdf")).toBe(false);
  });
});

describe("boundedFileName", () => {
  it("removes control/path characters and caps display metadata", () => {
    expect(boundedFileName(`${"a".repeat(300)}.pdf`)).toHaveLength(255);
    expect(boundedFileName("folder\\\u0000/file.pdf")).toBe("folder__file.pdf");
  });
});
