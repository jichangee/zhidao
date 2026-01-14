import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma', 'pg'],
  allowedDevOrigins: ['10.0.0.19'],
};

export default nextConfig;
