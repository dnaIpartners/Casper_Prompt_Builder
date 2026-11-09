"use client";

import Image from "next/image";
import Link from "next/link";
import copyComposerIcon from "@/assets/icons/copy-composer.png";
import { useState } from "react";
import { ArrowLeftIcon, BTN, BTN_PRIMARY, ClockIcon, Field, RestartIcon, TextArea } from "../(builder)/ui";
import { runAdvisoryChecks } from "./copy-checks";
import { CopyHistoryModal } from "./copy-history-modal";
import { ActionType, appendHistoryEntry, CopyVariant, HistoryEntry, MONTH_OPTIONS, SensoryAnchor } from "./copy-model";
import { SensoryAnchorPanel, VariantCard, WITH_CASPER_TEXT } from "./copy-ui";

const SLOT_LABELS = ["안 1", "안 2", "안 3"];

interface GenerateFullResponse {
  anchor: SensoryAnchor;
  variants: CopyVariant[];
}

interface GenerateSingleResponse {
  variant: CopyVariant;
}

export default function CopyPage() {
  const [month, setMonth] = useState<number | null>(null);
  const [promptText, setPromptText] = useState("");

  const [anchor, setAnchor] = useState<SensoryAnchor | null>(null);
  const [variants, setVariants] = useState<CopyVariant[] | null>(null);
  const [resultStale, setResultStale] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);

  const canGenerate = month !== null && promptText.trim().length > 0;
  const anyLoading = loadingAll || loadingSlot !== null;
  const advisories = variants ? runAdvisoryChecks(variants) : [];

  function updateMonth(v: number | null) {
    setMonth(v);
    if (variants) setResultStale(true);
  }

  function updatePrompt(v: string) {
    setPromptText(v);
    if (variants) setResultStale(true);
  }

  function recordHistory(nextAnchor: SensoryAnchor, nextVariants: CopyVariant[], actionType: ActionType) {
    if (month === null) return;
    appendHistoryEntry({
      month,
      prompt: promptText,
      anchor: nextAnchor,
      variants: nextVariants,
      actionType,
    });
  }

  async function handleGenerateAll() {
    if (!canGenerate || anyLoading || month === null) return;
    const isFirstGeneration = variants === null;
    setLoadingAll(true);
    setGenError(null);
    try {
      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "full", month, prompt: promptText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "알 수 없는 오류가 발생했습니다.");
      const { anchor: newAnchor, variants: newVariants } = data as GenerateFullResponse;
      setAnchor(newAnchor);
      setVariants(newVariants);
      setResultStale(false);
      recordHistory(newAnchor, newVariants, isFirstGeneration ? "initial" : "regenerate_all");
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "카피 생성에 실패했습니다.");
    } finally {
      setLoadingAll(false);
    }
  }

  async function handleRegenerateSlot(index: number) {
    if (!variants || !anchor || anyLoading || month === null) return;
    setLoadingSlot(index);
    setGenError(null);
    try {
      const keepVariants = variants.filter((_, i) => i !== index);
      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "single", month, prompt: promptText, anchor, keepVariants }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "알 수 없는 오류가 발생했습니다.");
      const { variant } = data as GenerateSingleResponse;
      const newVariants = variants.map((v, i) => (i === index ? variant : v));
      setVariants(newVariants);
      setResultStale(false);
      recordHistory(anchor, newVariants, `regenerate_slot_${index + 1}` as ActionType);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "카피 생성에 실패했습니다.");
    } finally {
      setLoadingSlot(null);
    }
  }

  function handleToggleWithCasper(index: number) {
    if (!variants) return;
    const newVariants = variants.map((v, i) =>
      i === index ? { ...v, with_casper: v.with_casper === WITH_CASPER_TEXT ? "" : WITH_CASPER_TEXT } : v
    );
    setVariants(newVariants);
  }

  function handleApplyHistoryEntry(entry: HistoryEntry) {
    setMonth(entry.month);
    setPromptText(entry.prompt);
    setAnchor(entry.anchor);
    setVariants(entry.variants);
    setResultStale(false);
    setGenError(null);
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#111827]">
      <div className="mx-auto max-w-3xl px-6 pt-10 pb-16">
        <div className="mb-7">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1 text-[13px] font-semibold text-[#6b7280] hover:text-[#4090f1]"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            도구 선택으로 돌아가기
          </Link>
          <span className="mb-2 block text-[11px] font-bold tracking-wider text-[#4090f1] uppercase">
            Internal Tool
          </span>
          <h1 className="mb-1.5 flex items-center gap-2.5 text-[1.75rem] leading-tight font-extrabold tracking-tight">
            <Image src={copyComposerIcon} alt="" width={32} height={32} className="h-8 w-8 flex-shrink-0 -translate-y-px" priority />
            <span>Copy Composer</span>
          </h1>
          <p className="m-0 text-sm leading-relaxed text-[#6b7280]">
            게재월과 이미지 생성 프롬프트를 입력하면 카피 프로덕션 가이드라인 · 기획전 톤 컴퍼스 규칙에 따라<br></br>
            헤드라인·서브카피 3안을 생성합니다.
          </p>
        </div>

        {/* 입력 폼 */}
        <div className="mb-6 flex flex-col gap-7 rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-[0_1px_2px_rgba(17,24,39,.05)]">
          <Field label="게재월" required desc="계절 기준점이 되는 유일한 정적 필드입니다.">
            <select
              value={month ?? ""}
              onChange={(e) => updateMonth(e.target.value ? Number(e.target.value) : null)}
              className="w-full appearance-none rounded-lg border border-[#d1d5db] bg-white bg-[length:14px] bg-[right_0.875rem_center] bg-no-repeat px-3.5 py-2.75 pr-9 text-[0.9375rem] text-[#111827] focus:border-[#4090f1] focus:ring-3 focus:ring-[#e4effc] focus:outline-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              }}
            >
              <option value="">월 선택</option>
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </Field>

          <Field label="프롬프트" required desc="해당 기획전 이미지 생성에 사용된 프롬프트 원문을 붙여넣으세요.">
            <TextArea
              value={promptText}
              onChange={updatePrompt}
              placeholder="예: warm glowing light, soft steam rising, gentle morning atmosphere..."
              long
            />
          </Field>

          <div>
            <button
              type="button"
              onClick={handleGenerateAll}
              disabled={!canGenerate || anyLoading}
              className={BTN_PRIMARY + " flex w-full items-center justify-center gap-1.5"}
            >
              {variants && !loadingAll && <RestartIcon className="h-4 w-4" />}
              {loadingAll ? "생성 중... (내부 점검·보정 포함, 다소 시간이 걸릴 수 있습니다)" : variants ? "전체 재생성" : "카피 생성"}
            </button>
            {genError && <p className="mt-2 text-[13px] text-[#dc2626]">{genError}</p>}
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className={BTN + " mt-3 flex w-full items-center justify-center gap-1.5"}
            >
              <ClockIcon className="h-4 w-4" />
              히스토리
            </button>
          </div>
        </div>

        {/* 결과 */}
        {variants && anchor && (
          <div className="mb-6 rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-[0_1px_2px_rgba(17,24,39,.05)]">
            {resultStale && (
              <div className="mb-4 flex gap-2.5 rounded-lg border border-[#fcd34d] bg-[#fffbeb] p-3.5 text-[13px] leading-relaxed text-[#b45309]">
                <span className="flex-shrink-0 font-bold">⚠</span>
                <div>
                  <strong className="mb-1 block text-sm">입력값이 결과 생성 이후 변경되었습니다</strong>
                  아래 결과는 변경 전 입력값으로 생성된 이전 결과입니다. 전체 재생성 버튼을 눌러 다시
                  생성해주세요.
                </div>
              </div>
            )}

            <SensoryAnchorPanel anchor={anchor} />

            <div className="mb-4 h-px bg-[#eeeeee]" />

            <div className="mb-5 flex flex-col gap-1 text-[12px] leading-relaxed text-[#6b7280]">
              <div className="flex gap-1.5 ">
                <span aria-hidden="true">·</span>
                <p className="m-0">
                  이 결과는 생성될 때마다 자동으로 개인 히스토리에 기록됩니다. 이전 시도와 비교하려면{" "}
                  <button
                    type="button"
                    onClick={() => setHistoryOpen(true)}
                    className="cursor-pointer font-semibold text-[#4090f1] hover:underline"
                  >
                    &apos;히스토리&apos;
                  </button>
                  를 열어 확인하세요.
                </p>
              </div>
              <div className="flex gap-1.5">
                <span aria-hidden="true">·</span>
                <p className="m-0">
                  With CASPER check: 체크하면 Copy 버튼으로 복사할 때 &apos;With CASPER&apos; 문구가 함께 복사됩니다.
                  
                </p>
              </div>
              <div className="flex gap-1.5 font-semibold text-[#b45309]">
                <span aria-hidden="true">·</span>
                <p className="m-0">
                  낭독 검수: 확정 전 소리 내어 읽어보고 어색한 발음·비슷한 소리끼리의 혼동·부자연스러운 리듬이 없는지
                  확인해 주세요.
                </p>
              </div>
              {advisories
                .filter((a) => a.variantIndex === undefined)
                .map((advisory, i) => (
                  <div key={i} className="flex gap-1.5 font-semibold text-[#b45309]">
                    <span aria-hidden="true">·</span>
                    <p className="m-0">재검토 권장: {advisory.message}</p>
                  </div>
                ))}
            </div>

            {variants.map((variant, i) => (
              <VariantCard
                key={i}
                label={SLOT_LABELS[i]}
                variant={variant}
                onRegenerate={() => handleRegenerateSlot(i)}
                onToggleWithCasper={() => handleToggleWithCasper(i)}
                loading={loadingSlot === i}
                disabled={anyLoading}
                advisories={advisories.filter((a) => a.variantIndex === i)}
              />
            ))}
          </div>
        )}
      </div>

      <CopyHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} onApply={handleApplyHistoryEntry} />
    </div>
  );
}
