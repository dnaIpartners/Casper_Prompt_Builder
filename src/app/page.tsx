import Link from "next/link";
import { ArrowRightIcon } from "./(builder)/ui";

const TOOLS = [
  {
    href: "/step-1",
    tag: "Image Prompt",
    title: "Prompt Builder",
    desc: "기획성 오브젝트 이미지 생성을 위한\n4단계 프롬프트 표준화 도구",
  },
  {
    href: "/copy",
    tag: "Copy",
    title: "Copy Composer",
    desc: "게재월·프롬프트 기반으로\n기획전 헤드라인·서브카피 3안을 생성하는 도구",
  },
];

export default function RootPage() {
  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#111827]">
      <div className="mx-auto max-w-3xl px-6 pt-16 pb-16">
        <div className="mb-10">
          <span className="mb-2 block text-[11px] font-bold tracking-wider text-[#4090f1] uppercase">
            Internal Tool
          </span>
          <h1 className="mb-1.5 text-[1.75rem] leading-tight font-extrabold tracking-tight">
            기획성 콘텐츠 제작 도구
          </h1>
          <p className="m-0 text-sm leading-relaxed text-[#6b7280]">사용할 도구를 선택하세요.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex min-h-[320px] flex-col justify-between rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_2px_rgba(17,24,39,.05)] transition-all hover:border-[#4090f1] hover:shadow-[0_4px_12px_rgba(64,144,241,.12)]"
            >
              <div>
                <span className="mb-3 inline-block rounded-full bg-[#eceef1] px-2.5 py-1 text-[10.5px] font-bold tracking-wide text-[#6b7280] uppercase transition-colors group-hover:bg-[#e4effc] group-hover:text-[#4090f1]">
                  {tool.tag}
                </span>
                <h2 className="m-0 mb-2 text-2xl font-bold tracking-tight">{tool.title}</h2>
                <p className="m-0 text-[13px] leading-relaxed whitespace-pre-line text-[#6b7280]">{tool.desc}</p>
              </div>
              <ArrowRightIcon className="h-5 w-5 self-end text-[#9ca3af] transition-colors group-hover:text-[#4090f1]" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
