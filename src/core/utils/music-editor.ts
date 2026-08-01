export type EditorTab = "basic" | "content" | "tracks" | "gallery" | "publish";

export type TrackDraft = {
  id: string;
  title: string;
  title_ko: string;
  title_en: string;
  title_ja: string;
  is_title: boolean;
  spotify_url: string;
  youtube_url: string;
  audio_url: string;
  music_video_url: string;
};

export type AlbumEditorDraft = {
  id: string;
  artist_id: string;
  title: string;
  title_ko: string;
  title_en: string;
  title_ja: string;
  type: string;
  release_date: string;
  cover_url: string;
  hero_image_url: string;
  typo_logo_url: string;
  color: string;
  spotify_id: string;
  youtube_url: string;
  description_ko: string;
  description_en: string;
  description_ja: string;
  is_published: boolean;
  published_at: string | null;
  sort_order: number;
  tracks: TrackDraft[];
};

export type AlbumValidationResult = {
  canSave: boolean;
  canPublish: boolean;
  saveIssues: string[];
  publishIssues: string[];
};

export type UploadedAsset = {
  bucket: "album-covers" | "track-assets" | "artist-assets" | "business-assets";
  path: string;
  url: string;
};

export const ALBUM_TYPES = ["Single", "Digital Single", "Mini Album", "Full Album", "OST"];


export function parseBulkTracks(value: string): TrackDraft[] {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const stripped = line.replace(/^\s*\d+\s*[.)-]\s*/, "");
    return {
      id: crypto.randomUUID(),
      title: stripped,
      title_ko: stripped,
      title_en: "",
      title_ja: "",
      is_title: false,
      spotify_url: "",
      youtube_url: "",
      audio_url: "",
      music_video_url: "",
    };
  });
}

export function validateAlbum(draft: AlbumEditorDraft): AlbumValidationResult {
  const saveIssues: string[] = [];
  if (!draft.title.trim()) saveIssues.push("앨범 제목");
  if (!draft.type.trim()) saveIssues.push("앨범 종류");
  if (draft.tracks.some((track) => !track.title.trim())) saveIssues.push("모든 트랙의 곡명");

  const publishIssues = [...saveIssues];
  if (!draft.release_date) publishIssues.push("발매일");
  if (!draft.cover_url) publishIssues.push("앨범 커버");
  if (draft.tracks.length === 0) publishIssues.push("수록곡 1곡 이상");

  return {
    canSave: saveIssues.length === 0,
    canPublish: publishIssues.length === 0,
    saveIssues,
    publishIssues,
  };
}

export function managedAssetFromUrl(url: string): { bucket: string; path: string } | null {
  const match = url.match(/\/storage\/v1\/object\/public\/(album-covers|track-assets|artist-assets)\/(.+)$/);
  return match ? { bucket: match[1], path: decodeURIComponent(match[2]) } : null;
}
