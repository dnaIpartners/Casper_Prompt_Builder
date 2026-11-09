"use client";

import { useActionState } from "react";
import { login } from "./actions";

const INPUT =
  "h-12 w-full rounded-lg border border-[#dcdfe5] bg-white px-4 text-[15px] text-[#1f2330] outline-none transition-all placeholder:text-[#9aa0ad] focus:border-[#2f7bf5] focus:ring-4 focus:ring-[#2f7bf5]/12";
const LABEL = "text-[13px] font-medium text-[#5b6170]";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col">
      <input type="hidden" name="next" value={next} />

      <label className="mb-5 flex flex-col gap-2">
        <span className={LABEL}>아이디</span>
        <input name="username" autoComplete="username" placeholder="아이디를 입력하세요" required className={INPUT} />
      </label>

      <label className="flex flex-col gap-2">
        <span className={LABEL}>비밀번호</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호를 입력하세요"
          required
          className={INPUT}
        />
      </label>

      {state?.error && (
        <p
          role="alert"
          className="mt-5 mb-0 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2.5 text-[13px] font-medium text-[#dc2626]"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-9 h-12 w-full cursor-pointer rounded-lg bg-[#2f7bf5] text-[15px] font-semibold text-white shadow-[0_6px_16px_-6px_rgba(47,123,245,.7)] transition-all hover:enabled:bg-[#1f6ae6] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "로그인 중…" : "로그인"}
      </button>
    </form>
  );
}
