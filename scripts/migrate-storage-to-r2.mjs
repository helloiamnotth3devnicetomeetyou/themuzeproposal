/**
 * migrate-storage-to-r2.mjs
 *
 * Copies every object out of the 8 Supabase Storage buckets into the two R2 buckets,
 * keyed as `<supabase-bucket-name>/<path>`. Supabase objects are left untouched so the
 * migration is safe to re-run and easy to roll back from.
 *
 * Usage:
 *   node scripts/migrate-storage-to-r2.mjs               # dry run (default)
 *   node scripts/migrate-storage-to-r2.mjs --apply
 *   node scripts/migrate-storage-to-r2.mjs --apply --bucket=artist-assets
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(filePath) {
  try {
    const text = readFileSync(filePath, "utf-8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* .env.local missing is fine in CI */
  }
}

loadEnv(resolve(__dirname, "../.env.local"));

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const BUCKET_FILTER = args
  .find((arg) => arg.startsWith("--bucket="))
  ?.slice("--bucket=".length);
const CONCURRENCY = 8;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET;
const R2_PRIVATE_BUCKET = process.env.R2_PRIVATE_BUCKET;

for (const [name, value] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_ROLE_KEY,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_PUBLIC_BUCKET,
  R2_PRIVATE_BUCKET,
})) {
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

const PUBLIC_BUCKETS = [
  "artist-assets",
  "album-covers",
  "track-assets",
  "business-assets",
  "hero-videos",
];
const PRIVATE_BUCKETS = [
  "contact-attachments",
  "protect-evidence",
  "audition-attachments",
];
const ALL_BUCKETS = [...PUBLIC_BUCKETS, ...PRIVATE_BUCKETS];
const buckets = BUCKET_FILTER
  ? ALL_BUCKETS.filter((bucket) => bucket === BUCKET_FILTER)
  : ALL_BUCKETS;
if (BUCKET_FILTER && !buckets.length) {
  console.error(`Unknown bucket: ${BUCKET_FILTER}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function r2BucketFor(supabaseBucket) {
  return PRIVATE_BUCKETS.includes(supabaseBucket)
    ? R2_PRIVATE_BUCKET
    : R2_PUBLIC_BUCKET;
}

// The legacy business-assets bucket was public before it was hardened. Only
// documented public asset paths may be copied into the public R2 bucket.
const BUSINESS_ASSET_PATH =
  /^(?:press-kit\.zip|profile\.pdf|press-kit\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.zip|profile\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf)$/i;

function isSafeLegacyPath(bucket, filePath) {
  return bucket !== "business-assets" || BUSINESS_ASSET_PATH.test(filePath);
}

async function listAllFiles(bucket, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error)
      throw new Error(`list failed [${bucket}/${prefix}]: ${error.message}`);
    for (const item of data ?? []) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null)
        files.push(...(await listAllFiles(bucket, itemPath)));
      else
        files.push({
          path: itemPath,
          size: item.metadata?.size ?? 0,
          contentType: item.metadata?.mimetype,
        });
    }
    if (!data || data.length < 1000) break;
  }
  return files;
}

async function objectAlreadyExists(bucket, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode ?? error?.statusCode;
    if (
      status === 404 ||
      error?.name === "NotFound" ||
      error?.name === "NoSuchKey"
    ) {
      return false;
    }
    throw new Error(
      `head failed [${bucket}/${key}]: ${error?.message ?? String(error)}`,
      { cause: error },
    );
  }
}

async function copyFile(supabaseBucket, file) {
  const key = `${supabaseBucket}/${file.path}`;
  const r2Bucket = r2BucketFor(supabaseBucket);

  if (await objectAlreadyExists(r2Bucket, key)) return { status: "skipped" };
  if (!APPLY) return { status: "dry-run" };

  const { data: blob, error } = await supabase.storage
    .from(supabaseBucket)
    .download(file.path);
  if (error || !blob)
    throw new Error(`download failed: ${error?.message ?? "empty response"}`);
  const body = new Uint8Array(await blob.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: r2Bucket,
      Key: key,
      Body: body,
      ContentType: file.contentType || blob.type || "application/octet-stream",
      CacheControl: PRIVATE_BUCKETS.includes(supabaseBucket)
        ? undefined
        : "public, max-age=31536000, immutable",
    }),
  );
  return { status: "copied", bytes: body.byteLength };
}

async function runWithConcurrency(items, limit, worker) {
  const results = [];
  let index = 0;
  async function next() {
    while (index < items.length) {
      const current = index++;
      results[current] = await worker(items[current], current).catch(
        (error) => ({ status: "error", error, item: items[current] }),
      );
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, next),
  );
  return results;
}

async function main() {
  console.log("=".repeat(62));
  console.log("  Supabase Storage -> Cloudflare R2 migration");
  console.log(
    `  Mode: ${APPLY ? "APPLY (writing to R2)" : "DRY RUN (no writes)"}`,
  );
  console.log(`  Buckets: ${buckets.join(", ")}`);
  console.log("=".repeat(62));

  const failures = [];
  let totalCopied = 0;
  let totalSkipped = 0;
  let totalBytes = 0;

  for (const bucket of buckets) {
    console.log(`\n[${bucket}] listing objects...`);
    const files = await listAllFiles(bucket);
    console.log(`[${bucket}] ${files.length} objects found`);
    const migratableFiles = files.filter(({ path }) =>
      isSafeLegacyPath(bucket, path),
    );
    const skippedUnsafe = files.length - migratableFiles.length;
    if (skippedUnsafe) {
      console.warn(
        `[${bucket}] skipped ${skippedUnsafe} legacy object(s) outside the public allowlist`,
      );
    }

    const results = await runWithConcurrency(
      migratableFiles,
      CONCURRENCY,
      (file) => copyFile(bucket, file),
    );
    for (const [i, result] of results.entries()) {
      if (result.status === "copied") {
        totalCopied++;
        totalBytes += result.bytes;
      } else if (result.status === "skipped" || result.status === "dry-run")
        totalSkipped++;
      else if (result.status === "error") {
        failures.push({
          bucket,
          path: migratableFiles[i].path,
          message: result.error?.message ?? String(result.error),
        });
        console.error(
          `[${bucket}] FAILED ${migratableFiles[i].path}: ${result.error?.message ?? result.error}`,
        );
      }
    }
    totalSkipped += skippedUnsafe;
  }

  console.log("\n" + "=".repeat(62));
  console.log(
    `  Copied: ${totalCopied}  Skipped/dry-run: ${totalSkipped}  Failed: ${failures.length}`,
  );
  console.log(
    `  Bytes transferred: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log("=".repeat(62));

  if (failures.length) {
    const outFile = resolve(
      __dirname,
      "../migrate-storage-to-r2.failures.json",
    );
    writeFileSync(outFile, `${JSON.stringify(failures, null, 2)}\n`);
    console.error(`Wrote failure list to ${outFile}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
