"use client";

import { BuilderProvider, useBuilder } from "./builder-context";
import { ArrowLeftIcon, ArrowRightIcon, BTN, BTN_DANGER, BTN_PRIMARY, CheckIcon, RestartIcon } from "./ui";
import { STEP_TITLES, Step } from "./builder-model";

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <BuilderProvider>
      <BuilderShell>{children}</BuilderShell>
    </BuilderProvider>
  );
}

function BuilderShell({ children }: { children: React.ReactNode }) {
  const { currentStep, overallProgress, isStepComplete, goToStep, resultStale } = useBuilder();

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#111827]">
      <div className="mx-auto max-w-3xl px-6 pt-10 pb-32">
        {/* Brand */}
        <div className="mb-7">
          <span className="mb-2 block text-[11px] font-bold tracking-wider text-[#4090f1] uppercase">
            Adobe Firefly · Internal Tool
          </span>
          <h1 className="mb-1.5 text-[1.75rem] leading-tight font-extrabold tracking-tight">
            Firefly Prompt Builder
          </h1>
          <p className="m-0 text-sm leading-relaxed text-[#6b7280]">
            기획성 오브젝트 생성을 위한 4단계 프롬프트 표준화 도구
          </p>
        </div>

        {/* Top nav: progress + stepper */}
        <header className="sticky top-0 z-10 bg-[#f4f5f7] pt-3 pb-7">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">
              전체 입력 진행률
            </span>
            <span className="text-[11px] font-bold text-[#4090f1]">{overallProgress}%</span>
          </div>
          <div className="mb-5.5 h-1 overflow-hidden rounded-full bg-[#e5e7eb]">
            <div
              className="h-full rounded-full bg-[#4090f1] transition-[width] duration-200"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="rounded-xl border border-[#e5e7eb] bg-[#eceef1] px-4 pt-4.5 pb-3.5">
            <div className="flex">
              {([1, 2, 3, 4] as Step[]).map((i) => {
                const complete = isStepComplete(i);
                const active = i === currentStep;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToStep(i)}
                    className="relative flex flex-1 cursor-pointer flex-col items-center gap-2 bg-transparent"
                  >
                    {i !== 4 && (
                      <span className="absolute top-[15px] left-[calc(50%+20px)] right-[calc(-50%+20px)] -z-0 h-0.5 bg-[#d1d5db]" />
                    )}
                    <span
                      className={
                        "relative z-[1] flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 text-[13px] font-bold transition-all " +
                        (active || complete
                          ? "border-[#4090f1] bg-[#4090f1] text-white"
                          : "border-[#d1d5db] bg-white text-[#9ca3af]") +
                        (complete && !active ? " !bg-[#e4effc] !text-[#4090f1]" : "")
                      }
                    >
                      {complete ? <CheckIcon className="h-3.5 w-3.5" /> : i}
                    </span>
                    <span
                      className={
                        "text-xs font-semibold " +
                        (active ? "text-[#111827]" : "text-[#6b7280]")
                      }
                    >
                      {STEP_TITLES[i]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Step heading */}
        <div className="mt-1 mb-5">
          <span className="mb-1 block text-[11px] font-bold tracking-wide text-[#4090f1] uppercase">
            STEP {currentStep} / 4
          </span>
          <h2 className="m-0 text-[1.375rem] font-bold tracking-tight">{STEP_TITLES[currentStep]}</h2>
        </div>

        {resultStale && (
          <div className="mb-5 flex gap-2.5 rounded-lg border border-[#fcd34d] bg-[#fffbeb] p-3.5 text-[13px] leading-relaxed text-[#b45309]">
            <span className="flex-shrink-0 font-bold">⚠</span>
            <div>
              <strong className="mb-1 block text-sm">입력값이 결과 생성 이후 변경되었습니다</strong>
              {currentStep === 4 ? (
                <>아래 결과는 변경 전 입력값으로 생성된 이전 결과입니다. 위 버튼을 눌러 결과를 다시 생성해주세요.</>
              ) : (
                <>
                  현재 화면의 수정 내용은 아직 결과에 반영되지 않았습니다.{" "}
                  <button
                    type="button"
                    onClick={() => goToStep(4)}
                    className="cursor-pointer font-semibold text-inherit underline"
                  >
                    Step 4로 이동해 결과를 다시 생성
                  </button>
                  해주세요.
                </>
              )}
            </div>
          </div>
        )}

        {/* Panel: step-specific page content renders here */}
        <main className="rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-[0_1px_2px_rgba(17,24,39,.05)]">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const { currentStep, goToStep, resetAll } = useBuilder();

  return (
    <footer className="fixed right-0 bottom-0 left-0 mx-auto flex max-w-3xl justify-between border-t border-[#e5e7eb] bg-white px-6 py-4">
      {currentStep < 4 ? (
        <>
          <button
            type="button"
            className={BTN + " flex items-center gap-1.5"}
            disabled={currentStep === 1}
            onClick={() => goToStep((currentStep - 1) as Step)}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            이전
          </button>
          <button
            type="button"
            className={BTN_PRIMARY + " flex items-center gap-1.5"}
            onClick={() => goToStep((currentStep + 1) as Step)}
          >
            다음
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <button type="button" className={BTN + " flex items-center gap-1.5"} onClick={() => goToStep(3)}>
            <ArrowLeftIcon className="h-4 w-4" />
            이전
          </button>
          <button type="button" className={BTN_DANGER + " flex items-center gap-1.5"} onClick={resetAll}>
            <RestartIcon className="h-4 w-4" />
            처음부터 다시 생성
          </button>
        </>
      )}
    </footer>
  );
}
