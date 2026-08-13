import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

const APPLY = process.argv.includes("--apply");
const FILTER = process.argv
  .find((argument) => argument.startsWith("--filter="))
  ?.slice("--filter=".length);
const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "output");

const SOURCES = [
  [
    "Pretty Girl",
    "pretty-girl",
    "woni",
    "WONI",
    "https://themuze.kr/prettygirl_",
    "https://cdn.imweb.me/thumbnail/20260721/281bb40e6b6b6.jpg",
  ],
  [
    "Pretty Girl",
    "pretty-girl",
    "liv",
    "LIV",
    "https://themuze.kr/prettygirl_",
    "https://cdn.imweb.me/thumbnail/20260721/1d0382690bd80.jpg",
  ],
  [
    "Pretty Girl",
    "pretty-girl",
    "minami",
    "MINAMI",
    "https://themuze.kr/prettygirl_",
    "https://cdn.imweb.me/thumbnail/20260721/8441346cf6c7d.jpg",
  ],
  [
    "Pretty Girl",
    "pretty-girl",
    "may",
    "MAY",
    "https://themuze.kr/prettygirl_",
    "https://cdn.imweb.me/thumbnail/20260721/d660bff87b1e7.jpg",
  ],
  [
    "Pretty Girl",
    "pretty-girl",
    "zena",
    "ZENA",
    "https://themuze.kr/prettygirl_",
    "https://cdn.imweb.me/thumbnail/20260721/9710fb92d7053.jpg",
  ],
  [
    "Runaway",
    "runaway",
    "woni",
    "WONI",
    "https://themuze.kr/Runaway_",
    "https://cdn.imweb.me/thumbnail/20260408/aa9d3b7f06548.jpg",
  ],
  [
    "Runaway",
    "runaway",
    "liv",
    "LIV",
    "https://themuze.kr/Runaway_",
    "https://cdn.imweb.me/thumbnail/20260408/ea2bd9391e58a.jpg",
  ],
  [
    "Runaway",
    "runaway",
    "minami",
    "MINAMI",
    "https://themuze.kr/Runaway_",
    "https://cdn.imweb.me/thumbnail/20260408/4a6902abd68fe.jpg",
  ],
  [
    "Runaway",
    "runaway",
    "may",
    "MAY",
    "https://themuze.kr/Runaway_",
    "https://cdn.imweb.me/thumbnail/20260408/d5371b9b05098.jpg",
  ],
  [
    "Runaway",
    "runaway",
    "zena",
    "ZENA",
    "https://themuze.kr/Runaway_",
    "https://cdn.imweb.me/thumbnail/20260408/3e91f3e6d4ed3.jpg",
  ],
  [
    "Glow Up",
    "glow-up",
    "woni",
    "WONI",
    "https://themuze.kr/glowup",
    "https://cdn.imweb.me/thumbnail/20250221/6042e0e29e1a0.jpg",
  ],
  [
    "Glow Up",
    "glow-up",
    "liv",
    "LIV",
    "https://themuze.kr/glowup",
    "https://cdn.imweb.me/thumbnail/20250221/78206e9226ba3.jpg",
  ],
  [
    "Glow Up",
    "glow-up",
    "minami",
    "MINAMI",
    "https://themuze.kr/glowup",
    "https://cdn.imweb.me/thumbnail/20250221/a47df389b6f0a.jpg",
  ],
  [
    "Glow Up",
    "glow-up",
    "may",
    "MAY",
    "https://themuze.kr/glowup",
    "https://cdn.imweb.me/thumbnail/20250221/ae7e0d5568de5.jpg",
  ],
  [
    "Glow Up",
    "glow-up",
    "zena",
    "ZENA",
    "https://themuze.kr/glowup",
    "https://cdn.imweb.me/thumbnail/20250221/e3a3fd7418070.jpg",
  ],
  [
    "SCENEDROME",
    "scenedrome",
    "woni",
    "WONI",
    "https://kpop.fandom.com/wiki/File:RESCENE_Woni_Scenedrome_concept_photo_1.png",
    "https://static.wikia.nocookie.net/kpop/images/7/7c/RESCENE_Woni_Scenedrome_concept_photo_1.png/revision/latest?cb=20240815212439",
  ],
  [
    "SCENEDROME",
    "scenedrome",
    "liv",
    "LIV",
    "https://kpop.fandom.com/wiki/File:RESCENE_Liv_Scenedrome_concept_photo_1.png",
    "https://static.wikia.nocookie.net/kpop/images/8/89/RESCENE_Liv_Scenedrome_concept_photo_1.png/revision/latest?cb=20240813155017",
  ],
  [
    "SCENEDROME",
    "scenedrome",
    "minami",
    "MINAMI",
    "https://kpop.fandom.com/wiki/File:RESCENE_Minami_Scenedrome_concept_photo_1.png",
    "https://static.wikia.nocookie.net/kpop/images/4/4d/RESCENE_Minami_Scenedrome_concept_photo_1.png/revision/latest?cb=20240813155012",
  ],
  [
    "SCENEDROME",
    "scenedrome",
    "may",
    "MAY",
    "https://kpop.fandom.com/wiki/File:RESCENE_May_Scenedrome_concept_photo_1.png",
    "https://static.wikia.nocookie.net/kpop/images/0/09/RESCENE_May_Scenedrome_concept_photo_1.png/revision/latest?cb=20240813155012",
  ],
  [
    "SCENEDROME",
    "scenedrome",
    "zena",
    "ZENA",
    "https://kpop.fandom.com/wiki/File:RESCENE_Zena_Scenedrome_concept_photo_1.png",
    "https://static.wikia.nocookie.net/kpop/images/6/60/RESCENE_Zena_Scenedrome_concept_photo_1.png/revision/latest?cb=20240815212512",
  ],
  [
    "Re:Scene",
    "re-scene",
    "woni",
    "WONI",
    "https://rescene.fandom.com/wiki/File:Woni_Re-Scene_Concept_Photo_1.jpg",
    "https://static.wikia.nocookie.net/rescene/images/f/fd/Woni_Re-Scene_Concept_Photo_1.jpg/revision/latest?cb=20240501082521",
  ],
  [
    "Re:Scene",
    "re-scene",
    "liv",
    "LIV",
    "https://rescene.fandom.com/wiki/File:Liv_Re-Scene_Concept_Photo_1.jpg",
    "https://static.wikia.nocookie.net/rescene/images/6/62/Liv_Re-Scene_Concept_Photo_1.jpg/revision/latest?cb=20240501082540",
  ],
  [
    "Re:Scene",
    "re-scene",
    "minami",
    "MINAMI",
    "https://rescene.fandom.com/wiki/File:Minami_Re-Scene_Concept_Photo_1.jpg",
    "https://static.wikia.nocookie.net/rescene/images/b/ba/Minami_Re-Scene_Concept_Photo_1.jpg/revision/latest?cb=20240501082546",
  ],
  [
    "Re:Scene",
    "re-scene",
    "may",
    "MAY",
    "https://rescene.fandom.com/wiki/File:May_Re-Scene_Concept_Photo_1.jpg",
    "https://static.wikia.nocookie.net/rescene/images/8/8e/May_Re-Scene_Concept_Photo_1.jpg/revision/latest?cb=20240501082601",
  ],
  [
    "Re:Scene",
    "re-scene",
    "zena",
    "ZENA",
    "https://rescene.fandom.com/wiki/File:Zena_Re-Scene_Concept_Photo_1.jpg",
    "https://static.wikia.nocookie.net/rescene/images/c/cc/Zena_Re-Scene_Concept_Photo_1.jpg/revision/latest?cb=20240501082612",
  ],
  [
    "YoYo",
    "yoyo",
    "woni",
    "WONI",
    "https://rescene.fandom.com/wiki/File:Woni_YOYO_Concept_Photo_1.jpeg",
    "https://static.wikia.nocookie.net/rescene/images/5/5c/Woni_YOYO_Concept_Photo_1.jpeg/revision/latest?cb=20240330002640",
  ],
  [
    "YoYo",
    "yoyo",
    "liv",
    "LIV",
    "https://rescene.fandom.com/wiki/File:Liv_YOYO_Concept_Photo_1.jpeg",
    "https://static.wikia.nocookie.net/rescene/images/e/eb/Liv_YOYO_Concept_Photo_1.jpeg/revision/latest?cb=20240330002656",
  ],
  [
    "YoYo",
    "yoyo",
    "minami",
    "MINAMI",
    "https://rescene.fandom.com/wiki/File:Minami_YOYO_Concept_Photo_1.jpeg",
    "https://static.wikia.nocookie.net/rescene/images/8/85/Minami_YOYO_Concept_Photo_1.jpeg/revision/latest?cb=20240330002656",
  ],
  [
    "YoYo",
    "yoyo",
    "may",
    "MAY",
    "https://rescene.fandom.com/wiki/File:May_YOYO_Concept_Photo_1.jpeg",
    "https://static.wikia.nocookie.net/rescene/images/2/2f/May_YOYO_Concept_Photo_1.jpeg/revision/latest?cb=20240330013400",
  ],
  [
    "YoYo",
    "yoyo",
    "zena",
    "ZENA",
    "https://rescene.fandom.com/wiki/File:Zena_YOYO_Concept_Photo_1.jpeg",
    "https://static.wikia.nocookie.net/rescene/images/9/9c/Zena_YOYO_Concept_Photo_1.jpeg/revision/latest?cb=20240330013415",
  ],
  [
    "Dearest",
    "dearest",
    "woni",
    "WONI",
    "https://kpop.fandom.com/wiki/File:RESCENE_Woni_Dearest_concept_photo_1.png",
    "https://static.wikia.nocookie.net/kpop/images/8/8f/RESCENE_Woni_Dearest_concept_photo_1.png/revision/latest?cb=20250619225339",
  ],
  [
    "Dearest",
    "dearest",
    "liv",
    "LIV",
    "https://kpop.fandom.com/wiki/File:RESCENE_Liv_Dearest_concept_photo_1.png",
    "https://static.wikia.nocookie.net/kpop/images/b/b8/RESCENE_Liv_Dearest_concept_photo_1.png/revision/latest?cb=20250619225315",
  ],
  [
    "Dearest",
    "dearest",
    "minami",
    "MINAMI",
    "https://kpop.fandom.com/wiki/File:RESCENE_Minami_Dearest_concept_photo_1.png",
    "https://static.wikia.nocookie.net/kpop/images/8/83/RESCENE_Minami_Dearest_concept_photo_1.png/revision/latest?cb=20250619225326",
  ],
  [
    "Dearest",
    "dearest",
    "may",
    "MAY",
    "https://kpop.fandom.com/wiki/File:RESCENE_May_Dearest_concept_photo_1.png",
    "https://static.wikia.nocookie.net/kpop/images/d/d8/RESCENE_May_Dearest_concept_photo_1.png/revision/latest?cb=20250619225400",
  ],
  [
    "Dearest",
    "dearest",
    "zena",
    "ZENA",
    "https://kpop.fandom.com/wiki/File:RESCENE_Zena_Dearest_concept_photo_1.png",
    "https://static.wikia.nocookie.net/kpop/images/1/12/RESCENE_Zena_Dearest_concept_photo_1.png/revision/latest?cb=20250619225345",
  ],
  [
    "lip bomb",
    "lip-bomb",
    "woni",
    "WONI",
    "https://kpop.fandom.com/wiki/File:RESCENE_Woni_Lip_Bomb_concept_photo_1.png",
    "https://static.wikia.nocookie.net/kpop/images/e/e7/RESCENE_Woni_Lip_Bomb_concept_photo_1.png/revision/latest?cb=20251103121713",
  ],
  [
    "lip bomb",
    "lip-bomb",
    "liv",
    "LIV",
    "https://kpop.fandom.com/wiki/File:RESCENE_Liv_Lip_Bomb_concept_photo_1.png",
    "https://static.wikia.nocookie.net/kpop/images/9/95/RESCENE_Liv_Lip_Bomb_concept_photo_1.png/revision/latest?cb=20251103121705",
  ],
  [
    "lip bomb",
    "lip-bomb",
    "minami",
    "MINAMI",
    "https://kpop.fandom.com/wiki/File:RESCENE_Minami_Lip_Bomb_concept_photo_1.png",
    "https://static.wikia.nocookie.net/kpop/images/d/d6/RESCENE_Minami_Lip_Bomb_concept_photo_1.png/revision/latest?cb=20251103121748",
  ],
  [
    "lip bomb",
    "lip-bomb",
    "may",
    "MAY",
    "https://kpop.fandom.com/wiki/File:RESCENE_May_Lip_Bomb_concept_photo_1.png",
    "https://static.wikia.nocookie.net/kpop/images/7/7d/RESCENE_May_Lip_Bomb_concept_photo_1.png/revision/latest?cb=20251103121914",
  ],
  [
    "lip bomb",
    "lip-bomb",
    "zena",
    "ZENA",
    "https://kpop.fandom.com/wiki/File:RESCENE_Zena_Lip_Bomb_concept_photo_1.png",
    "https://static.wikia.nocookie.net/kpop/images/c/cd/RESCENE_Zena_Lip_Bomb_concept_photo_1.png/revision/latest?cb=20251103121751",
  ],
  [
    "Heart Drop",
    "heart-drop",
    "woni",
    "WONI",
    "https://www.youtube.com/shorts/GdVef2GcS44",
    "https://i.ytimg.com/vi/GdVef2GcS44/maxresdefault.jpg",
  ],
  [
    "Heart Drop",
    "heart-drop",
    "liv",
    "LIV",
    "https://www.youtube.com/shorts/kg8R1uAOBU4",
    "https://i.ytimg.com/vi/kg8R1uAOBU4/maxresdefault.jpg",
  ],
  [
    "Heart Drop",
    "heart-drop",
    "minami",
    "MINAMI",
    "https://www.youtube.com/shorts/t5cQoNBKAxo",
    "https://i.ytimg.com/vi/t5cQoNBKAxo/maxresdefault.jpg",
  ],
  [
    "Heart Drop",
    "heart-drop",
    "may",
    "MAY",
    "https://www.youtube.com/shorts/DuiKrrkoRik",
    "https://i.ytimg.com/vi/DuiKrrkoRik/maxresdefault.jpg",
  ],
  [
    "Heart Drop",
    "heart-drop",
    "zena",
    "ZENA",
    "https://www.youtube.com/shorts/RkO-i76OOBA",
    "https://i.ytimg.com/vi/RkO-i76OOBA/maxresdefault.jpg",
  ],
].map(
  ([albumTitle, albumKey, memberSlug, memberLabel, sourcePage, sourceUrl]) => ({
    albumTitle,
    albumKey,
    memberSlug,
    memberLabel,
    sourcePage,
    sourceUrl,
  }),
);
const ALBUM_KEYS = new Set(SOURCES.map(({ albumKey }) => albumKey));
if (FILTER && !ALBUM_KEYS.has(FILTER)) {
  throw new Error(
    `Unknown filter: ${FILTER} (allowed: ${[...ALBUM_KEYS].join(", ")})`,
  );
}
const selectedSources = FILTER
  ? SOURCES.filter(({ albumKey }) => albumKey === FILTER)
  : SOURCES;

function envFile(source) {
  return Object.fromEntries(
    source.split(/\r?\n/).flatMap((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      return match ? [[match[1], match[2].replace(/^['"]|['"]$/g, "")]] : [];
    }),
  );
}

const env = {
  ...envFile(await readFile(path.join(ROOT, ".env.local"), "utf8")),
  ...process.env,
};
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const r2PublicUrl = env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "");
assert(
  url &&
    key &&
    env.R2_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_PUBLIC_BUCKET &&
    r2PublicUrl,
  "Supabase and R2 configuration are required",
);
assert.equal(
  new Set(
    SOURCES.map(({ albumKey, memberSlug }) => `${albumKey}:${memberSlug}`),
  ).size,
  SOURCES.length,
);

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});
const { data: artist, error: artistError } = await supabase
  .from("artists")
  .select("id")
  .eq("slug", "rescene")
  .single();
if (artistError) throw artistError;

await mkdir(OUTPUT, { recursive: true });
if (APPLY && !FILTER) {
  const backup = {};
  for (const table of [
    "albums",
    "tracks",
    "artist_gallery",
    "artist_schedules",
    "notices",
  ]) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw error;
    backup[table] = data;
  }
  await writeFile(
    path.join(OUTPUT, "themuze-pre-import-20260811.json"),
    `${JSON.stringify(backup, null, 2)}\n`,
  );
}

const manifest = [];
for (const source of selectedSources) {
  const response = await fetch(source.sourceUrl);
  if (!response.ok) throw new Error(`${response.status} ${source.sourceUrl}`);
  const original = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(original).metadata();
  assert(
    metadata.width && metadata.height,
    `Invalid image: ${source.sourceUrl}`,
  );
  const converted = await sharp(original)
    .rotate()
    .webp({ quality: 88 })
    .toBuffer();
  const storagePath = `${artist.id}/gallery/themuze/${source.albumKey}-${source.memberSlug}.webp`;
  if (APPLY) {
    await r2.send(
      new PutObjectCommand({
        Bucket: env.R2_PUBLIC_BUCKET,
        Key: `artist-assets/${storagePath}`,
        Body: converted,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  }
  manifest.push({
    ...source,
    storagePath,
    publicUrl: `${r2PublicUrl}/artist-assets/${storagePath}`,
    sourceSha256: createHash("sha256").update(original).digest("hex"),
    storedSha256: createHash("sha256").update(converted).digest("hex"),
    sourceBytes: original.length,
    storedBytes: converted.length,
    width: metadata.width,
    height: metadata.height,
  });
}

await writeFile(
  path.join(
    OUTPUT,
    `themuze-assets-manifest${FILTER ? `-${FILTER}` : ""}.json`,
  ),
  `${JSON.stringify({ applied: APPLY, retrievedAt: new Date().toISOString(), assets: manifest }, null, 2)}\n`,
);
console.log(
  `${APPLY ? "Uploaded" : "Validated"} ${manifest.length} official images.`,
);
