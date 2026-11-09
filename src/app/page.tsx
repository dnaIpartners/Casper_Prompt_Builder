import { DM_Sans } from "next/font/google";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { logout } from "./_auth/actions";
import { LoginForm } from "./_auth/login-form";
import { ToolHub } from "./_auth/tool-hub";
import appIcon from "./icon.png";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// 사이트 진입점이자 유일한 허브.
// 로그인 전에는 로그인 폼을, 로그인 후에는 같은 카드 안에서 도구 선택 목록을 보여준다.
export default async function RootPage({ searchParams }: PageProps<"/">) {
  const session = await getSession();
  const authed = !!session;
  const { next: nextParam } = await searchParams;
  const next = typeof nextParam === "string" ? nextParam : "/";

  return (
    <div
      className={`${dmSans.className} relative flex min-h-screen items-center justify-center overflow-hidden bg-[#e9ebf3] px-4 py-16 text-[#1f2330]`}
    >
      {/* 그라디언트 메시 배경 */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[20%] -left-[15%] h-[75vmax] w-[75vmax] rounded-full bg-[radial-gradient(circle,#6f9dff_0%,transparent_62%)] blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[10%] h-[80vmax] w-[80vmax] rounded-full bg-[radial-gradient(circle,#3d55f5_0%,transparent_60%)] blur-3xl" />
        <div className="absolute -right-[20%] -bottom-[25%] h-[70vmax] w-[70vmax] rounded-full bg-[radial-gradient(circle,#6a48ee_0%,transparent_62%)] blur-3xl" />
        <div className="absolute top-[-10%] right-[-10%] h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,#f6f6f8_0%,transparent_65%)] blur-2xl" />
      </div>

      {/* 카드 뒤에 깔리는 반투명 대형 타이포 */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(8rem,26vw,24rem)] leading-none font-bold tracking-[0.02em] whitespace-nowrap text-white/45 [text-shadow:0_12px_40px_rgba(80,90,220,.18)] select-none"
      >
        Studio
      </div>

      {/* 코너 메타 정보 */}
      <div className="absolute top-8 left-6 text-[15px] leading-tight font-semibold text-white [text-shadow:0_1px_12px_rgba(40,60,180,.35)] sm:top-12 sm:left-12">
        Internal Tool
        <span className="block font-normal text-white/75">Content Studio</span>
      </div>
      <div className="absolute bottom-8 left-6 hidden gap-16 text-[13px] leading-tight font-semibold tracking-wide text-white/90 uppercase sm:bottom-12 sm:left-12 sm:flex">
        <span>
          Prompt Builder
          <span className="block text-white/65">Copy Composer</span>
        </span>
      </div>

      {/* 로그인 / 도구 선택 카드 */}
      <div className="relative w-full max-w-[460px] overflow-hidden rounded-[12px] border border-white/70 bg-[#fafafb]/72 shadow-[0_30px_80px_-20px_rgba(40,40,120,.45)] backdrop-blur-[3px]">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4.5">
          <span className="text-[14px] font-medium text-[#7a8090]">{authed ? "Select a tool" : "Log in"}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2fe] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#2f7bf5] uppercase">
            <LockIcon className="h-3 w-3" />
            Private
          </span>
        </div>

        {authed ? (
          <div key="hub" className="animate-card-in px-7 pt-11 pb-12 sm:px-12">
            <h1 className="mb-2 flex items-center gap-2.5 text-[1.9rem] leading-[1.15] font-bold tracking-[-0.03em] text-[#2a2e3a]">
              <Image src={appIcon} alt="" width={36} height={36} className="h-9 w-9 flex-shrink-0 -translate-y-0.5" priority />
              <span>{session?.name}님, 안녕하세요</span>
            </h1>
            <p className="mb-9 text-[14px] text-[#7a8090]">사용할 도구를 선택하세요.</p>
            <ToolHub />
            {/* 로그인 폼의 로그인 버튼 자리에 로그아웃 버튼 */}
            <form action={logout}>
              <button
                type="submit"
                className="mt-9 h-12 w-full cursor-pointer rounded-lg bg-[#9ea2ae] text-[15px] font-semibold text-[#ffffff] transition-colors hover:bg-[#6b7180]"
              >
                로그아웃
              </button>
            </form>
          </div>
        ) : (
          <div key="login" className="px-7 pt-11 pb-12 sm:px-12">
            <h1 className="mb-2 text-[1.9rem] leading-[1.15] font-bold tracking-[-0.03em] text-[#2a2e3a]">
              기획성
              <br />
              콘텐츠 제작 도구
            </h1>
            <p className="mb-9 text-[14px] text-[#7a8090]">등록된 사용자만 접속할 수 있습니다.</p>
            <LoginForm next={next} />
          </div>
        )}
      </div>
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className={className}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  );
}
