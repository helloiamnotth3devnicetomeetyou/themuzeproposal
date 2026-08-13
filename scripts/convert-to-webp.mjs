/**
 * convert-to-webp.mjs
 *
 * R2의 이미지 에셋을 WebP로 변환하고,
 * DB의 URL 컬럼도 새 WebP URL로 일괄 업데이트합니다.
 *
 * 대상 버킷:
 *   album-covers  → albums.cover_url, albums.hero_image_url, albums.typo_logo_url, tracks.logo_url
 *   artist-assets → artists.logo_url, artists.image_url,
 *                   artist_members.image_url,
 *                   artist_scenes.image_url,
 *                   artist_scene_members.mask_url,
 *                   artist_gallery.image_url
 *
 * 사용법:
 *   node scripts/convert-to-webp.mjs
 *   node scripts/convert-to-webp.mjs --dry-run          # 변경 없이 미리보기
 *   node scripts/convert-to-webp.mjs --bucket album-covers
 *
 * 원본은 기본적으로 보존합니다. 변환 대상과 같은 stem의 WebP가 이미 있으면
 * 덮어쓰지 않고 실패로 기록합니다.
 */

import { createClient } from "@supabase/supabase-js";
import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── 환경 변수 로드 ─────────────────────────────────────────────────────────────
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
    /* .env.local 없으면 무시 */
  }
}

loadEnv(resolve(__dirname, "../.env.local"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(
  /\/+$/,
  "",
);
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET;

if (
  !SUPABASE_URL ||
  !SERVICE_ROLE_KEY ||
  !R2_PUBLIC_URL ||
  !R2_ACCOUNT_ID ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_PUBLIC_BUCKET
) {
  console.error("❌  Supabase DB 또는 R2 환경 변수가 없습니다.");
  process.exit(1);
}

// ── CLI 옵션 ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const BUCKET_FILTER = (() => {
  const inline = args.find((arg) => arg.startsWith("--bucket="));
  if (inline) return inline.slice("--bucket=".length);
  const idx = args.indexOf("--bucket");
  return idx !== -1 ? args[idx + 1] : null;
})();

// ── 설정 ──────────────────────────────────────────────────────────────────────
const IMAGE_BUCKETS = ["album-covers", "artist-assets"];

if (BUCKET_FILTER && !IMAGE_BUCKETS.includes(BUCKET_FILTER)) {
  throw new Error(
    `알 수 없는 버킷: ${BUCKET_FILTER} (허용: ${IMAGE_BUCKETS.join(", ")})`,
  );
}

const CONVERTIBLE_EXTS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".tiff",
  ".tif",
  ".bmp",
  ".avif",
  ".heic",
  ".heif",
]);

const WEBP_OPTIONS = { quality: 85, effort: 4 };

/**
 * 버킷별 DB 업데이트 대상 정의
 * { table, column } 형태 — 해당 컬럼에서 구 URL을 찾아 새 URL로 교체
 */
const BUCKET_DB_TARGETS = {
  "album-covers": [
    { table: "albums", column: "cover_url" },
    { table: "albums", column: "hero_image_url" },
    { table: "albums", column: "typo_logo_url" },
    { table: "tracks", column: "logo_url" },
  ],
  "artist-assets": [
    { table: "artists", column: "logo_url" },
    { table: "artists", column: "image_url" },
    { table: "artist_members", column: "image_url" },
    { table: "artist_scenes", column: "image_url" },
    { table: "artist_scene_members", column: "mask_url" },
    { table: "artist_gallery", column: "image_url" },
  ],
};

// ── Supabase 클라이언트 ────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ── 유틸 ──────────────────────────────────────────────────────────────────────
function extOf(name) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

function toWebpPath(storagePath) {
  const dot = storagePath.lastIndexOf(".");
  const base = dot === -1 ? storagePath : storagePath.slice(0, dot);
  return `${base}.webp`;
}

function storageUrl(bucket, path) {
  return `${R2_PUBLIC_URL}/${bucket}/${path}`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

// ── 파일 목록 재귀 조회 ────────────────────────────────────────────────────────
async function listAllFiles(bucket, prefix = "") {
  const files = [];
  let token;
  do {
    const page = await r2.send(
      new ListObjectsV2Command({
        Bucket: R2_PUBLIC_BUCKET,
        Prefix: `${bucket}/${prefix}`,
        ContinuationToken: token,
      }),
    );
    files.push(
      ...(page.Contents ?? []).map(({ Key }) => ({
        path: Key.slice(`${bucket}/`.length),
      })),
    );
    token = page.NextContinuationToken;
  } while (token);
  return files;
}

async function objectExists(key) {
  try {
    await r2.send(
      new HeadObjectCommand({
        Bucket: R2_PUBLIC_BUCKET,
        Key: key,
      }),
    );
    return true;
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode ?? error?.statusCode;
    if (
      status === 404 ||
      error?.name === "NotFound" ||
      error?.name === "NoSuchKey"
    )
      return false;
    throw error;
  }
}

// ── DB URL 업데이트 ────────────────────────────────────────────────────────────
async function updateDbUrls(bucket, oldPath, newPath) {
  const oldUrl = storageUrl(bucket, oldPath);
  const newUrl = storageUrl(bucket, newPath);

  if (oldUrl === newUrl) return { updated: 0 };

  const targets = BUCKET_DB_TARGETS[bucket] ?? [];
  let updated = 0;

  for (const { table, column } of targets) {
    const { data, error } = await supabase
      .from(table)
      .update({ [column]: newUrl })
      .eq(column, oldUrl)
      .select("id");

    if (error) {
      throw new Error(
        `DB 업데이트 실패 (${table}.${column}): ${error.message}`,
      );
    } else if (data && data.length > 0) {
      updated += data.length;
      console.log(`    📝 DB: ${table}.${column} × ${data.length}건 업데이트`);
    }
  }

  return { updated, oldUrl, newUrl };
}

// ── 단일 파일 변환 ─────────────────────────────────────────────────────────────
async function convertFile(bucket, filePath) {
  const webpPath = toWebpPath(filePath);
  const webpKey = `${bucket}/${webpPath}`;
  if (await objectExists(webpKey)) {
    throw new Error(`target already exists; refusing to overwrite: ${webpKey}`);
  }

  // 1) 다운로드
  const downloaded = await r2.send(
    new GetObjectCommand({
      Bucket: R2_PUBLIC_BUCKET,
      Key: `${bucket}/${filePath}`,
    }),
  );
  if (!downloaded.Body) throw new Error("다운로드 실패: 빈 응답");
  const inputBuffer = Buffer.from(await downloaded.Body.transformToByteArray());

  // 2) WebP 변환
  const outputBuffer = await sharp(inputBuffer).webp(WEBP_OPTIONS).toBuffer();

  // 3) 업로드
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_PUBLIC_BUCKET,
      Key: `${bucket}/${webpPath}`,
      Body: outputBuffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  // 4) DB URL 업데이트
  await updateDbUrls(bucket, filePath, webpPath);

  return {
    originalSize: inputBuffer.byteLength,
    webpSize: outputBuffer.byteLength,
    webpPath,
  };
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
async function main() {
  const buckets = BUCKET_FILTER ? [BUCKET_FILTER] : IMAGE_BUCKETS;

  console.log("=".repeat(62));
  console.log("  R2 이미지 → WebP 변환 + DB URL 업데이트");
  console.log("=".repeat(62));
  console.log(`  대상 버킷: ${buckets.join(", ")}`);
  console.log(`  Storage : ${R2_PUBLIC_URL}`);
  console.log(
    `  모드     : ${DRY_RUN ? "🔍 DRY RUN (변경 없음)" : "🚀 실제 변환"}`,
  );
  console.log("=".repeat(62));
  console.log();

  let totalConverted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let totalSavedBytes = 0;
  let totalDbRows = 0;

  for (const bucket of buckets) {
    console.log(`\n📦 버킷: ${bucket}`);
    console.log("-".repeat(42));

    let files;
    try {
      files = await listAllFiles(bucket);
    } catch (err) {
      console.error(`  ❌  파일 목록 조회 실패: ${err.message}`);
      totalErrors++;
      continue;
    }

    const imageFiles = files.filter((f) => CONVERTIBLE_EXTS.has(extOf(f.path)));
    const alreadyWebp = files.filter((f) => extOf(f.path) === ".webp");

    console.log(`  전체 파일 : ${files.length}개`);
    console.log(`  변환 대상 : ${imageFiles.length}개`);
    console.log(`  이미 WebP : ${alreadyWebp.length}개`);

    if (imageFiles.length === 0) {
      console.log("  ✅ 변환할 파일이 없습니다.");
      continue;
    }

    console.log();

    for (const file of imageFiles) {
      const webpPath = toWebpPath(file.path);

      if (DRY_RUN) {
        console.log(`  🔍 ${file.path}`);
        console.log(`      → ${webpPath}`);
        console.log(
          `      DB: ${(BUCKET_DB_TARGETS[bucket] ?? []).map((t) => `${t.table}.${t.column}`).join(", ")}`,
        );
        totalSkipped++;
        continue;
      }

      try {
        const result = await convertFile(bucket, file.path);
        const saved = result.originalSize - result.webpSize;
        const ratio = ((saved / result.originalSize) * 100).toFixed(1);
        if (saved > 0) totalSavedBytes += saved;
        totalConverted++;

        const saveLine =
          saved >= 0
            ? `(${ratio}% 절감)`
            : `(+${formatBytes(-saved)} 증가 — 원본이 더 작음)`;

        console.log(
          `  ✅ ${file.path}\n` +
            `      → ${result.webpPath}\n` +
            `      ${formatBytes(result.originalSize)} → ${formatBytes(result.webpSize)}  ${saveLine}`,
        );
      } catch (err) {
        console.error(`  ❌ ${file.path}: ${err.message}`);
        totalErrors++;
      }
    }
  }

  console.log();
  console.log("=".repeat(62));
  console.log("  완료 요약");
  console.log("=".repeat(62));

  if (DRY_RUN) {
    console.log(
      `  🔍 DRY RUN 완료 — 실제 변환 없이 ${totalSkipped}개 파일 탐색`,
    );
  } else {
    console.log(`  ✅ 변환 성공   : ${totalConverted}개`);
    console.log(`  ❌ 오류        : ${totalErrors}개`);
    if (totalSavedBytes > 0) {
      console.log(`  💾 총 용량 절감 : ${formatBytes(totalSavedBytes)}`);
    }
  }

  console.log("=".repeat(62));

  if (totalErrors > 0) process.exit(1);
}

main().catch((err) => {
  console.error("예기치 않은 오류:", err);
  process.exit(1);
});
