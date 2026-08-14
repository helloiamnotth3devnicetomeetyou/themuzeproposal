export type ArtistOption = { id: string; name: string; eng_name: string | null; updated_at: string };

export type AvatarAsset = {
  id: string;
  artist_id: string;
  image_path: string;
  sort_order: number;
  is_active: boolean;
};

export type CropQueue = { files: File[]; index: number; cropped: File[] };

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function serializeAvatarAssets(items: AvatarAsset[]) {
  return JSON.stringify(
    items.map((item, index) => ({
      ...item,
      sort_order: index + 1,
    })),
  );
}

export function reindexAvatarAssets(items: AvatarAsset[]) {
  return items.map((item, index) => ({
    ...item,
    sort_order: index + 1,
  }));
}
