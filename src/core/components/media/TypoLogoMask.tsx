import type { CSSProperties } from "react";

type Props = {
  src: string;
  label: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Renders an SVG "typo" logo tinted via CSS mask. mask-image performs a CORS-checked
 * fetch even for same-scheme cross-origin URLs; the R2 CDN doesn't send
 * Access-Control-Allow-Origin, so browsers silently refuse to paint the mask. Routing the
 * mask through our own /api/asset-proxy makes the request same-origin, sidestepping CORS.
 * A plain <img> with the direct R2 src is still rendered (visually hidden) to warm the
 * browser cache for the visible asset.
 */
export default function TypoLogoMask({ src, label, className, style }: Props) {
  const maskSrc = `/api/asset-proxy?url=${encodeURIComponent(src)}`;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" aria-hidden="true" loading="eager" decoding="async" style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
      <span
        aria-label={label}
        className={className}
        style={{
          ...style,
          WebkitMaskImage: `url("${maskSrc}")`,
          maskImage: `url("${maskSrc}")`,
        }}
      />
    </>
  );
}
