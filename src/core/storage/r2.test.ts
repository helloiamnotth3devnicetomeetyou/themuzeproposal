// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const send = vi.fn();
  return {
    send,
    client: vi.fn(function () {
      return { send };
    }),
    command: vi.fn(function (input: unknown) {
      return { input };
    }),
  };
});

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: mocks.client,
  DeleteObjectsCommand: mocks.command,
  GetObjectCommand: mocks.command,
  HeadObjectCommand: mocks.command,
  PutObjectCommand: mocks.command,
}));
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

import {
  contentDispositionForDownload,
  deleteObjects,
  uploadObject,
} from "./r2";

describe("deleteObjects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("R2_ACCOUNT_ID", "account");
    vi.stubEnv("R2_ACCESS_KEY_ID", "access");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "secret");
    vi.stubEnv("R2_PUBLIC_BUCKET", "public");
  });

  it("reports per-object S3 delete errors instead of claiming success", async () => {
    mocks.send.mockResolvedValue({
      Errors: [{ Key: "artist-assets/asset.png", Code: "AccessDenied" }],
    });

    await expect(
      deleteObjects("artist-assets", ["asset.png"]),
    ).resolves.toEqual({
      error: true,
    });
  });

  it("retries a transient delete failure before reporting success", async () => {
    mocks.send
      .mockRejectedValueOnce(new Error("temporary R2 failure"))
      .mockResolvedValueOnce({ Errors: [] });

    const result = await deleteObjects("artist-assets", ["asset.png"]);
    expect(result).toEqual({ error: false });
    expect(mocks.send).toHaveBeenCalledTimes(2);
  });

  it("reports an upload failure without claiming the object was stored", async () => {
    mocks.send.mockRejectedValueOnce(new Error("R2 unavailable"));

    await expect(
      uploadObject({
        bucket: "artist-assets",
        path: "asset.png",
        body: Buffer.from("not really an image"),
        contentType: "image/png",
      }),
    ).resolves.toEqual({ error: true });
  });

  it("rejects unknown buckets before issuing an S3 request", async () => {
    await expect(deleteObjects("unknown", ["asset.png"])).resolves.toEqual({
      error: true,
    });
    expect(mocks.send).not.toHaveBeenCalled();
  });
});

describe("contentDispositionForDownload", () => {
  it("adds an ASCII fallback and RFC 5987 filename for private downloads", () => {
    expect(contentDispositionForDownload("계약서, 최종\r\n본.pdf")).toBe(
      "attachment; filename=\"___, ___.pdf\"; filename*=UTF-8''%EA%B3%84%EC%95%BD%EC%84%9C%2C%20%EC%B5%9C%EC%A2%85%EB%B3%B8.pdf",
    );
  });
});
