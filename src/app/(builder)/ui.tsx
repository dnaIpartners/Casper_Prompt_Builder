"use client";

import { useState } from "react";

export const BTN =
  "cursor-pointer rounded-lg border border-[#d1d5db] bg-white px-4.5 py-2.5 text-sm font-semibold text-[#111827] transition-all hover:enabled:border-[#4090f1] hover:enabled:text-[#4090f1] disabled:cursor-not-allowed disabled:opacity-45";
export const BTN_PRIMARY =
  "cursor-pointer rounded-lg border border-[#4090f1] bg-[#4090f1] px-4.5 py-2.5 text-sm font-semibold text-white transition-all hover:enabled:border-[#2e85f0] hover:enabled:bg-[#2e85f0] disabled:cursor-not-allowed disabled:opacity-45";
export const BTN_DANGER =
  "cursor-pointer rounded-lg border border-[#fca5a5] bg-white px-4.5 py-2.5 text-sm font-semibold text-[#dc2626] transition-all hover:border-[#dc2626] hover:bg-[#fef2f2]";
export const BTN_COPIED =
  "cursor-pointer rounded-lg border border-[#16a34a] bg-[#16a34a] px-4.5 py-2.5 text-sm font-semibold text-white transition-all";

export function CheckIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 12.5L9.5 17L19 7"
        stroke="currentColor"
        strokeWidth={2.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowLeftIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M19 12H5M11 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RestartIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 12a9 9 0 1 0 2.83-6.36"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="3 3 3 8 8 8"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Field({
  label,
  required,
  desc,
  children,
}: {
  label: string;
  required?: boolean;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[0.9375rem] font-bold">{label}</span>
        {required ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fef2f2] px-1.75 py-0.5 text-[10.5px] font-bold tracking-wide text-[#dc2626] uppercase">
            <span className="h-1.25 w-1.25 rounded-full bg-[#dc2626]" /> 필수
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f4f5f7] px-1.75 py-0.5 text-[10.5px] font-bold tracking-wide text-[#9ca3af] uppercase">
            선택
          </span>
        )}
      </div>
      {desc && <div className="mb-2.5 text-[0.8125rem] leading-relaxed text-[#6b7280]">{desc}</div>}
      {children}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-[#d1d5db] px-3.5 py-2.75 text-[0.9375rem] text-[#111827] focus:border-[#4090f1] focus:ring-3 focus:ring-[#e4effc] focus:outline-none"
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  long,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  long?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={
        "w-full resize-y rounded-lg border border-[#d1d5db] px-3.5 py-2.75 text-[0.9375rem] leading-relaxed text-[#111827] focus:border-[#4090f1] focus:ring-3 focus:ring-[#e4effc] focus:outline-none " +
        (long ? "min-h-[118px]" : "min-h-[74px]")
      }
    />
  );
}

export function Card({
  title,
  sub,
  selected,
  onClick,
}: {
  title: string;
  sub: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "relative flex-1 basis-[200px] rounded-lg border-[1.5px] p-4 text-center transition-all " +
        (selected ? "border-[#4090f1] bg-[#e4effc]" : "border-[#d1d5db] bg-white hover:border-[#4090f1]")
      }
    >
      {selected && (
        <span className="absolute top-2.5 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#4090f1] text-white">
          <CheckIcon />
        </span>
      )}
      <div className="mb-0.5 text-sm font-bold">{title}</div>
      <div className="text-xs text-[#6b7280]">{sub}</div>
    </button>
  );
}

export function Chip({
  label,
  selected,
  disabled,
  subtleHint,
  title,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  subtleHint?: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={
        "relative rounded-full border px-4 py-2 text-[0.8125rem] font-semibold transition-all " +
        (disabled
          ? "cursor-not-allowed border-[#e5e7eb] bg-[#f4f5f7] text-[#9ca3af]"
          : selected
            ? "border-[#4090f1] bg-[#4090f1] text-white"
            : "cursor-pointer border-[#d1d5db] bg-white text-[#6b7280] hover:border-[#4090f1] hover:text-[#4090f1]")
      }
    >
      {label}
      {subtleHint && (
        <span className="ml-1.5 rounded bg-[#fffbeb] px-1 py-0.5 align-middle text-[9px] font-bold tracking-wide text-[#b45309] uppercase">
          완화 적용
        </span>
      )}
    </button>
  );
}

export function ToggleButton({
  label,
  sub,
  selected,
  onClick,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded border px-3 py-1.75 text-center text-xs font-semibold transition-all " +
        (selected
          ? "border-[#2e85f0] bg-[#2e85f0] text-white"
          : "border-[#d1d5db] bg-white text-[#374151] hover:border-[#4090f1] hover:text-[#4090f1]")
      }
    >
      {label}
      {sub && (
        <div className={"text-[10px] font-medium " + (selected ? "text-white" : "text-[#6b7280]")}>
          ({sub})
        </div>
      )}
    </button>
  );
}

export function ExampleAccordion({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-[#e5e7eb] text-center">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2.5 bg-[#f4f5f7] px-3.5 py-3 text-left text-[13px] font-bold text-[#6b7280]"
      >
        <span>참고 예시 보기 (열람 전용으로, 클릭해도 입력값이 채워지지 않습니다.)</span>
        <span className={"flex-shrink-0 text-[#9ca3af] transition-transform " + (open ? "rotate-180" : "")}>▾</span>
      </button>
      {open && (
        <div className="bg-white p-4 text-left text-[0.8125rem] text-[#6b7280]">
          <ExampleCategory title="지형 위">
            <li>촉촉한 이끼 언덕 위에 놓인 유리병</li>
            <li>모래 언덕 사이에 반쯤 파묻힌 향수병</li>
          </ExampleCategory>
          <ExampleCategory title="받침·플랫폼 위">
            <li>원형 대리석 받침 위에 놓인 립스틱</li>
            <li>얇은 유리 플랫폼 위에 떠 있듯 놓인 시계</li>
          </ExampleCategory>
          <ExampleCategory title="용기 안">
            <li>투명 유리 볼 안에 담긴 진주 알갱이들</li>
            <li>반쯤 물이 채워진 비커 안의 향수 원액</li>
          </ExampleCategory>
          <ExampleCategory title="단독 배치">
            <li>배경 없이 중앙에 단독으로 놓여 있는 크림 용기</li>
            <li>은은한 그림자만 깔린 단독 배치의 시계</li>
          </ExampleCategory>
          <ExampleCategory title="여러 오브젝트가 이루는 작은 장면">
            <li>향수병 옆에 흩어진 말린 꽃잎과 리본</li>
            <li>립스틱과 작은 손거울, 진주 장식이 함께 놓인 장면</li>
          </ExampleCategory>
        </div>
      )}
    </div>
  );
}

function ExampleCategory({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5 last:mb-0">
      <h4 className="mb-1 text-[0.8125rem] font-bold text-[#111827]">{title}</h4>
      <ul className="m-0 list-disc pl-4.5 leading-relaxed">{children}</ul>
    </div>
  );
}

export function ResultBlock({
  index,
  title,
  content,
  avoid,
  copyLabels,
  onCopyPrompt,
  onCopyAvoid,
}: {
  index: string;
  title: string;
  content: string;
  avoid?: string;
  copyLabels?: [string, string];
  onCopyPrompt?: () => void | Promise<void>;
  onCopyAvoid?: () => void | Promise<void>;
}) {
  const [copied, setCopied] = useState<"prompt" | "avoid" | null>(null);

  async function handleCopy(which: "prompt" | "avoid", action?: () => void | Promise<void>) {
    try {
      await action?.();
      setCopied(which);
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 1600);
    } catch {
      // clipboard write failed (e.g. permission denied) — leave the button label unchanged
    }
  }

  return (
    <div className="mb-4 rounded-lg border border-[#e5e7eb] bg-white p-5">
      <div className="mb-3 flex items-baseline gap-2.5">
        <span className="text-xs font-extrabold tracking-wide text-[#4090f1]">{index}</span>
        <h3 className="m-0 text-[0.8125rem] font-bold tracking-wide text-[#6b7280] uppercase">{title}</h3>
      </div>
      <div className="text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-[#111827]">{content}</div>
      {avoid && <div className="mt-2.5 text-[0.8125rem] text-[#6b7280]">Avoid: {avoid}</div>}
      {copyLabels && (
        <div className="mt-3.5 flex gap-2">
          <button
            type="button"
            onClick={() => handleCopy("prompt", onCopyPrompt)}
            className={
              (copied === "prompt" ? BTN_COPIED : BTN) + " text-xs px-3 py-1.75"
            }
          >
            {copied === "prompt" ? "복사 완료 ✓" : copyLabels[0]}
          </button>
          <button
            type="button"
            onClick={() => handleCopy("avoid", onCopyAvoid)}
            className={
              (copied === "avoid" ? BTN_COPIED : BTN) + " text-xs px-3 py-1.75"
            }
          >
            {copied === "avoid" ? "복사 완료 ✓" : copyLabels[1]}
          </button>
        </div>
      )}
    </div>
  );
}
