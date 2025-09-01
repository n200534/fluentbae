import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['ioredis', 'redis'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('ioredis', 'redis');
    }
    return config;
  },
};

export default nextConfig;
