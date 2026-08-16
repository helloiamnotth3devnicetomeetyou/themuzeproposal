// @vitest-environment node
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  boundedFileName,
  extensionMatches,
  validateFileSignature,
} from "./file-signature";

function blob(bytes: number[] | string) {
  return new Blob([
    typeof bytes === "string"
      ? new TextEncoder().encode(bytes)
      : new Uint8Array(bytes),
  ]);
}

const MINIMAL_PDF =
  "%PDF-1.7\n1 0 obj\n<<>>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<< /Size 2 >>\nstartxref\n29\n%%EOF\n";

function validZip() {
  const bytes = new Uint8Array(109);
  const view = new DataView(bytes.buffer);
  const encoder = new TextEncoder();
  const write = (offset: number, value: string) =>
    bytes.set(encoder.encode(value), offset);
  const crc32 = 0xe8b7be43;
  write(0, "PK\x03\x04");
  view.setUint16(4, 20, true);
  view.setUint32(14, crc32, true);
  view.setUint32(18, 1, true);
  view.setUint32(22, 1, true);
  view.setUint16(26, 5, true);
  view.setUint16(28, 0, true);
  write(30, "a.txt");
  write(35, "a");
  const central = 36;
  write(central, "PK\x01\x02");
  view.setUint16(central + 4, 20, true);
  view.setUint16(central + 6, 20, true);
  view.setUint32(central + 16, crc32, true);
  view.setUint32(central + 20, 1, true);
  view.setUint32(central + 24, 1, true);
  view.setUint16(central + 28, 5, true);
  view.setUint32(central + 42, 0, true);
  write(central + 46, "a.txt");
  const eocd = 87;
  write(eocd, "PK\x05\x06");
  view.setUint16(eocd + 8, 1, true);
  view.setUint16(eocd + 10, 1, true);
  view.setUint32(eocd + 12, 51, true);
  view.setUint32(eocd + 16, central, true);
  return bytes;
}

describe("validateFileSignature", () => {
  it("recognizes raster images from bytes instead of the declared MIME type", async () => {
    const png = new Blob([
      await sharp({
        create: { width: 1, height: 1, channels: 4, background: "#000" },
      })
        .png()
        .toBuffer(),
    ]);
    const disguisedHtml = blob("<script>alert(1)</script>");

    await expect(validateFileSignature(png, "public-image")).resolves.toEqual({
      mimeType: "image/png",
      extension: "png",
    });
    await expect(
      validateFileSignature(disguisedHtml, "public-image"),
    ).resolves.toBeNull();
  });

  it("rejects active presentation formats for contact attachments", async () => {
    const pptName = Array.from("PowerPoint Document").flatMap((character) => [
      character.charCodeAt(0),
      0,
    ]);
    const ppt = blob([
      0xd0,
      0xcf,
      0x11,
      0xe0,
      0xa1,
      0xb1,
      0x1a,
      0xe1,
      ...pptName,
    ]);
    const pptx = blob(
      "PK\u0003\u0004payload/[Content_Types].xml/ppt/presentation.xml",
    );
    const genericZip = blob(
      "PK\u0003\u0004payload/[Content_Types].xml/word/document.xml",
    );

    await expect(
      validateFileSignature(ppt, "contact-attachment"),
    ).resolves.toBeNull();
    await expect(
      validateFileSignature(pptx, "contact-attachment"),
    ).resolves.toBeNull();
    await expect(
      validateFileSignature(genericZip, "contact-attachment"),
    ).resolves.toBeNull();
  });

  it("does not accept a valid file type in a profile that forbids it", async () => {
    const pdf = blob(MINIMAL_PDF);
    await expect(
      validateFileSignature(pdf, "protect-evidence"),
    ).resolves.toEqual({
      mimeType: "application/pdf",
      extension: "pdf",
    });
    await expect(
      validateFileSignature(pdf, "public-image"),
    ).resolves.toBeNull();
  });

  it("accepts structurally valid ZIP and PDF business assets", async () => {
    const zip = new Blob([validZip()]);
    const pdf = blob(MINIMAL_PDF);

    await expect(validateFileSignature(zip, "business-asset")).resolves.toEqual(
      {
        mimeType: "application/zip",
        extension: "zip",
      },
    );
    await expect(validateFileSignature(pdf, "business-asset")).resolves.toEqual(
      {
        mimeType: "application/pdf",
        extension: "pdf",
      },
    );
  });

  it("rejects malformed and PDF/ZIP polyglot documents", async () => {
    const malformed = blob("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n");
    const polyglot = blob(`${MINIMAL_PDF}PK\u0003\u0004payload`);

    await expect(
      validateFileSignature(malformed, "contact-attachment"),
    ).resolves.toBeNull();
    await expect(
      validateFileSignature(polyglot, "contact-attachment"),
    ).resolves.toBeNull();
  });

  it("rejects truncated ZIPs and ZIP entries outside safe bounds", async () => {
    const malformed = new Blob([validZip().slice(0, -1)]);
    const bomb = validZip();
    const view = new DataView(bomb.buffer);
    view.setUint32(22, 100_000_000, true);
    view.setUint32(36 + 24, 100_000_000, true);

    await expect(
      validateFileSignature(malformed, "business-asset"),
    ).resolves.toBeNull();
    await expect(
      validateFileSignature(new Blob([bomb]), "business-asset"),
    ).resolves.toBeNull();
  });

  it("recognizes audition audio and MP4 containers by signature", async () => {
    await expect(
      validateFileSignature(blob("ID3audio"), "audition-attachment"),
    ).resolves.toEqual({ mimeType: "audio/mpeg", extension: "mp3" });
    await expect(
      validateFileSignature(
        blob([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]),
        "audition-attachment",
      ),
    ).resolves.toEqual({ mimeType: "video/mp4", extension: "mp4" });
  });

  it("accepts MP4 only for hero clips", async () => {
    const mp4 = blob([
      0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
    ]);
    await expect(validateFileSignature(mp4, "hero-video")).resolves.toEqual({
      mimeType: "video/mp4",
      extension: "mp4",
    });
    await expect(
      validateFileSignature(mp4, "public-image"),
    ).resolves.toBeNull();
  });

  it("rejects evidence images whose decoded dimensions exceed the pixel budget", async () => {
    const safe = new Blob([
      await sharp({
        create: { width: 16, height: 16, channels: 3, background: "white" },
      })
        .png()
        .toBuffer(),
    ]);
    const oversizedHeader = new Uint8Array(
      await sharp({
        create: { width: 1, height: 1, channels: 3, background: "white" },
      })
        .png()
        .toBuffer(),
    );
    new DataView(oversizedHeader.buffer).setUint32(16, 20_000);
    new DataView(oversizedHeader.buffer).setUint32(20, 20_000);

    await expect(
      validateFileSignature(safe, "protect-evidence"),
    ).resolves.toEqual({ mimeType: "image/png", extension: "png" });
    await expect(
      validateFileSignature(new Blob([oversizedHeader]), "protect-evidence"),
    ).resolves.toBeNull();
    await expect(
      validateFileSignature(new Blob([oversizedHeader]), "public-image"),
    ).resolves.toBeNull();
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
