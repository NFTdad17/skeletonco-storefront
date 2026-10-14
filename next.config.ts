import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.glb": {
        type: "asset",
      },
    },
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.glb$/,
      type: "asset/resource",
    });
    return config;
  },
};

export default nextConfig;
