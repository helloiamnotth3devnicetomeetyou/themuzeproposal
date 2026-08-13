// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const send = vi.fn();
  return {
    send,
    client: vi.fn(function () {
      return { send };
    }),
    command: vi.fn((input: unknown) => ({ input })),
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

import { deleteObjects } from "./r2";

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

  it("rejects unknown buckets before issuing an S3 request", async () => {
    await expect(deleteObjects("unknown", ["asset.png"])).resolves.toEqual({
      error: true,
    });
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
