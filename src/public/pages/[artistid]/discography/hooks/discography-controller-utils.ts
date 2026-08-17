import type { AlbumPreviewPayload } from "@/core/preview/types";
import { safeHref } from "@/core/http/safe-href";
import { spotifyAlbumHref } from "@/core/http/spotify";
import type { DiscographyAlbum } from "@/public/features/discography/types";

export function previewToAlbum(
  preview: AlbumPreviewPayload | null,
): DiscographyAlbum | null {
  if (!preview) return null;
  return {
    id: preview.album.id,
    title: preview.album.title,
    titles: {
      ko: preview.album.title_ko ?? preview.album.title,
      en: preview.album.title_en,
      ja: preview.album.title_ja,
    },
    type: preview.album.type,
    releaseDate: preview.album.release_date,
    cover: preview.album.cover_url,
    titleImage: preview.album.hero_image_url || undefined,
    color: preview.album.color,
    tracks: preview.album.tracks.map((track) => ({
      id: track.id,
      title: track.title,
      titles: {
        ko: track.title_ko ?? track.title,
        en: track.title_en,
        ja: track.title_ja,
      },
      isTitle: track.is_title,
      spotifyUrl: safeHref(track.spotify_url),
      youtubeUrl: safeHref(track.youtube_url),
      audioUrl: safeHref(track.audio_url),
      videoUrl: safeHref(track.music_video_url),
    })),
    desc: {
      ko: preview.album.description_ko,
      en: preview.album.description_en,
      ja: preview.album.description_ja,
    },
    links: {
      spotify: spotifyAlbumHref(preview.album.spotify_id),
      youtube: safeHref(preview.album.youtube_url),
    },
  };
}
