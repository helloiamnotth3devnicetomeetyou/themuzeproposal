export type GalleryScope = "artist" | "album" | "member";

export type LookupItem = {
  id: string;
  name: string;
};

export type GalleryItem = {
  id: string;
  artist_id: string;
  album_id: string | null;
  member_id: string | null;
  image_url: string;
  caption: string;
  sort_order: number;
  is_published: boolean;
};

export type GalleryManagerProps = {
  artistId: string | null;
  scope: GalleryScope;
  albumId?: string | null;
  memberId?: string | null;
  onError: (message: string) => void;
  onToast: (message: string) => void;
};
