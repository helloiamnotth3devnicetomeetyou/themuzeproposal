import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL?.replace(/\/+$/, "")
  || (supabaseUrl ? `${supabaseUrl}/storage/v1/object/public` : "");
const imageRemotePatterns = [storageUrl, supabaseUrl ? `${supabaseUrl}/storage/v1/object` : ""]
  .filter(Boolean)
  .map((value) => {
    const url = new URL(value);
    return {
      protocol: url.protocol.slice(0, -1) as "http" | "https",
      hostname: url.hostname,
      port: url.port,
      pathname: `${url.pathname.replace(/\/+$/, "")}/**`,
    };
  });

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: { cssChunking: false },
  async headers() {
    return [
      {
        source: "/",
        headers: [
          { key: "Cache-Control", value: "private, no-cache, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
        ],
      },
    ];
  },
  images: {
    // Keep the built-in optimizer active for both local and Supabase-hosted media.
    unoptimized: false,
    minimumCacheTTL: 604800,
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 80, 85, 90],
    remotePatterns: imageRemotePatterns,
  },
};

export default nextConfig;
