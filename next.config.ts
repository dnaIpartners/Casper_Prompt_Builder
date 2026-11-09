import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 로그인 페이지가 "/"로 통합되어, 예전 /login 주소는 진입점으로 보낸다.
  async redirects() {
    return [{ source: "/login", destination: "/", permanent: false }];
  },
};

export default nextConfig;
