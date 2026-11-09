import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// 단일 계정(사이트 소유자) 로그인. 계정 정보는 DB 없이 환경변수로만 관리한다.
//   AUTH_USERNAME / AUTH_PASSWORD : 로그인 계정
//   AUTH_SECRET                   : 세션 쿠키 서명 키 (충분히 긴 임의 문자열)
// 세션 토큰은 "<만료시각(ms)>.<HMAC-SHA256 서명>" 형태라 서버 상태 없이 검증할 수 있다.

export const SESSION_COOKIE = "session";
// 쿠키는 만료일 없는 세션 쿠키(브라우저 종료 시 삭제)로 발급하고,
// 토큰 자체에는 서버가 검증하는 최대 유효기간을 둔다.
const SESSION_TOKEN_TTL_SEC = 60 * 60 * 24; // 로그인 후 24시간 (사용해도 연장하지 않음)

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

export function checkCredentials(username: string, password: string) {
  const expectedUser = process.env.AUTH_USERNAME;
  const expectedPass = process.env.AUTH_PASSWORD;
  if (!expectedUser || !expectedPass) {
    throw new Error("서버에 AUTH_USERNAME / AUTH_PASSWORD가 설정되어 있지 않습니다.");
  }
  // 둘 다 항상 비교해 어느 쪽이 틀렸는지 응답 시간으로 드러나지 않게 한다.
  const userOk = safeEqual(username, expectedUser);
  const passOk = safeEqual(password, expectedPass);
  return userOk && passOk;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expires = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!safeEqual(signature, sign(expires))) return false;
  return Number(expires) > Date.now();
}

export async function createSession() {
  const expires = Date.now() + SESSION_TOKEN_TTL_SEC * 1000;
  const token = `${expires}.${sign(String(expires))}`;
  (await cookies()).set(SESSION_COOKIE, token, {
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

export async function isAuthenticated() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

// 로그인 후 인사 문구에 쓰는 이름. 별도 지정이 없으면 로그인 아이디를 쓴다.
export function getDisplayName() {
  return process.env.AUTH_DISPLAY_NAME || process.env.AUTH_USERNAME || "";
}
