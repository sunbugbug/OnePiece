import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 프로덕션 빌드에서 test-map 페이지 제외
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // 또는 webpack 설정으로 제외
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      // 프로덕션 빌드에서 test-map 제외
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }
    return config;
  },
};

export default nextConfig;
