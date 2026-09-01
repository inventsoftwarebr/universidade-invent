import type { NextConfig } from "next";

// Runtime Node em todas as rotas: o driver `postgres` não funciona no Edge.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
