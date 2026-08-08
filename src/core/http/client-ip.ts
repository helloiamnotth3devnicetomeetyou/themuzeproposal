import type { NextRequest } from "next/server";

export function clientIp(request: NextRequest) {
  // Vercel overwrites this header with the connecting client IP. Other headers
  // can be supplied by a caller, and NextRequest does not expose the peer IP
  // required to validate a self-hosted proxy allowlist.
  if (process.env.VERCEL !== "1") return "unknown";
  const values = request.headers.get("x-vercel-forwarded-for")
    ?.split(",").map((value) => value.trim()).filter(Boolean);
  return values?.length === 1 ? values[0] : "unknown";
}
