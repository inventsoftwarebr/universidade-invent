import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.b-cdn.net" },
      { protocol: "https", hostname: "vz-*.b-cdn.net" },
      { protocol: "https", hostname: "image.mux.com" },
    ],
  },
};

export default nextConfig;
