import type { Locale } from "@/core/providers/LocaleContext";

export interface DiscographyTrack {
  title: string;
  isTitle: boolean;
  spotifyUrl?: string;
  youtubeUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
}

export interface DiscographyAlbum {
  id: string;
  title: string;
  type: string;
  releaseDate: string;
  cover: string;
  tracks: DiscographyTrack[];
  color: string;
  desc: Record<Locale, string>;
  titleImage?: string;
  links?: {
    youtube?: string;
    spotify?: string;
  };
}

export interface RawDiscographyAlbum {
  id: string;
  title: string;
  type: string;
  release_date: string | null;
  cover_url: string;
  hero_image_url: string | null;
  color: string | null;
  description_ko: string | null;
  description_en: string | null;
  description_ja: string | null;
  spotify_id: string | null;
  youtube_url: string | null;
  tracks: Array<{
    title: string;
    track_number: number;
    is_title: boolean;
    spotify_url: string | null;
    youtube_url: string | null;
    audio_url: string | null;
    music_video_url: string | null;
  }>;
}

export type PlaybackMemory = {
  albumId: string;
  trackIndex: number;
  currentTime: number;
};

export type DiscographyTab = "concept" | "intro" | "members";
export type AlbumSort = "date-desc" | "date-asc";
export type RailPhase = "idle" | "exit" | "enter";
export type SlideDirection = "left" | "right" | null;
