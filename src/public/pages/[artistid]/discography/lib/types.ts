import type { Locale } from "@/core/providers/LocaleContext";
import type { LocalizedText } from "@/core/i18n/localized";

export interface DiscographyData {
  artistNames: LocalizedText;
  artistName: string;
  albums: DiscographyAlbum[];
  members: DiscographyMember[];
  gallery: DiscographyGalleryItem[];
}

export interface DiscographyTrack {
  title: string;
  titles: LocalizedText;
  isTitle: boolean;
  spotifyUrl?: string;
  youtubeUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
}

export interface DiscographyMember {
  id: string;
  slug: string;
  name: string;
  names: LocalizedText;
  role?: string;
  roles: LocalizedText;
  imageUrl?: string;
  color: string;
  sortOrder: number;
}

export interface DiscographyGalleryItem {
  id: string;
  albumId?: string;
  memberId?: string;
  imageUrl: string;
  caption: string;
  sortOrder: number;
}

export interface DiscographyAlbum {
  id: string;
  title: string;
  titles: LocalizedText;
  type: string;
  releaseDate: string;
  cover: string;
  tracks: DiscographyTrack[];
  color: string;
  desc: Record<Locale, string>;
  titleImage?: string;
  typoLogoUrl?: string;
  links?: {
    youtube?: string;
    spotify?: string;
  };
}

export interface RawDiscographyAlbum {
  id: string;
  title: string;
  title_ko: string | null;
  title_en: string | null;
  title_ja: string | null;
  type: string;
  release_date: string | null;
  cover_url: string;
  hero_image_url: string | null;
  typo_logo_url: string | null;
  color: string | null;
  description_ko: string | null;
  description_en: string | null;
  description_ja: string | null;
  spotify_id: string | null;
  youtube_url: string | null;
  tracks: Array<{
    title: string;
    title_ko: string | null;
    title_en: string | null;
    title_ja: string | null;
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
