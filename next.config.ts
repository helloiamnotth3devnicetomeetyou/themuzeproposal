import path from "node:path";
import type { NextConfig } from "next";

const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "");
const imageRemotePatterns = [r2PublicUrl].filter(Boolean).map((value) => {
  const url = new URL(value as string);
  return {
    protocol: url.protocol.slice(0, -1) as "http" | "https",
    hostname: url.hostname,
    port: url.port,
    pathname: `${url.pathname.replace(/\/+$/, "")}/**`,
  };
});

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  experimental: { cssChunking: false },
  outputFileTracingIncludes: {},
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  images: {
    // Keep the built-in optimizer active for R2-hosted media.
    unoptimized: false,
    minimumCacheTTL: 604800,
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 80, 85, 90],
    remotePatterns: imageRemotePatterns,
  },
  webpack: (config) => {
    // ponytail: proxy.ts / root error.tsx / not-found don't reliably inherit
    // tsconfig `paths` on `next build --webpack` (Next 16, vercel/next.js#85513).
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};

export default nextConfig;
