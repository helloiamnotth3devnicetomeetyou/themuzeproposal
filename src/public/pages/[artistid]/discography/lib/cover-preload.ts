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

