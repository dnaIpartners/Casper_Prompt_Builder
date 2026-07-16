"use client";

import { useBuilder } from "../builder-context";
import { Field, TextArea, TextInput } from "../ui";

export default function Step1Page() {
  const { state, set } = useBuilder();

  return (
    <div className="flex flex-col gap-7">
      <Field label="기획전 주제" required desc="무엇을 위한 기획전인가.">
        <TextInput
          value={state.theme}
          onChange={(v) => set("theme", v)}
          placeholder="예: 여름맞이 프로모션 기획전"
        />
      </Field>
      <Field label="핵심 메시지" required desc="무엇을 전달할 것인가.">
        <TextInput
          value={state.message}
          onChange={(v) => set("message", v)}
          placeholder="예: 더위를 식혀주는 상쾌한 순간"
        />
      </Field>
      <Field
        label="분위기 및 감성 설명"
        required
        desc="어떤 장면과 감정을 느끼게 할 것인가. * 단어보다 문장, 단문보다 장문 설명 권장"
      >
        <TextArea
          long
          value={state.mood}
          onChange={(v) => set("mood", v)}
          placeholder="예: 이른 아침 물방울이 맺힌 유리병이 햇살에 반짝이는, 청량하고 차분한 순간"
        />
      </Field>
    </div>
  );
}
