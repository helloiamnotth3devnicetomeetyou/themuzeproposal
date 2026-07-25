import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL?.replace(/\/+$/, "")
  || (supabaseUrl ? `${supabaseUrl}/storage/v1/object/public` : "");

const nextConfig: NextConfig = {
  images: {
    // Keep the built-in optimizer active for both local and Supabase-hosted media.
    unoptimized: false,
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85],
    remotePatterns: storageUrl ? [new URL(`${storageUrl}/**`)] : [],
  },
};

export default nextConfig;
