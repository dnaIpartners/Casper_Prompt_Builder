import { scryptSync, timingSafeEqual } from "node:crypto";
// 정적 import라 배포 번들에 함께 포함된다. Vercel에서는 실행 중 파일을 고칠 수 없으므로
// 사용자 추가·변경은 `npm run user` 스크립트로 파일을 고친 뒤 커밋·배포한다.
import usersData from "../../data/users.json";

export type User = {
  id: string; // 로그인 아이디 (보통 이메일의 @ 앞부분)
  email: string;
  name: string;
  role: "admin" | "user";
  passwordHash: string; // "scrypt$<salt base64url>$<hash base64url>"
  disabled?: boolean;
};

const users = usersData as User[];

// 해시 형식·파라미터는 scripts/users.mjs와 같아야 한다.
const KEY_LEN = 64;

function verifyPassword(password: string, stored: string) {
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(password, Buffer.from(salt, "base64url"), KEY_LEN);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// 없는 계정이어도 같은 시간만큼 해시를 계산해, 응답 시간으로 계정 존재 여부가 드러나지 않게 한다.
const DUMMY_HASH = "scrypt$AAAAAAAAAAAAAAAAAAAAAA$" + Buffer.alloc(KEY_LEN).toString("base64url");

// 이메일 전체 또는 아이디로 로그인할 수 있다. 성공하면 사용자, 실패하면 null.
export function authenticate(login: string, password: string): User | null {
  const key = login.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === key || u.id.toLowerCase() === key);
  const ok = verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  return user && ok && !user.disabled ? user : null;
}

// 세션이 살아 있는 동안 계정이 비활성화되거나 삭제됐는지 확인할 때 쓴다.
export function isActiveUser(id: string) {
  const user = users.find((u) => u.id === id);
  return !!user && !user.disabled;
}
