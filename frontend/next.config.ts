import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Turbopack 설정 (Next.js 16 기본값)
  turbopack: {
    // 빈 설정으로 webpack 충돌 방지
  },
};

export default nextConfig;
