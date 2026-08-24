import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 홈 디렉터리의 잡동사니 lockfile 때문에 워크스페이스 루트가 /Users/pourlui로
  // 잘못 추론되면 모듈 식별자에 한글 경로가 포함되어 Turbopack이 패닉한다.
  turbopack: { root: __dirname },
};

export default nextConfig;
