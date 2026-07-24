import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL?.replace(/\/+$/, "")
  || (supabaseUrl ? `${supabaseUrl}/storage/v1/object/public` : "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: storageUrl ? [new URL(`${storageUrl}/**`)] : [],
  },
};

export default nextConfig;
