import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import type { AlbumEditorDraft, TrackDraft } from "@/core/utils/music-editor";

type RawTrack = {
  id: string;
  title: string;
  title_ko: string | null;
  title_en: string | null;
  title_ja: string | null;
  is_title: boolean;
  track_number: number;
  spotify_url: string | null;
  youtube_url: string | null;
  audio_url: string | null;
  music_video_url: string | null;
};

export type RawAlbum = {
  id: string;
  artist_id: string;
  title: string;
  title_ko: string | null;
  title_en: string | null;
  title_ja: string | null;
  type: string;
  release_date: string | null;
  cover_url: string | null;
  hero_image_url: string | null;
  typo_logo_url: string | null;
  color: string;
  spotify_id: string | null;
  youtube_url: string | null;
  description_ko: string | null;
  description_en: string | null;
  description_ja: string | null;
  is_published: boolean;
  published_at: string | null;
  sort_order: number;
  tracks: RawTrack[] | null;
};

export const albumSelect =
  "id,artist_id,title,title_ko,title_en,title_ja,type,release_date,cover_url,hero_image_url,typo_logo_url,color,spotify_id,youtube_url,description_ko,description_en,description_ja,is_published,published_at,sort_order,tracks(id,title,title_ko,title_en,title_ja,is_title,track_number,spotify_url,youtube_url,audio_url,music_video_url)";
export const legacyAlbumSelect =
  "id,artist_id,title,type,release_date,cover_url,hero_image_url,color,spotify_id,youtube_url,description_ko,description_en,description_ja,is_published,published_at,sort_order,tracks(id,title,is_title,track_number,spotify_url,youtube_url,audio_url,music_video_url)";

export function filterAlbums(
  albums: AlbumEditorDraft[],
  search: string,
  filter: "all" | "published" | "draft",
) {
  const query = search.toLowerCase();
  return albums.filter(
    (album) =>
      `${album.title} ${album.type}`.toLowerCase().includes(query) &&
      (filter === "all" ||
        (filter === "published" ? album.is_published : !album.is_published)),
  );
}

export function albumToDraft(album: RawAlbum): AlbumEditorDraft {
  return {
    id: album.id,
    artist_id: album.artist_id,
    title: album.title,
    title_ko: album.title_ko ?? album.title,
    title_en: album.title_en ?? "",
    title_ja: album.title_ja ?? "",
    type: album.type,
    release_date: album.release_date ?? "",
    cover_url: album.cover_url ?? "",
    hero_image_url: album.hero_image_url ?? "",
    typo_logo_url: album.typo_logo_url ?? "",
    color: album.color || BRAND_PINK_HEX,
    spotify_id: album.spotify_id ?? "",
    youtube_url: album.youtube_url ?? "",
    description_ko: album.description_ko ?? "",
    description_en: album.description_en ?? "",
    description_ja: album.description_ja ?? "",
    is_published: album.is_published,
    published_at: album.published_at,
    sort_order: album.sort_order,
    tracks: [...(album.tracks ?? [])]
      .sort((a, b) => a.track_number - b.track_number)
      .map((track) => ({
        id: track.id,
        title: track.title,
        title_ko: track.title_ko ?? track.title,
        title_en: track.title_en ?? "",
        title_ja: track.title_ja ?? "",
        is_title: track.is_title,
        spotify_url: track.spotify_url ?? "",
        youtube_url: track.youtube_url ?? "",
        audio_url: track.audio_url ?? "",
        music_video_url: track.music_video_url ?? "",
      })),
  };
}

export function createAlbumDraft(
  artistId: string,
  sortOrder: number,
): AlbumEditorDraft {
  return {
    id: crypto.randomUUID(),
    artist_id: artistId,
    title: "",
    title_ko: "",
    title_en: "",
    title_ja: "",
    type: "Mini Album",
    release_date: "",
    cover_url: "",
    hero_image_url: "",
    typo_logo_url: "",
    color: BRAND_PINK_HEX,
    spotify_id: "",
    youtube_url: "",
    description_ko: "",
    description_en: "",
    description_ja: "",
    is_published: false,
    published_at: null,
    sort_order: sortOrder,
    tracks: [],
  };
}

export function createTrackDraft(): TrackDraft {
  return {
    id: crypto.randomUUID(),
    title: "",
    title_ko: "",
    title_en: "",
    title_ja: "",
    is_title: false,
    spotify_url: "",
    youtube_url: "",
    audio_url: "",
    music_video_url: "",
  };
}

export function collectAssetUrls(draft: AlbumEditorDraft) {
  return new Set(
    [
      draft.cover_url,
      draft.hero_image_url,
      draft.typo_logo_url,
      ...draft.tracks.flatMap((track) => [
        track.audio_url,
        track.music_video_url,
      ]),
    ].filter(Boolean),
  );
}
