import { NextResponse, type NextRequest } from "next/server";
import { getPublicAssetUrl, managedAssetFromUrl } from "@/core/storage/public-url";

/**
 * Streams a public R2 asset back through our own origin. CSS `mask-image` (used to tint
 * SVG typo logos) performs a CORS-checked fetch even for same-scheme cross-origin URLs;
 * the R2 custom domain doesn't send Access-Control-Allow-Origin, so browsers refuse to
 * paint the mask. Serving the bytes from our own origin sidesteps the CORS check entirely.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url).searchParams.get("url") ?? "";
  const asset = managedAssetFromUrl(url);
  if (!asset) return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });

  let upstream: Response;
  try {
    upstream = await fetch(getPublicAssetUrl(asset.bucket, asset.path), { cache: "force-cache" });
  } catch {
    return NextResponse.json({ code: "UPSTREAM_UNAVAILABLE" }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ code: "UPSTREAM_UNAVAILABLE" }, { status: 502 });
  }

  const response = new NextResponse(upstream.body, { status: 200 });
  response.headers.set("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");
  response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return response;
}
