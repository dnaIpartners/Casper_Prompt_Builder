"use client";

import { useBuilder } from "../builder-context";
import { copyText } from "../builder-model";
import { BTN, BTN_PRIMARY, ResultBlock } from "../ui";

export default function Step4Page() {
  const {
    missingFields,
    apiError,
    apiLoading,
    resultData,
    lastMode,
    handleSample,
    generateViaApi,
    goToStep,
  } = useBuilder();

  return (
    <div>
      {missingFields.length > 0 && (
        <div className="mb-5 flex gap-2.5 rounded-lg border border-[#fcd34d] bg-[#fffbeb] p-3.5 text-[13px] leading-relaxed text-[#b45309]">
          <span className="flex-shrink-0 font-bold">⚠</span>
          <div>
            <strong className="mb-1 block text-sm">미입력 필수 항목이 있습니다</strong>
            <ul className="mt-1 list-disc pl-4.5">
              {missingFields.map((f) => (
                <li key={f.key}>
                  <button
                    type="button"
                    onClick={() => goToStep(f.step)}
                    className="cursor-pointer font-semibold text-inherit underline"
                  >
                    {f.label} (Step {f.step})
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {apiError && (
        <div className="mb-5 flex gap-2.5 rounded-lg border border-[#fca5a5] bg-[#fef2f2] p-3.5 text-[13px] leading-relaxed text-[#dc2626]">
          <span className="flex-shrink-0 font-bold">✕</span>
          <div>
            <strong className="mb-1 block text-sm">API 오류</strong>
            {apiError}
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-2.5">
        <button type="button" onClick={handleSample} disabled={apiLoading} className={BTN}>
          샘플 출력 보기
        </button>
        <button
          type="button"
          onClick={generateViaApi}
          disabled={missingFields.length > 0 || apiLoading}
          className={BTN_PRIMARY}
        >
          {resultData && lastMode === "api" ? "결과 다시 생성" : "결과 생성하기"}
        </button>
      </div>

      {apiLoading && <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">생성 중입니다...</div>}

      {!apiLoading && resultData && (
        <div>
          {lastMode === "sample" && (
            <div className="mb-4 inline-block rounded-full border border-[#fcd34d] bg-[#fffbeb] px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#b45309] uppercase">
              샘플 출력 (실제 AI 생성 결과 아님)
            </div>
          )}

          <ResultBlock index="01" title="시각 전략" content={resultData.strategy} />
          <ResultBlock index="02" title="표현 방향" content={resultData.direction} />
          <ResultBlock
            index="03"
            title="Firefly Prompt (English)"
            content={resultData.prompt}
            avoid={resultData.avoid}
            copyLabels={["Prompt 복사 (English)", "Avoid 복사 (English)"]}
            onCopyPrompt={() => copyText(resultData.prompt)}
            onCopyAvoid={() => copyText(resultData.avoid)}
          />
          <ResultBlock
            index="04"
            title="Firefly Prompt (국문)"
            content={resultData.prompt_ko}
            avoid={resultData.avoid_ko}
            copyLabels={["Prompt 복사 (국문)", "Avoid 복사 (국문)"]}
            onCopyPrompt={() => copyText(resultData.prompt_ko)}
            onCopyAvoid={() => copyText(resultData.avoid_ko)}
          />
        </div>
      )}
    </div>
  );
}
