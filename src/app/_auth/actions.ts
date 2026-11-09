"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/auth";
import { authenticate } from "@/lib/users";

export type LoginState = { error?: string } | undefined;

// 오픈 리다이렉트 방지: 같은 사이트 내부 경로만 허용
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const loginId = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!loginId || !password) {
    return { error: "이메일과 비밀번호를 입력해 주세요." };
  }

  const user = authenticate(loginId, password);
  if (!user) {
    // 무차별 대입 속도를 늦추기 위한 지연
    await new Promise((r) => setTimeout(r, 800));
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  await createSession(user);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
