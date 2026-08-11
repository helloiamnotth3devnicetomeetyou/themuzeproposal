import { getImageProps } from "next/image";
import type { ImagePreloadCandidate } from "@/core/utils/image-preload";

export const DISCOGRAPHY_COVER_SIZES =
  "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 440px";

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
  return candidates
    .map((candidate, index) => ({ candidate, distance: Math.abs(index - activeIndex) }))
    .filter((item) => item.distance > 0)
    .sort((a, b) => a.distance - b.distance)
    .map((item) => item.candidate);
}

