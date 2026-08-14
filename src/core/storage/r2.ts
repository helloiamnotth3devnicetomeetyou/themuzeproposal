import "server-only";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { NodeJsRuntimeStreamingBlobPayloadOutputTypes } from "@smithy/types";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PUBLIC_BUCKETS } from "./public-url";

const PRIVATE_BUCKETS = new Set([
  "contact-attachments",
  "protect-evidence",
  "audition-attachments",
]);
const KNOWN_BUCKETS = new Set([...PUBLIC_BUCKETS, ...PRIVATE_BUCKETS]);
const DELETE_CHUNK_SIZE = 1000;

let client: S3Client | null = null;

function getClient() {
  if (client) return client;
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey) return null;
  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
  return client;
}

/** Resolves a logical (bucket, path) pair, e.g. ("artist-assets", "foo/bar.png"), to the
 * physical R2 bucket + object key. Logical bucket names are kept as a key prefix so the
 * rest of the app can keep treating them as independent buckets. */
function resolveLocation(bucket: string, path: string) {
  if (!KNOWN_BUCKETS.has(bucket)) return null;
  const r2Bucket = PRIVATE_BUCKETS.has(bucket)
    ? process.env.R2_PRIVATE_BUCKET?.trim()
    : process.env.R2_PUBLIC_BUCKET?.trim();
  if (!r2Bucket) return null;
  return { r2Bucket, key: `${bucket}/${path.replace(/^\/+/, "")}` };
}

export async function uploadObject(options: {
  bucket: string;
  path: string;
  body: Blob | Uint8Array | Buffer;
  contentType: string;
  cacheControl?: string;
}): Promise<{ error: true } | { error: false }> {
  const s3 = getClient();
  const location = s3 && resolveLocation(options.bucket, options.path);
  if (!s3 || !location) return { error: true };
  try {
    const body =
      options.body instanceof Blob
        ? new Uint8Array(await options.body.arrayBuffer())
        : options.body;
    await s3.send(
      new PutObjectCommand({
        Bucket: location.r2Bucket,
        Key: location.key,
        Body: body,
        ContentType: options.contentType,
        CacheControl: options.cacheControl,
      }),
    );
    return { error: false };
  } catch {
    return { error: true };
  }
}

export async function createSignedUploadUrl(
  bucket: string,
  path: string,
  contentType: string,
  contentLength: number,
  expiresIn = 60,
): Promise<string | null> {
  const s3 = getClient();
  const location = s3 && resolveLocation(bucket, path);
  if (!s3 || !location) return null;
  try {
    return await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: location.r2Bucket,
        Key: location.key,
        ContentType: contentType,
        ContentLength: contentLength,
      }),
      { expiresIn },
    );
  } catch {
    return null;
  }
}

export async function getObjectForValidation(
  bucket: string,
  path: string,
  maxBytes: number,
): Promise<
  | {
      body: Uint8Array;
      contentType: string;
    }
  | { tooLarge: true }
  | null
> {
  const s3 = getClient();
  const location = s3 && resolveLocation(bucket, path);
  if (!s3 || !location) return null;
  try {
    const head = await s3.send(
      new HeadObjectCommand({ Bucket: location.r2Bucket, Key: location.key }),
    );
    if (!head.ContentLength || !head.ETag) return null;
    if (head.ContentLength > maxBytes) return { tooLarge: true };
    const object = await s3.send(
      new GetObjectCommand({
        Bucket: location.r2Bucket,
        Key: location.key,
        IfMatch: head.ETag,
      }),
    );
    const body = object.Body as
      NodeJsRuntimeStreamingBlobPayloadOutputTypes | undefined;
    return body
      ? {
          body: await body.transformToByteArray(),
          contentType: object.ContentType || head.ContentType || "",
        }
      : null;
  } catch {
    return null;
  }
}

export async function deleteObjects(
  bucket: string,
  paths: string[],
): Promise<{ error: true } | { error: false }> {
  const s3 = getClient();
  const location = s3 && resolveLocation(bucket, "");
  if (!s3 || !location || !paths.length)
    return { error: !s3 || !location };
  const keys = paths.map((path) => `${bucket}/${path.replace(/^\/+/, "")}`);
  for (let i = 0; i < keys.length; i += DELETE_CHUNK_SIZE) {
    const chunk = keys.slice(i, i + DELETE_CHUNK_SIZE);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
      const response = await s3.send(
        new DeleteObjectsCommand({
          Bucket: location.r2Bucket,
          Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
        }),
      );
        if (!response.Errors?.length) break;
      } catch {
        // Retry the common transient R2 failure once; callers still receive an error.
      }
      if (attempt === 1) return { error: true };
    }
  }
  return { error: false };
}

export async function createSignedDownloadUrl(
  bucket: string,
  path: string,
  expiresIn: number,
  downloadFileName?: string,
): Promise<string | null> {
  const s3 = getClient();
  const location = s3 && resolveLocation(bucket, path);
  if (!s3 || !location) return null;
  try {
    const command = new GetObjectCommand({
      Bucket: location.r2Bucket,
      Key: location.key,
      ResponseContentDisposition: downloadFileName
        ? `attachment; filename="${downloadFileName.replace(/["\\]/g, "_")}"`
        : undefined,
    });
    return await getSignedUrl(s3, command, { expiresIn });
  } catch {
    return null;
  }
}

export async function objectExists(
  bucket: string,
  path: string,
): Promise<boolean> {
  const s3 = getClient();
  const location = s3 && resolveLocation(bucket, path);
  if (!s3 || !location) return false;
  try {
    await s3.send(
      new HeadObjectCommand({ Bucket: location.r2Bucket, Key: location.key }),
    );
    return true;
  } catch {
    return false;
  }
}
