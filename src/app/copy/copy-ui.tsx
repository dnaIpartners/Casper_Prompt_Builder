"use client";

import { useState } from "react";
import { BTN, RestartIcon } from "../(builder)/ui";
import { CopyAdvisory } from "./copy-checks";
import { CopyVariant, SensoryAnchor } from "./copy-model";

export function SensoryAnchorPanel({ anchor }: { anchor: SensoryAnchor }) {
  return (
    <div className="mb-4 rounded-lg border border-[#fcd34d] bg-[#fffbeb] p-3.5">
      <div className="mb-2 text-[11px] font-bold tracking-wide text-[#b45309] uppercase">감각 앵커</div>
      {anchor.source_words.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {anchor.source_words.map((w, i) => (
            <span
              key={i}
              className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#374151] shadow-[0_1px_2px_rgba(17,24,39,.05)]"
            >
              {w}
            </span>
          ))}
        </div>
      )}
      <p className="m-0 text-[12.5px] leading-relaxed text-[#6b7280]">{anchor.note}</p>
    </div>
  );
}

export const WITH_CASPER_TEXT = "With CASPER";

export function VariantCard({
  label,
  variant,
  onRegenerate,
  onToggleWithCasper,
  loading,
  disabled,
  advisories,
}: {
  label: string;
  variant: CopyVariant;
  onRegenerate: () => void;
  onToggleWithCasper: () => void;
  loading: boolean;
  disabled: boolean;
  advisories: CopyAdvisory[];
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = [variant.tag, variant.subcopy, variant.headline, variant.with_casper].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 접근 실패(권한 등)는 조용히 무시한다.
    }
  }

  return (
    <div className="mb-4 rounded-lg border border-[#e5e7eb] bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2.5">
        <span className="text-xs font-extrabold tracking-wide text-[#4090f1]">{label}</span>
        <div className="flex gap-2">
          <button type="button" onClick={handleCopy} className={BTN + " px-3 py-1.5 text-xs"}>
            {copied ? "복사됨" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={disabled}
            className={BTN + " flex items-center gap-1.5 px-3 py-1.5 text-xs"}
          >
            {!loading && <RestartIcon className="h-3.5 w-3.5" />}
            {loading ? "생성 중..." : "이 안만 재생성"}
          </button>
        </div>
      </div>

      {variant.tag && (
        <span className="mb-2 inline-block rounded-full bg-[#eceef1] px-2.5 py-1 text-[10.5px] font-bold tracking-wide text-[#6b7280] uppercase">
          {variant.tag}
        </span>
      )}
      {variant.subcopy && (
        <p className="m-0 mb-1 text-[0.9375rem] leading-relaxed text-[#374151]">{variant.subcopy}</p>
      )}
      <h3 className="m-0 mb-2 text-[1.0625rem] leading-snug font-bold">{variant.headline}</h3>
      <label className="mb-4 flex w-fit cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-[#9ca3af]">
        <input
          type="checkbox"
          checked={variant.with_casper === WITH_CASPER_TEXT}
          onChange={onToggleWithCasper}
          className="h-3 w-3 cursor-pointer accent-[#4090f1]"
        />
        With CASPER
      </label>

      <div className="mt-3 flex flex-col rounded-lg bg-[#f4f5f7] p-3.5">
        <p className="m-0 mb-1 text-[12.5px] leading-relaxed text-[#6b7280]">
          <span className="font-bold text-[#4b5563]">앵커 적용: </span>
          {variant.anchor_rationale}
        </p>
        <p className="m-0 text-[12.5px] leading-relaxed text-[#6b7280]">
          <span className="font-bold text-[#4b5563]">제안 배경: </span>
          {variant.proposal_rationale}
        </p>

        {advisories.length > 0 && (
          <>
            <div className="mt-2 h-px bg-[#e5e7eb]" />
            <div className="mt-2 flex flex-col gap-1">
              {advisories.map((advisory, i) => (
                <p key={i} className="m-0 text-[12px] leading-relaxed font-semibold text-[#b45309]">
                  재검토 권장: {advisory.message}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
