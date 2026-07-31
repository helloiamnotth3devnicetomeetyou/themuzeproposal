/**
 * convert-to-webp.mjs
 *
 * Supabase Storage의 이미지 에셋을 WebP로 변환하고,
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
 */

import { createClient } from "@supabase/supabase-js";
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
  } catch { /* .env.local 없으면 무시 */ }
}

loadEnv(resolve(__dirname, "../.env.local"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL
  ?? `${SUPABASE_URL}/storage/v1/object/public`;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 없습니다.");
  process.exit(1);
}

// ── CLI 옵션 ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const BUCKET_FILTER = (() => {
  const idx = args.indexOf("--bucket");
  return idx !== -1 ? args[idx + 1] : null;
})();

// ── 설정 ──────────────────────────────────────────────────────────────────────
const IMAGE_BUCKETS = ["album-covers", "artist-assets"];

const CONVERTIBLE_EXTS = new Set([
  ".jpg", ".jpeg", ".png", ".gif",
  ".tiff", ".tif", ".bmp",
  ".avif", ".heic", ".heif",
]);

const WEBP_OPTIONS = { quality: 85, effort: 4 };

/**
 * 버킷별 DB 업데이트 대상 정의
 * { table, column } 형태 — 해당 컬럼에서 구 URL을 찾아 새 URL로 교체
 */
const BUCKET_DB_TARGETS = {
  "album-covers": [
    { table: "albums",  column: "cover_url" },
    { table: "albums",  column: "hero_image_url" },
    { table: "albums",  column: "typo_logo_url" },
    { table: "tracks",  column: "logo_url" },
  ],
  "artist-assets": [
    { table: "artists",               column: "logo_url" },
    { table: "artists",               column: "image_url" },
    { table: "artist_members",        column: "image_url" },
    { table: "artist_scenes",         column: "image_url" },
    { table: "artist_scene_members",  column: "mask_url" },
    { table: "artist_gallery",        column: "image_url" },
  ],
};

// ── Supabase 클라이언트 ────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
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
  return `${STORAGE_URL}/${bucket}/${path}`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

// ── 파일 목록 재귀 조회 ────────────────────────────────────────────────────────
async function listAllFiles(bucket, prefix = "") {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });

  if (error) throw new Error(`list 실패 [${bucket}/${prefix}]: ${error.message}`);
  if (!data) return [];

  const files = [];
  for (const item of data) {
    if (item.id === null) {
      // 가상 폴더
      const sub = await listAllFiles(bucket, prefix ? `${prefix}/${item.name}` : item.name);
      files.push(...sub);
    } else {
      files.push({ path: prefix ? `${prefix}/${item.name}` : item.name });
    }
  }
  return files;
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
      console.warn(`    ⚠️  DB 업데이트 실패 (${table}.${column}): ${error.message}`);
    } else if (data && data.length > 0) {
      updated += data.length;
      console.log(`    📝 DB: ${table}.${column} × ${data.length}건 업데이트`);
    }
  }

  return { updated, oldUrl, newUrl };
}

// ── 단일 파일 변환 ─────────────────────────────────────────────────────────────
async function convertFile(bucket, filePath) {
  // 1) 다운로드
  const { data: blob, error: dlErr } = await supabase.storage
    .from(bucket)
    .download(filePath);

  if (dlErr || !blob) {
    throw new Error(`다운로드 실패: ${dlErr?.message ?? "빈 응답"}`);
  }

  const inputBuffer = Buffer.from(await blob.arrayBuffer());

  // 2) WebP 변환
  const outputBuffer = await sharp(inputBuffer).webp(WEBP_OPTIONS).toBuffer();

  const webpPath = toWebpPath(filePath);

  // 3) 업로드
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(webpPath, outputBuffer, {
      contentType: "image/webp",
      upsert: true,
    });

  if (upErr) throw new Error(`업로드 실패: ${upErr.message}`);

  // 4) DB URL 업데이트
  await updateDbUrls(bucket, filePath, webpPath);

  // 5) 원본 파일 삭제 (경로가 달라진 경우만)
  if (webpPath !== filePath) {
    const { error: rmErr } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    if (rmErr) throw new Error(`원본 삭제 실패: ${rmErr.message}`);
  }

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
  console.log("  Supabase 이미지 → WebP 변환 + DB URL 업데이트");
  console.log("=".repeat(62));
  console.log(`  대상 버킷: ${buckets.join(", ")}`);
  console.log(`  Storage : ${STORAGE_URL}`);
  console.log(`  모드     : ${DRY_RUN ? "🔍 DRY RUN (변경 없음)" : "🚀 실제 변환"}`);
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
        console.log(`      DB: ${(BUCKET_DB_TARGETS[bucket] ?? []).map(t => `${t.table}.${t.column}`).join(", ")}`);
        totalSkipped++;
        continue;
      }

      try {
        const result = await convertFile(bucket, file.path);
        const saved = result.originalSize - result.webpSize;
        const ratio = ((saved / result.originalSize) * 100).toFixed(1);
        if (saved > 0) totalSavedBytes += saved;
        totalConverted++;

        const saveLine = saved >= 0
          ? `(${ratio}% 절감)`
          : `(+${formatBytes(-saved)} 증가 — 원본이 더 작음)`;

        console.log(
          `  ✅ ${file.path}\n` +
          `      → ${result.webpPath}\n` +
          `      ${formatBytes(result.originalSize)} → ${formatBytes(result.webpSize)}  ${saveLine}`
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
    console.log(`  🔍 DRY RUN 완료 — 실제 변환 없이 ${totalSkipped}개 파일 탐색`);
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
