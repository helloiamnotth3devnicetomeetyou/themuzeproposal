"use client";

import Image, { type ImageProps } from "next/image";

type AdminAssetImageProps = Omit<ImageProps, "src" | "alt" | "width" | "height"> & {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
};

const shouldSkipOptimization = (src: string) =>
  /^(?:blob:|data:)/i.test(src) || /\.svg(?:$|\?)/i.test(src);

const normalizeImageSource = (src: string) =>
  /^(?:[a-z]+:|\/)/i.test(src) ? src : `/${src}`;

export default function AdminAssetImage({
  src,
  alt = "",
  width = 960,
  height = 720,
  sizes = "(max-width: 768px) 100vw, 480px",
  unoptimized,
  ...props
}: AdminAssetImageProps) {
  const normalizedSrc = normalizeImageSource(src);

  return (
    <Image
      {...props}
      src={normalizedSrc}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      unoptimized={unoptimized ?? shouldSkipOptimization(normalizedSrc)}
    />
  );
}
