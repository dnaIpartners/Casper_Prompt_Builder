import Anthropic from "@anthropic-ai/sdk";
import {
  ANGLE_OPTIONS,
  BGTYPE_OPTIONS,
  COMPOSITION_OPTIONS,
  MATERIAL_OPTIONS,
  MATERIAL_RENDERING_MATRIX,
  Material,
  Rendering,
  RENDERING_OPTIONS,
} from "../../(builder)/builder-model";

// Sonnet-tier model, per the PRD's original "claude-sonnet-4-6" spec — mapped to its
// current successor (see Anthropic model migration guide: Sonnet 4.6 -> claude-sonnet-5).
const MODEL = "claude-sonnet-5";

const REQUIRED_TEXT_FIELDS = [
  "theme",
  "message",
  "mood",
  "object",
  "assoc",
  "highlight",
  "background",
] as const;

const COMPOSITION_VALUES = COMPOSITION_OPTIONS.map((o) => o.value);
const ANGLE_VALUES = ANGLE_OPTIONS.map((o) => o.value);
const BGTYPE_VALUES = BGTYPE_OPTIONS.map((o) => o.value);
const RENDERING_VALUES = RENDERING_OPTIONS.map((o) => o.value);
const MATERIAL_VALUES = MATERIAL_OPTIONS.map((o) => o.value);

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    strategy: { type: "string" },
    direction: { type: "string" },
    prompt: { type: "string" },
    avoid: { type: "string" },
    prompt_ko: { type: "string" },
    avoid_ko: { type: "string" },
  },
  required: ["strategy", "direction", "prompt", "avoid", "prompt_ko", "avoid_ko"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `당신은 Adobe Firefly에 입력할 상업용 3D/CGI 오브젝트 이미지 프롬프트를 전문적으로 작성하는 어시스턴트입니다.

사용자가 JSON으로 기획 정보를 전달합니다 (theme/message/mood/object/assoc/highlight/composition/angle/bgType/background/rendering/realism/detail/material).

다음 6개 키를 가진 JSON 객체 하나만 생성하세요: strategy, direction, prompt, avoid, prompt_ko, avoid_ko. 그 외의 텍스트(설명, 마크다운 코드펜스 등)는 절대 출력하지 마세요.

1. strategy (국문): 이 컨셉을 시각적으로 어떻게 표현할지에 대한 전략을 번호 리스트 3~4개 항목으로 설명합니다.
2. direction (국문): 오브젝트·배경·렌더링·재질·강조 요소에 대한 구체적 시각 해석을 번호 리스트 3~4개 항목으로 설명합니다.
3. prompt (영문, Firefly 직접 입력용): 아래 순서를 반드시 지켜 하나의 자연스러운 영문 프롬프트로 작성합니다.
   [렌더링 방식 + 재질 스타일] → [메인 오브젝트 + 시각 강조 요소] → [연상 요소] → [배경 유형 + 배경 표현(색상은 반드시 자연어 색상 표현만 사용)] → [사실감 정도] → [디테일 강도] → [분위기/감성] → [화질]
4. avoid (영문): 기본 항목 "no text, no watermark, no logo, no cropping, no harsh drop shadows, no human figures"를 포함하고, bgType가 "other"면 "no background elements"를, rendering이 "clay_style" 또는 "illustrative_3d"면 "no photorealistic texture"를 추가합니다.
5. prompt_ko (국문): prompt 필드의 자연스러운 한국어 번역. 3D render, CGI, Splash 같은 디자인 전문 용어는 번역하지 말고 영문 그대로 둡니다.
6. avoid_ko (국문): avoid 필드의 자연스러운 한국어 번역.

절대 규칙: prompt와 배경 표현에 hex 코드(#으로 시작하는 색상 코드)를 절대 사용하지 마세요. 사용자가 hex 코드를 입력했더라도 가장 가까운 자연어 색상 표현으로 변환하세요. material 배열이 비어 있으면 재질을 별도로 언급하지 말고 렌더링 방식의 기본 재질감으로 표현하세요.`;

function errorResponse(message: string, status: number) {
  return Response.json({ error: { message, status } }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return errorResponse("서버에 ANTHROPIC_API_KEY가 설정되어 있지 않습니다.", 500);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 본문을 파싱할 수 없습니다.", 400);
  }

  for (const key of REQUIRED_TEXT_FIELDS) {
    const value = body[key];
    if (typeof value !== "string" || !value.trim()) {
      return errorResponse(`필수 항목이 누락되었습니다: ${key}`, 400);
    }
  }

  const composition = body.composition;
  const angle = body.angle;
  const bgType = body.bgType;
  const rendering = body.rendering;
  const material = Array.isArray(body.material) ? body.material : [];

  if (typeof composition !== "string" || !COMPOSITION_VALUES.includes(composition as never)) {
    return errorResponse("구성 방식 값이 올바르지 않습니다.", 400);
  }
  if (typeof angle !== "string" || !ANGLE_VALUES.includes(angle as never)) {
    return errorResponse("오브젝트 앵글 값이 올바르지 않습니다.", 400);
  }
  if (typeof bgType !== "string" || !BGTYPE_VALUES.includes(bgType as never)) {
    return errorResponse("배경 유형 값이 올바르지 않습니다.", 400);
  }
  if (typeof rendering !== "string" || !RENDERING_VALUES.includes(rendering as never)) {
    return errorResponse("렌더링 방식 값이 올바르지 않습니다.", 400);
  }
  for (const m of material) {
    if (typeof m !== "string" || !MATERIAL_VALUES.includes(m as never)) {
      return errorResponse("재질 스타일 값이 올바르지 않습니다.", 400);
    }
  }
  if (material.includes("glossy") && material.includes("soft_matte")) {
    return errorResponse("Glossy와 Soft Matte는 동시에 선택할 수 없습니다.", 400);
  }
  const matrix = MATERIAL_RENDERING_MATRIX[rendering as Rendering];
  for (const m of material as Material[]) {
    if (matrix[m] === "block") {
      return errorResponse(`${m}은(는) 현재 렌더링 방식과 어울리지 않는 조합입니다.`, 400);
    }
  }

  const userPayload = {
    theme: body.theme,
    message: body.message,
    mood: body.mood,
    object: body.object,
    assoc: body.assoc,
    highlight: body.highlight,
    composition,
    angle,
    bgType,
    background: body.background,
    rendering,
    realism: typeof body.realism === "string" ? body.realism : "mid",
    detail: typeof body.detail === "string" ? body.detail : "mid",
    material,
  };

  const client = new Anthropic({ apiKey });

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: RESPONSE_SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: JSON.stringify(userPayload) }],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Anthropic API 호출에 실패했습니다.";
    return errorResponse(message, 502);
  }

  if (response.stop_reason === "refusal") {
    return errorResponse(
      "안전 정책에 의해 요청이 거부되었습니다. 입력 내용을 조정해 다시 시도해주세요.",
      422
    );
  }
  if (response.stop_reason === "max_tokens") {
    return errorResponse(
      "응답이 최대 길이를 초과해 잘렸습니다. 입력을 조금 더 간결하게 작성해보세요.",
      502
    );
  }

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  if (!textBlock) {
    return errorResponse("AI 응답에서 텍스트를 찾을 수 없습니다.", 502);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    return errorResponse("AI 응답을 JSON으로 파싱하는 데 실패했습니다.", 502);
  }

  return Response.json(parsed);
}
