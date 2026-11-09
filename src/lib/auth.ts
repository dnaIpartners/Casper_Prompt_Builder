import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isActiveUser, type User } from "./users";

// 로그인은 data/users.json의 계정(src/lib/users.ts)으로 확인하고,
// 세션은 이 사이트가 직접 서명한 쿠키로 관리한다.
//   AUTH_SECRET : 세션 쿠키 서명 키 (32자 이상 임의 문자열, 예: openssl rand -hex 32)
// 세션 토큰은 "<base64url(JSON 페이로드)>.<HMAC-SHA256 서명>" 형태라 서버 상태 없이 검증할 수 있다.

export const SESSION_COOKIE = "session";
// 쿠키는 만료일 없는 세션 쿠키(브라우저 종료 시 삭제)로 발급하고,
// 토큰 자체에는 서버가 검증하는 최대 유효기간을 둔다.
const SESSION_TOKEN_TTL_SEC = 60 * 60 * 24; // 로그인 후 24시간 (사용해도 연장하지 않음)

export type Session = {
  uid: string;
  email: string;
  name: string;
  role: User["role"];
  exp: number; // 만료 시각(ms)
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("서버에 AUTH_SECRET(32자 이상)이 설정되어 있지 않습니다.");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

// 길이가 달라도 비교 시간이 입력에 따라 새지 않도록 양쪽을 해시한 뒤 비교한다.
function safeEqual(a: string, b: string) {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

// 서명·만료를 확인하고, users.json에서 비활성화·삭제된 계정의 세션은 바로 무효로 본다.
export function verifySessionToken(token: string | undefined): Session | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  if (!safeEqual(token.slice(dot + 1), sign(payload))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    if (typeof session.exp !== "number" || session.exp <= Date.now()) return null;
    return isActiveUser(session.uid) ? session : null;
  } catch {
    return null;
  }
}

export async function createSession(user: User) {
  const session: Session = {
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Date.now() + SESSION_TOKEN_TTL_SEC * 1000,
  };
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  (await cookies()).set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // maxAge/expires를 지정하지 않아 세션 쿠키가 된다.
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function isAuthenticated() {
  return !!(await getSession());
}
