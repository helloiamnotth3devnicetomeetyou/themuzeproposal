export type HomeSlideDTO = {
  id: string;
  artistName: string;
  artistSlug: string;
  title: string;
  artistNames: { ko: string; en: string | null; ja: string | null };
  titles: { ko: string; en: string | null; ja: string | null };
  type: string;
  color: string | null;
  imageUrl: string;
  typoLogoUrl: string | null;
  spotifyId: string | null;
  youtubeUrl: string | null;
  videoUrl: string | null;
  descriptions: {
    ko: string;
    en: string;
    ja: string;
  };
};
