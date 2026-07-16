"use client";

import { useBuilder } from "../builder-context";
import {
  BGTYPE_OPTIONS,
  DETAIL_OPTIONS,
  MATERIAL_LABELS,
  MATERIAL_OPTIONS,
  REALISM_OPTIONS,
  RENDERING_OPTIONS,
  getMaterialRelation,
} from "../builder-model";
import { Card, Chip, Field, TextArea, ToggleButton } from "../ui";

export default function Step3Page() {
  const {
    state,
    set,
    selectRendering,
    toggleMaterial,
    isMaterialDisabled,
    renderingAccordionOpen,
    setRenderingAccordionOpen,
  } = useBuilder();

  return (
    <div className="flex flex-col gap-7">
      <Field label="배경 유형" required>
        <div className="flex flex-wrap gap-2">
          {BGTYPE_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={state.bgType === opt.value}
              onClick={() => set("bgType", opt.value)}
            />
          ))}
        </div>
      </Field>

      <Field label="배경 표현 설명" required desc="어떤 공간을 만들 것인가. 색상·재질·분위기를 포함해 자유 서술">
        <TextArea
          long
          value={state.background}
          onChange={(v) => set("background", v)}
          placeholder="예: 부드러운 연한 코랄핑크에서 아이보리로 이어지는 그라디언트 배경"
        />
        <p className="mt-2 text-xs leading-relaxed text-[#9ca3af]">
          ※ 힌트: 색상은 Hex code보다 자연어 표현이 더 정확하게 반영됩니다. (예: #FFB6C1 → 연한 코랄핑크)
        </p>
      </Field>

      <Field label="렌더링 방식" required>
        <div className="flex flex-wrap gap-2.5">
          {RENDERING_OPTIONS.map((opt) => (
            <Card
              key={opt.value}
              title={opt.title}
              sub={opt.sub}
              selected={state.rendering === opt.value}
              onClick={() => selectRendering(opt.value)}
            />
          ))}
        </div>

        {state.rendering && (
          <div className="mt-3 overflow-hidden rounded-lg border border-[#e5e7eb] text-center">
            <button
              type="button"
              onClick={() => setRenderingAccordionOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2.5 bg-[#f4f5f7] px-3.5 py-3 text-left text-[13px] font-bold text-[#6b7280]"
            >
              <span>사실감 정도 · 디테일 강도 설정</span>
              <span
                className={
                  "flex-shrink-0 text-[#9ca3af] transition-transform " +
                  (renderingAccordionOpen ? "rotate-180" : "")
                }
              >
                ▾
              </span>
            </button>
            {renderingAccordionOpen && (
              <div className="bg-white p-4 text-left">
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#6b7280]">
                    사실감 정도{" "}
                    <span className="rounded-full bg-[#f4f5f7] px-1.5 py-0.5 text-[10.5px] font-bold text-[#9ca3af] uppercase">
                      선택 (기본값: Balanced/중간)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {REALISM_OPTIONS.map((opt) => (
                      <ToggleButton
                        key={opt.value}
                        label={opt.label}
                        sub={opt.sub}
                        selected={state.realism === opt.value}
                        onClick={() => set("realism", opt.value)}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-3.5">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#6b7280]">
                    디테일 강도{" "}
                    <span className="rounded-full bg-[#f4f5f7] px-1.5 py-0.5 text-[10.5px] font-bold text-[#9ca3af] uppercase">
                      선택 (기본값: 중간)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DETAIL_OPTIONS.map((opt) => (
                      <ToggleButton
                        key={opt.value}
                        label={opt.label}
                        selected={state.detail === opt.value}
                        onClick={() => set("detail", opt.value)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Field>

      <Field
        label="재질 스타일"
        desc="중복 선택이 가능합니다. 다만 Glossy(광택)와 Soft Matte(무광)처럼 서로 반대되는 마감은 동시에 선택할 수 없으며, 이 경우 비활성화된 칩에 마우스를 올리면 사유가 표시됩니다."
      >
        <div className="flex flex-wrap gap-2">
          {MATERIAL_OPTIONS.map((opt) => {
            const relation = getMaterialRelation(state.rendering, opt.value);
            const disabled = isMaterialDisabled(opt.value);
            const selected = !disabled && state.material.includes(opt.value);
            const subtle = !disabled && relation === "subtle";
            let tooltip = "";
            if (disabled) {
              if (relation === "block") tooltip = "현재 렌더링 방식과 어울리지 않는 조합입니다";
              else if (opt.value === "glossy")
                tooltip = MATERIAL_LABELS.soft_matte + "와 동시에 선택할 수 없는 조합입니다";
              else if (opt.value === "soft_matte")
                tooltip = MATERIAL_LABELS.glossy + "와 동시에 선택할 수 없는 조합입니다";
            } else if (subtle) {
              tooltip = "완화된 형태로 은은하게 반영됩니다";
            }
            return (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={selected}
                disabled={disabled}
                subtleHint={subtle}
                title={tooltip}
                onClick={() => toggleMaterial(opt.value)}
              />
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[#9ca3af]">
          ※ 참고: &apos;완화 적용&apos; 표시가 붙은 항목은 선택해도 완전히 반영되지 않고 은은한 정도로만 표현됩니다.
        </p>
      </Field>
    </div>
  );
}
