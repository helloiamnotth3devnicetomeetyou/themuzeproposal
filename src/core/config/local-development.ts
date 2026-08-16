type RequestWithHostname = { nextUrl: { hostname: string } };

function isLocalHostname(hostname: string) {
  const normalized = hostname.trim().toLowerCase().replace(/\.$/, "");
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "127.0.0.1" ||
    normalized === "::1"
  );
}

export function isLocalDevelopmentRequest(request: RequestWithHostname) {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.STRICT_ENV_VALIDATION !== "1" &&
    !process.env.CI &&
    !process.env.GITHUB_ACTIONS &&
    !process.env.VERCEL &&
    !process.env.VERCEL_ENV &&
    isLocalHostname(request.nextUrl.hostname)
  );
}
