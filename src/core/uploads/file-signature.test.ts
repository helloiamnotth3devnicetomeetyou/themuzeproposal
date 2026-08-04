// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
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

  it("accepts only presentation-shaped OLE and OOXML files for contact attachments", async () => {
    const pptName = Array.from("PowerPoint Document").flatMap((character) => [character.charCodeAt(0), 0]);
    const ppt = blob([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, ...pptName]);
    const pptx = blob("PK\u0003\u0004payload/[Content_Types].xml/ppt/presentation.xml");
    const genericZip = blob("PK\u0003\u0004payload/[Content_Types].xml/word/document.xml");

    await expect(validateFileSignature(ppt, "contact-attachment")).resolves.toEqual({
      mimeType: "application/vnd.ms-powerpoint",
      extension: "ppt",
    });
    await expect(validateFileSignature(pptx, "contact-attachment")).resolves.toEqual({
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      extension: "pptx",
    });
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
});

describe("extensionMatches", () => {
  it("handles JPEG aliases and rejects misleading extensions", () => {
    expect(extensionMatches("cover.jpeg", "jpg")).toBe(true);
    expect(extensionMatches("deck.pdf", "pptx")).toBe(false);
  });
});
