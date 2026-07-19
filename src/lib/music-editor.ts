export type EditorTab = "basic" | "content" | "tracks" | "publish";

export type TrackDraft = {
  id: string;
  title: string;
  duration: number | null;
  is_title: boolean;
  spotify_url: string;
  audio_url: string;
  music_video_url: string;
  logo_url: string;
};

export type AlbumEditorDraft = {
  id: string;
  artist_id: string;
  slug: string;
  title: string;
  type: string;
  release_date: string;
  cover_url: string;
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
  bucket: "album-covers" | "track-assets";
  path: string;
  url: string;
};

export const ALBUM_TYPES = ["Single", "Digital Single", "Mini Album", "Full Album", "OST"];

export function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function parseDuration(value: string): number | null {
  const clean = value.trim();
  if (!clean) return null;
  if (/^\d+$/.test(clean)) return Number(clean);
  const match = clean.match(/^(\d+):([0-5]\d)$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function formatDuration(value: number | null) {
  if (value == null) return "";
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export function parseBulkTracks(value: string): TrackDraft[] {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const stripped = line.replace(/^\s*\d+\s*[.)-]\s*/, "");
    const parts = stripped.split("\t");
    const possibleDuration = parts.length > 1 ? parseDuration(parts.at(-1) ?? "") : null;
    const title = possibleDuration == null ? stripped : parts.slice(0, -1).join(" ").trim();
    return {
      id: crypto.randomUUID(),
      title,
      duration: possibleDuration,
      is_title: false,
      spotify_url: "",
      audio_url: "",
      music_video_url: "",
      logo_url: "",
    };
  });
}

export function validateAlbum(draft: AlbumEditorDraft): AlbumValidationResult {
  const saveIssues: string[] = [];
  if (!draft.title.trim()) saveIssues.push("앨범 제목");
  if (!draft.type.trim()) saveIssues.push("앨범 종류");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) saveIssues.push("올바른 URL ID");
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
  const match = url.match(/\/storage\/v1\/object\/public\/(album-covers|track-assets)\/(.+)$/);
  return match ? { bucket: match[1], path: decodeURIComponent(match[2]) } : null;
}
