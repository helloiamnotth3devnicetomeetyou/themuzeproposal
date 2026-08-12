import {
  normalizeOutline,
  type ArtistScene,
} from "@/core/utils/artist-scenes";
import { managedAssetFromUrl } from "@/core/storage/public-url";

export type MemberLookup = {
  id: string;
  name: string;
  eng_name: string | null;
  color: string | null;
  sort_order: number;
};

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const ACCEPTED_SCENE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
export const ACCEPTED_MASK_TYPES = new Set(["image/png", "image/webp"]);
export const sceneSelect =
  "id,artist_id,title,title_ko,title_en,title_ja,link_url,image_url,image_width,image_height,is_hero,is_published,sort_order,artist_scene_members(id,member_id,outline,mask_url,sort_order)";

export function storagePathFromUrl(url: string) {
  const asset = managedAssetFromUrl(url);
  return asset && asset.bucket === "artist-assets" ? asset.path : null;
}

export async function imageDimensions(file: File) {
  const url = URL.createObjectURL(file);
  try {
    return await imageDimensionsFromUrl(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function imageDimensionsFromUrl(url: string) {
  const image = new Image();
  image.src = url;
  await image.decode();
  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error("이미지 원본 크기를 확인할 수 없습니다.");
  }
  return { width: image.naturalWidth, height: image.naturalHeight };
}

export function normalizeScene(scene: ArtistScene): ArtistScene {
  return {
    ...scene,
    artist_scene_members: (scene.artist_scene_members ?? []).map((region) => ({
      ...region,
      outline: normalizeOutline(region.outline),
    })),
  };
}
