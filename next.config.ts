import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL?.replace(/\/+$/, "")
  || (supabaseUrl ? `${supabaseUrl}/storage/v1/object/public` : "");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: blob: https:; media-src 'self' https:; font-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https:; form-action 'self'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
  images: {
    // Keep the built-in optimizer active for both local and Supabase-hosted media.
    unoptimized: false,
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85],
    remotePatterns: storageUrl ? [new URL(`${storageUrl}/**`)] : [],
  },
};

export default nextConfig;
