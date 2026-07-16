"use client";

import { useBuilder } from "../builder-context";
import { ANGLE_OPTIONS, COMPOSITION_OPTIONS } from "../builder-model";
import { Card, Chip, ExampleAccordion, Field, TextArea } from "../ui";

export default function Step2Page() {
  const { state, set, exampleOpen, setExampleOpen } = useBuilder();

  return (
    <div className="flex flex-col gap-7">
      <Field
        label="메인 오브젝트"
        required
        desc="가장 중심이 되는 Hero Object. 오브젝트가 놓인 방식까지 포함해 자유 서술"
      >
        <TextArea
          long
          value={state.object}
          onChange={(v) => set("object", v)}
          placeholder="예: 반투명한 유리 향수병이 젖은 대리석 위에 놓여 있다"
        />
        <ExampleAccordion open={exampleOpen} onToggle={() => setExampleOpen((o) => !o)} />
      </Field>

      <Field label="연상 요소" required desc="메인 오브젝트를 보완하는 요소.">
        <TextArea
          value={state.assoc}
          onChange={(v) => set("assoc", v)}
          placeholder="예: 흩날리는 물방울, 은은하게 퍼지는 입자"
        />
      </Field>

      <Field label="시각 강조 요소" required desc="어떤 효과를 시각적으로 가장 강하게 표현할 것인가.">
        <TextArea
          value={state.highlight}
          onChange={(v) => set("highlight", v)}
          placeholder="예: 표면에 맺힌 물방울이 빛을 받아 반짝이는 하이라이트"
        />
      </Field>

      <Field label="구성 방식" required>
        <div className="flex flex-wrap gap-2.5">
          {COMPOSITION_OPTIONS.map((opt) => (
            <Card
              key={opt.value}
              title={opt.title}
              sub={opt.sub}
              selected={state.composition === opt.value}
              onClick={() => set("composition", opt.value)}
            />
          ))}
        </div>
      </Field>

      <Field label="오브젝트 앵글" required>
        <div className="flex flex-wrap gap-2">
          {ANGLE_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={state.angle === opt.value}
              onClick={() => set("angle", opt.value)}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}
