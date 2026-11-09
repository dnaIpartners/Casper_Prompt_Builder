import Link from "next/link";
import { ArrowRightIcon } from "../(builder)/ui";

const TOOLS = [
  {
    href: "/step-1",
    tag: "Image Prompt",
    title: "Prompt Builder",
    desc: "기획성 오브젝트 이미지 생성을 위한 4단계 프롬프트 표준화 도구",
  },
  {
    href: "/copy",
    tag: "Copy",
    title: "Copy Composer",
    desc: "게재월·프롬프트 기반으로 기획전 헤드라인·서브카피 3안을 생성하는 도구",
  },
];

export function ToolHub() {
  return (
    <div className="flex flex-col gap-3">
      {TOOLS.map((tool) => (
        <Link
          key={tool.href}
          href={tool.href}
          className="group flex items-center gap-4 rounded-xl border border-[#dcdfe5] bg-white shadow-[0_1px_2px_rgba(30,35,60,.05)] px-5 py-4.5 transition-all hover:border-[#2f7bf5] hover:shadow-[0_8px_24px_-10px_rgba(47,123,245,.45)]"
        >
          <div className="min-w-0 flex-1">
            <span className="mb-1.5 inline-block rounded-full bg-[#eef0f4] px-2 py-0.5 text-[10.5px] font-semibold tracking-wide text-[#6b7180] uppercase transition-colors group-hover:bg-[#eef2fe] group-hover:text-[#2f7bf5]">
              {tool.tag}
            </span>
            <h2 className="m-0 mb-1 text-[17px] font-bold tracking-[-0.02em] text-[#2a2e3a]">{tool.title}</h2>
            <p className="m-0 text-[13px] leading-relaxed break-keep text-[#7a8090]">{tool.desc}</p>
          </div>
          <ArrowRightIcon className="h-5 w-5 flex-shrink-0 text-[#b3b8c4] transition-all group-hover:translate-x-0.5 group-hover:text-[#2f7bf5]" />
        </Link>
      ))}
    </div>
  );
}
