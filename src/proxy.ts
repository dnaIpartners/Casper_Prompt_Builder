import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// "/"는 로그인 전에는 로그인 폼, 로그인 후에는 도구 선택 허브를 보여주는 진입점이다.
// 그 외 모든 경로는 유효한 세션 쿠키가 있어야 접근할 수 있다.
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/") return NextResponse.next();

  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    if (pathname.startsWith("/api/")) {
      return Response.json(
        { error: { message: "로그인이 필요합니다.", status: 401 } },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/", req.nextUrl);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // 정적 리소스는 제외
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"],
};
