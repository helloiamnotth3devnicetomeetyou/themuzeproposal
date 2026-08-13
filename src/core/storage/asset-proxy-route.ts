import { NextResponse, type NextRequest } from "next/server";
import {
  getPublicAssetUrl,
  managedAssetFromUrl,
} from "@/core/storage/public-url";

const MAX_PROXY_BYTES = 20 * 1024 * 1024;
const TYPOLOGY_PATH =
  /^[a-z0-9-]+\/album-typography-sanitized\/[a-z0-9-]+\/[0-9a-f-]{36}\.svg$/i;
const IMAGE_PATH = /^[a-z0-9-]+\/.+\.(?:jpe?g|png|webp)$/i;

/**
 * Streams a public R2 asset back through our own origin. CSS `mask-image` (used to tint
 * SVG typo logos) performs a CORS-checked fetch even for same-scheme cross-origin URLs;
 * the R2 custom domain doesn't send Access-Control-Allow-Origin, so browsers refuse to
 * paint the mask. Serving the bytes from our own origin sidesteps the CORS check entirely.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url).searchParams.get("url") ?? "";
  const asset = managedAssetFromUrl(url);
  if (
    !asset ||
    asset.bucket !== "artist-assets" ||
    (!TYPOLOGY_PATH.test(asset.path) && !IMAGE_PATH.test(asset.path))
  )
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });

  let upstream: Response;
  try {
    upstream = await fetch(getPublicAssetUrl(asset.bucket, asset.path), {
      cache: "force-cache",
    });
  } catch {
    return NextResponse.json({ code: "UPSTREAM_UNAVAILABLE" }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ code: "UPSTREAM_UNAVAILABLE" }, { status: 502 });
  }

  const contentType =
    upstream.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() ||
    "";
  const contentLengthHeader = upstream.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;
  if (
    !["image/svg+xml", "image/jpeg", "image/png", "image/webp"].includes(
      contentType,
    ) ||
    (contentLength !== null &&
      Number.isFinite(contentLength) &&
      (contentLength < 1 || contentLength > MAX_PROXY_BYTES))
  ) {
    await upstream.body.cancel();
    return NextResponse.json({ code: "INVALID_ASSET" }, { status: 415 });
  }

  let bytes = 0;
  const body = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytes += chunk.byteLength;
        if (bytes > MAX_PROXY_BYTES) {
          controller.error(new Error("asset too large"));
          return;
        }
        controller.enqueue(chunk);
      },
    }),
  );

  const response = new NextResponse(body, { status: 200 });
  response.headers.set("Content-Type", contentType);
  response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return response;
}
