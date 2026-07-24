export type HomeSlideDTO = {
  id: string;
  artistName: string;
  artistSlug: string;
  title: string;
  type: string;
  imageUrl: string;
  spotifyId: string | null;
  youtubeUrl: string | null;
  descriptions: {
    ko: string;
    en: string;
    ja: string;
  };
};