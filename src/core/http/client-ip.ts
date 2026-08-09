import type { NextRequest } from "next/server";

export function clientIp(request: NextRequest) {
  // Vercel overwrites this header with the connecting client IP. Other headers
  // can be supplied by a caller, and NextRequest does not expose the peer IP
  // required to validate a self-hosted proxy allowlist.
  const header = process.env.VERCEL === "1"
    ? "x-vercel-forwarded-for"
    : process.env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();
  if (!header || !/^[a-z0-9-]+$/.test(header)) return null;
  const values = request.headers.get(header)
    ?.split(",").map((value) => value.trim()).filter(Boolean);
  return values?.length === 1 ? values[0] : null;
}
