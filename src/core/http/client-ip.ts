import type { NextRequest } from "next/server";

export function clientIp(request: NextRequest) {
  // A configured proxy header is safe only when the proxy overwrites it and
  // direct origin access is blocked. NextRequest does not expose the peer IP
  // needed to validate a proxy allowlist here.
  const header =
    process.env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase() ||
    (process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : null);
  if (!header || !/^[a-z0-9-]+$/.test(header)) return null;
  const values = request.headers
    .get(header)
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return values?.length === 1 ? values[0] : null;
}
