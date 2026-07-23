import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Supabase may resolve through NAT64 in this environment. Load public bucket
    // assets directly in the browser instead of proxying them through Next Image.
    unoptimized: true,
    remotePatterns: [
      new URL("https://kjsqwfhqjvekahacvfnc.supabase.co/storage/v1/object/public/**"),
    ],
  },
};

export default nextConfig;
