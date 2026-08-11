import { getImageProps } from "next/image";
import type { ImagePreloadCandidate } from "@/core/utils/image-preload";
import type { DiscographyGalleryItem } from "./types";

export const DISCOGRAPHY_COVER_SIZES =
  "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 440px";
export const DISCOGRAPHY_GALLERY_SIZES =
  "(max-width: 640px) 66vw, (max-width: 768px) 50vw, 280px";

export function discographyCoverCandidate(src: string): ImagePreloadCandidate {
  const { props } = getImageProps({
    src,
    alt: "",
    fill: true,
    sizes: DISCOGRAPHY_COVER_SIZES,
  });

  return {
    src: props.src,
    srcSet: props.srcSet,
    sizes: props.sizes,
  };
}

export function coverPreloadQueue(candidates: ImagePreloadCandidate[], activeIndex: number) {
  if (candidates.length <= 1) return [];
  return Array.from(new Set([
    (activeIndex - 1 + candidates.length) % candidates.length,
    (activeIndex + 1) % candidates.length,
  ])).map((index) => candidates[index]);
}

export function galleryPreloadQueue(gallery: DiscographyGalleryItem[], albumId?: string) {
  if (!albumId) return [];
  return gallery
    .filter((item) => !item.albumId || item.albumId === albumId)
    .map((item) => {
      const { props } = getImageProps({ src: item.imageUrl, alt: "", fill: true, sizes: DISCOGRAPHY_GALLERY_SIZES });
      return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
    });
}

