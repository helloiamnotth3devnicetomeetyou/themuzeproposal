import type { NextRequest } from "next/server";

export function clientIp(request: NextRequest) {
  const segments = request.headers.get("x-forwarded-for")
    ?.split(",").map((s) => s.trim()).filter(Boolean);
  return segments?.at(-1)
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}
