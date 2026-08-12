import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { galleryAssetUrl } from "./gallery-asset-url.mjs";

const env = Object.fromEntries((await readFile(path.join(process.cwd(), ".env.local"), "utf8"))
  .split(/\r?\n/)
  .flatMap((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    return match ? [[match[1], match[2].replace(/^['"]|['"]$/g, "")]] : [];
  }));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

async function rows(table, select = "*") {
  const { data, error } = await supabase.from(table).select(select);
  if (error) throw error;
  return data;
}

const [albums, members, tracks, gallery, notices, schedules] = await Promise.all([
  rows("albums", "id,title,youtube_url"),
  rows("artist_members", "id,slug"),
  rows("tracks", "album_id,title,youtube_url,music_video_url"),
  rows("artist_gallery", "album_id,member_id,image_url,caption,is_published"),
  rows("notices", "id,date,title_en,title_ja,content_en,content_ja"),
  rows("artist_schedules", "id,title_en,title_ja,location_en,location_ja,link_url"),
]);

const albumsById = new Map(albums.map((album) => [album.id, album]));
const expectedVideos = [
  ["Pretty Girl", "Pretty Girl"], ["Runaway", "Runaway"], ["lip bomb", "Heart Drop"],
  ["lip bomb", "Bloom"], ["Heart Drop", "Heart Drop"], ["Dearest", "Deja Vu"],
  ["Glow Up", "Glow Up"], ["SCENEDROME", "LOVE ATTACK"], ["SCENEDROME", "Pinball"],
  ["Re:Scene", "UhUh"], ["Re:Scene", "YoYo"], ["YoYo", "YoYo"],
];
assert.equal(albums.filter((album) => album.youtube_url).length, 10, "every album needs a representative YouTube link");
for (const [albumTitle, trackTitle] of expectedVideos) {
  const track = tracks.find((item) => albumsById.get(item.album_id)?.title === albumTitle && item.title === trackTitle);
  assert(track?.youtube_url && track.music_video_url, `${albumTitle} / ${trackTitle} MV is missing`);
}
const albumIds = new Map(albums.map(({ title, id }) => [title, id]));
const memberIds = new Map(members.map(({ slug, id }) => [slug, id]));
const expectedGalleryPairs = new Set(albums.flatMap(({ id: albumId }) => members.map(({ id: memberId }) => `${albumId}:${memberId}`)));
const publishedGalleryPairs = new Map(gallery.filter(({ is_published }) => is_published).map((item) => [`${item.album_id}:${item.member_id}`, item]));
assert.equal(albumIds.size, 10, "10 albums are required");
assert.equal(memberIds.size, 5, "5 members are required");
for (const pair of expectedGalleryPairs) assert(publishedGalleryPairs.has(pair), `missing album/member gallery pair: ${pair}`);
assert.equal(notices.length, 12, "the curated notice set must contain 12 notices");
assert(notices.every((notice) => notice.title_en && notice.title_ja && notice.content_en && notice.content_ja), "every notice needs EN/JA content");
const importedSchedules = schedules.filter(({ id }) => id.startsWith("a1300000-"));
assert.equal(importedSchedules.length, 10, "10 official schedules are required");
assert(importedSchedules.every((item) => item.title_en && item.title_ja && item.location_en && item.location_ja && item.link_url), "official schedules need translations, location, and source link");
for (const pair of expectedGalleryPairs) {
  const imageUrl = publishedGalleryPairs.get(pair).image_url;
  const url = galleryAssetUrl(imageUrl, env.NEXT_PUBLIC_R2_PUBLIC_URL);
  const response = await fetch(url, { method: "HEAD", redirect: "error", signal: AbortSignal.timeout(10_000) });
  assert(response.ok && response.headers.get("content-type")?.startsWith("image/"), `unreachable image: ${imageUrl}`);
}

console.log("Verified official MV links, 50 album/member photos, 12 translated notices, and 10 translated schedules.");
