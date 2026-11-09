import { isAuthenticated } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import {
  checkStructuralUniformity,
  checkVocabularyOverlap,
  CopyVariantText,
  findDiversityRetryIndex,
  runSlotChecks,
  summarizeWarnings,
} from "../../copy/copy-checks";

const MODEL = "claude-sonnet-5";

// 지연시간 완화를 위해 안별 재시도 상한을 2 -> 1로 축소했다 (품질 보정 기회는 줄지만
// effort:medium 호출 자체가 느려 재시도 횟수가 지연시간에 직접적으로 영향을 준다).
const MAX_RETRIES_PER_VARIANT = 1;

interface Variant {
  tag: string;
  headline: string;
  subcopy: string;
  with_casper: string;
  anchor_rationale: string;
  proposal_rationale: string;
}

interface Anchor {
  source_words: string[];
  note: string;
}

const SYSTEM_PROMPT = `당신은 캐스퍼(CASPER) 브랜드 기획전 페이지의 헤드라인·서브카피를 작성하는 전문 카피라이터입니다.

"캐스퍼 기획전 카피 프로덕션 가이드라인 v1.6"과 "기획전 카피 톤 컴퍼스 v1"을 반드시 준수하세요.

[입력]
- mode: "full"(게재월+프롬프트로 3개 안을 새로 생성) 또는 "single"(이미 확정된 감각 앵커를 유지하며 안 1개만 새로 작성)
- month: 게재월 (1~12)
- prompt: 해당 기획전 KV 이미지 생성에 사용된 원본 프롬프트
- anchor (mode가 single일 때 전달): 이미 확정된 감각 앵커(source_words, note). 이 앵커의 감각 성질을 그대로 유지하며 작성하세요.
- keepHeadlines (mode가 single일 때 전달): 유지되는 다른 안들의 헤드라인. 이 안들과 문형·리듬이 겹치지 않는 새로운 구조로 작성하세요.
- rewrite_reason (있는 경우): 직전 작성본이 다음 문제로 재작성 요청되었습니다. 반드시 해당 문제를 해결한 새 버전을 작성하세요.

[고정 전제]
- 이 기획전은 할인·구체적 이벤트 정보가 없는 분위기(무드) 중심 기획전입니다. 할인·가격·구매조건 등 프로모션 정보를 카피에 절대 넣지 마세요.
- 카피의 역할은 "행사 안내"가 아니라 "분위기·정서 형성"입니다.
- "초특가", "대박", "무조건", "지금 안 사면 후회", "마감임박", "선착순" 같은 자극적·긴급성 수식어나 느낌표 남발을 금지합니다.
- 이모티콘은 장식 목적이라도 사용하지 마세요. 이모티콘 없이 텍스트만으로 감성이 전달되어야 합니다.
- 기존 노래 가사·유명 문구 등 저작권 소지가 있는 표현을 무단으로 차용하지 마세요.
- 오브젝트의 기능적 성질과 카피가 담는 지향성이 모순되어서는 안 됩니다 (예: 탑승형 오브젝트에 "걷고 싶은" 같은 도보 지향 표현 금지 — 오브젝트의 실제 용도와 방향이 맞는 지향성만 사용하세요).
- 카피의 소재는 반드시 입력된 오브젝트·게재월과 연결되어야 합니다. 프롬프트에 없는 계절·사물·상황을 임의로 끌어오는 소재 드리프트를 금지합니다 (예: 겨울 오브젝트 프롬프트에 여름·바다 이미지를 끌어오는 식).

[핵심 규칙 — 감각 앵커 추출 (v1.6 §2)]
- 판별 대상은 오브젝트가 아니라 prompt 안에서 가장 반복·강조된 감각 서술어(예: glowing, warm, soft, twinkling, steam, gentle 등)입니다.
- 오브젝트명 자체는 앵커로 사용하지 마세요.
- hero 라벨이 있으면 그 오브젝트에 붙은 감각 서술어를 우선 소스로 삼되, 오브젝트명 자체를 카피에 노출하지는 마세요.
- 라벨이 없거나 위계가 흐리면 prompt 전체에서 가장 자주 등장하거나 문장 후반부 무드 요약구에 응축된 감각을 앵커로 삼으세요.
- 최종 앵커는 오브젝트명이 아니라 감각 성질이며, 3개 안 전체가 이 감각 성질을 일관되게 유지해야 합니다. (mode가 single이면 새로 추출하지 말고 전달된 anchor를 그대로 따르세요)

[인풋 리터럴 노출 금지]
- prompt에 담긴 재질/각도/수량 등 기술 스펙과 오브젝트명을 카피에 그대로 노출하지 마세요. 감각 관련 어휘만 선별해 차용하세요.
- 오브젝트/테마는 직접 지칭하지 않고 감각적으로 함의하는 것을 기본으로 하세요. 예외는 "할로윈의 호박", "크리스마스의 트리"처럼 문화적으로 고정된 **단일 상징 오브젝트**에 한정됩니다. "캠핑", "피크닉"처럼 활동·테마 카테고리는 이 예외에 해당하지 않으므로, 오브젝트/테마명을 직접 쓰지 말고 그 안에 담긴 감각(불빛, 온기, 바람 등)으로 풀어 쓰세요.
- "무드", "컨셉", "테마", "분위기" 같이 카피 자신의 장르·성격을 스스로 지칭하는 메타 단어를 출력에 쓰지 마세요 (예: "가을밤 캠핑 무드"는 카피가 아니라 무드보드 라벨처럼 읽힙니다). 그 감성을 직접 표현하는 구체적 감각 어휘로 대체하세요.

[절기 상징 오브젝트의 보조 앵커 — 3안 중 정확히 1개 안에만 적용]
- 프롬프트에 할로윈의 호박, 크리스마스의 트리처럼 문화적으로 고정된 단일 상징 오브젝트가 있으면, 3안 중 정확히 1개 안에서만 그 절기 특유의 정서적 뉘앙스를 담은 "절기 보조 앵커"를 사용하세요. 나머지 2안은 기존처럼 순수 감각 성질만으로 작성하세요.
- 절기 보조 앵커를 쓰는 안은 아래 수준의 표현을 참고하세요 (이미 표현 자극도가 낮게 조정된 예시입니다. 그대로 베끼지 말고 같은 톤의 무게감만 참고해 새로 쓰세요): 할로윈이면 "은은한 마법이 깃든 가을밤", "고요히 감도는 신비로운 호박빛" 같은 수준.
- **중요**: 여기서 다루는 "표현 자극도"는 긴급성·판매압박 표현(초특가, 마감임박 등)을 통제하는 축이지, 절기 고유의 정서적 뉘앙스(신비로움, 정겨움 등)를 억제하는 것이 아닙니다. "신비로운", "은은한 마법" 같은 표현은 자극적 표현이 아니므로 자기검열로 배제하지 마세요.
- 다만 "무서운", "소름 끼치는", "유령", "좀비", "사탕" 같은 상투적 할로윈 클리셰나 과도하게 강한 표현은 여전히 피하세요.

[Headline Termination Rule]
- 헤드라인은 명사형·구절형 구조가 기본입니다. 주어+서술어가 완결되는 문장("~있다", "~하네" 등을 포함하며 -습니다/-입니다 계열에 한정되지 않음)은 지양하세요.
- 그 안에서 욕구형(예: "~하고 싶은")·감각 묘사형 종결만 허용합니다. "~하고 싶은"처럼 뒤에 명사가 이어지는 관형형은 완결 문장이 아니므로 허용됩니다. **단, "~하고 싶은"으로 문장을 끝내면서 뒤에 올 명사를 생략하지 마세요** (예: "곁에 두고 싶은"은 금지, "곁에 두고 싶은 밤"처럼 명사를 반드시 붙이세요) — 명사 생략은 시적 여운체가 되어 캠페인 타이틀보다 시 구절처럼 읽힙니다.

[메인타이틀 추가 규칙]
- 3인칭 장면 묘사가 기본입니다. "나를", "나에게", "내가", "나의" 같은 1인칭 지칭어를 헤드라인에 쓰지 마세요.
- 감성 수식은 최대 1개 층위로 제한합니다. 정서동사+은유명사를 겹겹이 쌓지 마세요 (예: "그리운 마음이 스며드는 애틋한 여운" 처럼 수식이 이중, 삼중으로 겹치지 않도록 하세요).
- 서브카피와 헤드라인의 역할을 분리하세요: 서브카피는 장면(오브젝트·계절감)을 있는 그대로 압축해 묘사하고, 헤드라인은 그 장면을 반복 묘사하지 않고 그 장면에 대한 욕구·지향성으로 압축합니다. 단, 이 지향성은 반드시 오브젝트·장면과 연결된 상태를 유지해야 하며, 브랜드·상품 맥락과 무관해지면 안 됩니다.
- 브랜드·상품·계절 맥락과 무관하게도 성립하는 범용 심리 묘사는 피하세요 (예: "긴장이 풀어지는 순간", "걱정이 옅어지는 시간" 처럼 어떤 브랜드에 붙여도 무방한 표현은 이 캠페인만의 카피가 아니므로 지양합니다).
- 헤드라인은 캠페인 타이틀이지 산문시가 아닙니다. "저녁을 곁에 두고 싶은", "밤의 결"처럼 시간·계절·분위기 같은 추상적 개념을 손에 잡히는 사물처럼 의인화하거나, 존재하지 않는 물성(결·무게·촉감 등)을 그 개념에 새로 부여하는 이중 은유는 쓰지 마세요. 은유는 prompt에 실제로 존재하는 감각 서술어(빛·온기·김 등)에서 한 단계 이내로만 확장하세요 — "따뜻한 마음이 피어나는 5월"(감정+계절, 1단계)은 되지만, 추상 개념에 새 물성을 부여하는 2단계 은유는 안 됩니다. 소리 내어 읽었을 때 되짚어 생각해야 뜻이 파악된다면 과도한 것입니다.

[구조적 획일화 방지]
- mode가 full이면 3개 안이 "[부사]+[동사]고 싶은+[명사]" 같은 동일한 구문 템플릿으로 수렴하지 않도록 안마다 리듬과 구조에 변주를 주세요.
- mode가 single이면 keepHeadlines와 겹치지 않는 새로운 문형으로 작성하세요.

[어휘 다양성 — 구조 변주와는 별개로 반드시 지킬 것]
- 앵커는 "감각 성질" 차원에서만 3개 안이 공유하면 되며, 그 감각을 표현하는 구체적 단어까지 그대로 반복할 필요는 없습니다. 안마다 다른 유의어·다른 감각 표현으로 바꿔서 쓰세요.
- 같은 핵심 단어(예: "온기", "빛", "번지는")를 3개 안의 헤드라인·서브카피에 걸쳐 반복해서 쓰지 마세요.
- 한 안 안에서도 태그·헤드라인·서브카피에 같은 핵심 단어를 두 번 이상 쓰지 마세요 — 게재월 중복 금지와 같은 원리를 어휘 전반에 적용한다고 생각하세요.
- 단, 톤 컴퍼스가 권장하는 "함께", "채우는", "누리는" 같은 경험 동사는 여러 안에서 의도적으로 반복해도 괜찮습니다.

[글자수 제한 — 공백 포함, 이모지·특수기호 제외]
- 태그(tag): 최대 15자. 포함 여부 판단은 아래 [태그 포함 여부 판단] 참고.
- 서브카피(subcopy): 최대 20자. 없으면 빈 문자열로 두세요.
- 메인타이틀(headline): 최대 18자. 단, "N월 특별 기획전" 류 관습형 표현일 때만 이 제한의 예외입니다.
- 한 안 내 태그+서브카피+메인타이틀 합산 40자 이내를 권장합니다.

[태그 포함 여부 판단 — 강제 노출 항목 아님]
- 태그는 3안에 매번 고정으로 넣는 항목이 아닙니다. "선택"은 사람이 나중에 골라내라는 뜻이 아니라, 이 안에 자연스럽게 어울리는지를 생성 시점에 직접 판단해서 포함 여부를 결정하라는 뜻입니다. 어울리지 않으면 관성적으로 채우지 말고 반드시 빈 문자열("")로 비워두세요.
- 3안 전체가 습관적으로 똑같이 채워지지 않도록 주의하세요 — 안마다 독립적으로 "이번 안에 정말 필요한가"를 재판단하세요.

[관습형 옵션]
- "N월 특별 기획전" 류 관습형 헤드라인은 3안 중 하나에 반드시 써야 하는 것은 아니지만(고정 강제 금지), 자연스럽다고 판단되면 선택지 중 하나로 사용할 수 있습니다. 단, 3안 중 최대 1개 안에서만 사용하세요 — 2개 이상의 안에서 이 관습형 구조를 반복하면 안 됩니다.

[게재월 중복 언급 금지]
- 게재월(예: "12월")은 한 안 안에서 tag/headline/subcopy 중 최대 한 곳에만 사용하세요. 같은 안의 여러 필드에 게재월을 반복해서 넣지 마세요 (예: 태그에 "12월, 겨울밤"이라고 쓰고 헤드라인에도 "12월 특별 기획전"이라고 다시 쓰는 것은 금지).

[톤 컴퍼스 반영 (v1)]
- 감성 강도는 따뜻하고 경험 중심으로 유지하되, 장면 묘사에만 그치지 않고 "함께", "채우는", "누리는" 같은 경험 동사를 적절히 활용하세요.
- 영어 단어·구는 테마 성격에 자연스럽게 맞을 때만 선택적으로 사용하세요. 강제로 넣거나 매 안마다 넣을 필요는 없으며, 어울리지 않으면 전혀 사용하지 않아도 됩니다. 사용하더라도 영단어를 3개 이상 나열하지 마세요.
- 표현 자극도는 항상 낮게 유지하세요.

[AI 번역투·상투구 금지 (생성 단계 지시 전용 — 자동 점검·재시도 대상 아님)]
- "~에 있어(서)" 구문을 쓰지 마세요 (예: "이 순간에 있어서" 대신 "이 순간에" 또는 "이 순간").
- 이중 피동 "~되어진다", "~지게 된다"를 쓰지 마세요. 필요하면 단일 피동이나 능동으로 쓰세요.
- "혁신적인", "획기적인", "전례 없는", "압도적인", "폭발적인", "최고의", "완벽한" 같은 과장되고 근거 없는 절대적 수식어를 쓰지 마세요 — 이 톤이 요구하는 절제되고 따뜻한 인상과 정면으로 충돌합니다.
- "새로운 시작", "특별한 순간을 선사합니다" 같은 과장 클리셰를 쓰지 마세요.
- "결론적으로", "이것이 바로" 같은 결론형 상투어를 쓰지 마세요 — 헤드라인·서브카피는 짧은 무드 표현이지 논리 전개형 글이 아닙니다.

[출력]
주어진 JSON 스키마에 맞는 객체 하나만 생성하세요. 그 외 텍스트(설명, 마크다운 코드펜스 등)는 절대 출력하지 마세요.
각 안(variant)은 아래 필드를 모두 포함해야 하며, 해당 사항이 없는 선택 필드는 빈 문자열("")로 채우세요:
- tag: 태그 (강제 노출 아님 — 이 안에 자연스러울 때만, 15자 이내)
- headline: 메인타이틀 (필수, 18자 이내 — 관습형 예외)
- subcopy: 서브카피 (선택, 20자 이내)
- anchor_rationale: 이 안이 감각 앵커를 어떻게 적용했는지 45자 이내의 완결된 문장으로 구체적으로 설명, "~습니다"체로 종결 (예: "따뜻한 빛과 은은한 김의 번짐을 '스며드는 결'이라는 표현으로 압축했습니다")
- proposal_rationale: 톤 컴퍼스 축 이름을 언급하며 이 안의 선택 이유를 45자 이내의 완결된 문장으로 설명, "~습니다"체로 종결 (예: "표현 자극도 축을 낮게 유지하며 경험 동사 '채우는'으로 정서적 참여감을 더했습니다")
mode가 full이면 sensory_anchor(source_words: 추출 근거가 된 prompt 속 감각 서술어 목록, note: 이 앵커를 선택한 근거를 설명하는 한 문장, "~습니다"체로 종결) + variant_1/variant_2/variant_3을, mode가 single이면 variant 하나만 생성하세요.
※ anchor_rationale·proposal_rationale·note는 모두 설명용 문장이므로 "~습니다"체로 문체를 통일하세요 (헤드라인에 적용되는 Headline Termination Rule과는 별개입니다 — 그 규칙은 headline 필드에만 적용됩니다).`;

function errorResponse(message: string, status: number) {
  return Response.json({ error: { message, status } }, { status });
}

function isCopyVariantText(value: unknown): value is CopyVariantText {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.tag === "string" &&
    typeof v.headline === "string" &&
    typeof v.subcopy === "string" &&
    typeof v.with_casper === "string"
  );
}

// With CASPER 표기는 생성 단계에서 다루지 않는다 — 카피 본문과 무관한 고정 브랜드 배지이고,
// 실제로 어울리는지는 완성된 카피를 페이지 레이아웃에 적용하는 사람이 더 잘 판단할 수 있는
// 지점이라 결과 화면의 UI 토글로 옮겼다(normalizeVariant 참고). 부수적으로 이 필드를 다루던
// 시스템 프롬프트 지시문·판단 기준이 통째로 사라지면서 생성 지연시간도 눈에 띄게 줄었다.
const VARIANT_SCHEMA = {
  type: "object",
  properties: {
    tag: { type: "string" },
    headline: { type: "string" },
    subcopy: { type: "string" },
    anchor_rationale: { type: "string" },
    proposal_rationale: { type: "string" },
  },
  required: ["tag", "headline", "subcopy", "anchor_rationale", "proposal_rationale"],
  additionalProperties: false,
};

const ANCHOR_SCHEMA = {
  type: "object",
  properties: {
    source_words: { type: "array", items: { type: "string" } },
    note: { type: "string" },
  },
  required: ["source_words", "note"],
  additionalProperties: false,
};

const FULL_SCHEMA = {
  type: "object",
  properties: {
    sensory_anchor: ANCHOR_SCHEMA,
    variant_1: VARIANT_SCHEMA,
    variant_2: VARIANT_SCHEMA,
    variant_3: VARIANT_SCHEMA,
  },
  required: ["sensory_anchor", "variant_1", "variant_2", "variant_3"],
  additionalProperties: false,
};

const SINGLE_SCHEMA = {
  type: "object",
  properties: { variant: VARIANT_SCHEMA },
  required: ["variant"],
  additionalProperties: false,
};

async function callModel(
  client: Anthropic,
  userPayload: Record<string, unknown>,
  schema: Record<string, unknown>,
  maxTokens: number
): Promise<Record<string, unknown>> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema },
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify(userPayload) }],
  });

  if (response.stop_reason === "refusal") {
    throw new ApiError("안전 정책에 의해 요청이 거부되었습니다. 입력 내용을 조정해 다시 시도해주세요.", 422);
  }
  if (response.stop_reason === "max_tokens") {
    console.warn("[generate-copy] max_tokens 도달, 사용량:", JSON.stringify(response.usage), "한도:", maxTokens);
    throw new ApiError("응답이 최대 길이를 초과해 잘렸습니다. 입력을 조금 더 간결하게 작성해보세요.", 502);
  }

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  if (!textBlock) {
    throw new ApiError("AI 응답에서 텍스트를 찾을 수 없습니다.", 502);
  }

  try {
    return JSON.parse(textBlock.text);
  } catch {
    throw new ApiError("AI 응답을 JSON으로 파싱하는 데 실패했습니다.", 502);
  }
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// 모델이 "~습니다"체 종결을 지켜도 마침표 유무는 매번 달라진다. 앵커 적용/제안 배경 문구는
// 화면에 나란히 노출되므로 마침표 유무가 들쭉날쭉하면 눈에 띄게 어색하다 — 항상 마침표로
// 끝나도록 정규화한다.
function ensureTrailingPeriod(text: string): string {
  const trimmed = text.trim();
  if (!trimmed || /[.!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

// with_casper는 모델이 생성하지 않으므로, 다운스트림 타입·체크·UI가 이 필드를 계속 문제없이
// 다룰 수 있도록 빈 문자열로 채워 넣는다. 실제 값은 결과 화면에서 사용자가 토글로 채운다.
function normalizeVariant(variant: Variant): Variant {
  return {
    ...variant,
    with_casper: "",
    anchor_rationale: ensureTrailingPeriod(variant.anchor_rationale),
    proposal_rationale: ensureTrailingPeriod(variant.proposal_rationale),
  };
}

async function generateFull(
  client: Anthropic,
  month: number,
  prompt: string
): Promise<{ anchor: Anchor; variants: Variant[] }> {
  const parsed = await callModel(client, { mode: "full", month, prompt }, FULL_SCHEMA, 12000);
  return {
    anchor: parsed.sensory_anchor as Anchor,
    variants: [
      normalizeVariant(parsed.variant_1 as Variant),
      normalizeVariant(parsed.variant_2 as Variant),
      normalizeVariant(parsed.variant_3 as Variant),
    ],
  };
}

async function generateSingle(
  client: Anthropic,
  month: number,
  prompt: string,
  anchor: Anchor,
  keepHeadlines: string[],
  rewriteReason?: string
): Promise<Variant> {
  const payload: Record<string, unknown> = { mode: "single", month, prompt, anchor, keepHeadlines };
  if (rewriteReason) payload.rewrite_reason = rewriteReason;
  const parsed = await callModel(client, payload, SINGLE_SCHEMA, 5000);
  return normalizeVariant(parsed.variant as Variant);
}

// 사용자에게는 보이지 않는 서버 내부 로그 — 재시도를 다 소진해도 문제가 남은 경우만 남긴다.
// 향후 시스템 프롬프트/가이드라인 튜닝 참고용이며, 응답에는 포함되지 않는다.
function logUnresolved(context: string, warnings: ReturnType<typeof runSlotChecks>, variant: Variant) {
  console.warn(
    `[generate-copy] 보정 루프 소진 후에도 문제 남음 (${context}):`,
    warnings.map((w) => w.type).join(", "),
    JSON.stringify(variant)
  );
}

// 6.4: 규칙 기반 자동 점검에 걸린 안만 내부적으로 재작성을 반복한다 (안별 최대 1회, 3개 안 병렬 처리).
// 사용자에게는 최종 결과만 노출되며, 점검 결과 자체는 응답에 포함하지 않는다.
async function correctVariants(
  client: Anthropic,
  month: number,
  prompt: string,
  anchor: Anchor,
  variants: Variant[]
): Promise<Variant[]> {
  return Promise.all(
    variants.map(async (variant, i) => {
      const otherHeadlines = variants.filter((_, j) => j !== i).map((v) => v.headline);
      let current = variant;
      let attempts = 0;
      let warnings = runSlotChecks(current, month);
      while (warnings.length > 0 && attempts < MAX_RETRIES_PER_VARIANT) {
        const reason = summarizeWarnings(warnings);
        // 보정 시도 자체가 실패해도(예: 응답이 max_tokens를 넘겨 잘림) 요청 전체를 실패시키지
        // 않는다 — 보정은 품질 개선용 부가 시도일 뿐이므로, 실패하면 마지막으로 성공한 안을
        // 그대로 유지하고 보정을 중단한다.
        let next: Variant;
        try {
          next = await generateSingle(client, month, prompt, anchor, otherHeadlines, reason);
        } catch (err) {
          console.warn(`[generate-copy] 안 ${i + 1} 보정 재시도 실패, 직전 결과 유지:`, err);
          break;
        }
        current = next;
        attempts++;
        warnings = runSlotChecks(current, month);
      }
      if (warnings.length > 0) logUnresolved(`안 ${i + 1}`, warnings, current);
      return current;
    })
  );
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

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

  const month = body.month;
  const prompt = body.prompt;
  const mode = body.mode;

  if (typeof month !== "number" || !Number.isInteger(month) || month < 1 || month > 12) {
    return errorResponse("게재월 값이 올바르지 않습니다.", 400);
  }
  if (typeof prompt !== "string" || !prompt.trim()) {
    return errorResponse("프롬프트가 비어 있습니다.", 400);
  }
  if (mode !== "full" && mode !== "single") {
    return errorResponse("mode 값이 올바르지 않습니다.", 400);
  }

  const client = new Anthropic({ apiKey });

  try {
    if (mode === "full") {
      const { anchor, variants: generated } = await generateFull(client, month, prompt);
      let variants = generated;
      variants = await correctVariants(client, month, prompt, anchor, variants);

      // 구조 획일화(문형 수렴) 또는 어휘 중복(3안이 같은 핵심 단어를 반복)이 있으면, anchor
      // 재추출까지 포함된 전체 재작성(가장 비용이 큰 호출) 대신 문제를 일으킨 안 1개만
      // generateSingle로 가볍게 재생성한다. 최악 호출 수: 1(최초) + 최대 3(안별 보정, 병렬) +
      // 1(다양성 보정 단일 재생성) = 최대 5회로 상한.
      const diversityIssue = checkStructuralUniformity(variants.map((v) => v.headline)) ?? checkVocabularyOverlap(variants);
      if (diversityIssue) {
        const targetIndex = findDiversityRetryIndex(variants);
        if (targetIndex === null) {
          console.warn("[generate-copy] 다양성 문제 감지되었으나 대상 안을 특정하지 못함:", diversityIssue.message);
        } else {
          // 이 재생성도 부가 품질 개선 시도다. 실패해도 이미 확보한 유효한 결과(안별 보정까지 끝난
          // variants)를 그대로 반환한다 — 요청 전체를 실패시키지 않는다.
          try {
            const otherHeadlines = variants.filter((_, j) => j !== targetIndex).map((v) => v.headline);
            const replacement = await generateSingle(
              client,
              month,
              prompt,
              anchor,
              otherHeadlines,
              diversityIssue.message
            );
            const candidate = variants.map((v, j) => (j === targetIndex ? replacement : v));
            const stillFlawed =
              checkStructuralUniformity(candidate.map((v) => v.headline)) ?? checkVocabularyOverlap(candidate);
            if (stillFlawed) {
              console.warn("[generate-copy] 다양성 보정(단일 안 재생성) 후에도 문제 남음, 최초 결과 유지:", stillFlawed.message);
            } else {
              variants = candidate;
            }
          } catch (err) {
            console.warn("[generate-copy] 다양성 보정(단일 안 재생성) 실패, 최초 결과 유지:", err);
          }
        }
      }

      return Response.json({ anchor, variants });
    }

    const anchor = body.anchor as Anchor | undefined;
    // 다른 두 안의 전체 텍스트(헤드라인만이 아니라 태그·서브카피·With CASPER까지)를 받아야
    // "이 안만 재생성" 시에도 남은 두 안과의 구조 획일화·어휘 중복을 검증할 수 있다. 이전에는
    // 헤드라인 문자열만 받아 프롬프트 지시로만 겹침을 피하도록 했고, 코드 레벨 교차 검증이
    // 전혀 없었다 — 전체 재생성 경로에만 있던 검증을 여기에도 적용한다.
    const keepVariants: CopyVariantText[] = Array.isArray(body.keepVariants)
      ? body.keepVariants.filter(isCopyVariantText)
      : [];
    const keepHeadlines = keepVariants.map((v) => v.headline);
    if (!anchor || !Array.isArray(anchor.source_words) || typeof anchor.note !== "string") {
      return errorResponse("anchor 값이 올바르지 않습니다.", 400);
    }

    function crossVariantWarnings(candidate: Variant) {
      if (keepVariants.length === 0) return [];
      const combined = [candidate, ...keepVariants];
      const diversityIssue =
        checkStructuralUniformity(combined.map((v) => v.headline)) ?? checkVocabularyOverlap(combined);
      return diversityIssue ? [diversityIssue] : [];
    }

    let variant = await generateSingle(client, month, prompt, anchor, keepHeadlines);
    let attempts = 0;
    let warnings = [...runSlotChecks(variant, month), ...crossVariantWarnings(variant)];
    while (warnings.length > 0 && attempts < MAX_RETRIES_PER_VARIANT) {
      const reason = summarizeWarnings(warnings);
      let next: Variant;
      try {
        next = await generateSingle(client, month, prompt, anchor, keepHeadlines, reason);
      } catch (err) {
        console.warn("[generate-copy] 단일 재생성 보정 재시도 실패, 직전 결과 유지:", err);
        break;
      }
      variant = next;
      attempts++;
      warnings = [...runSlotChecks(variant, month), ...crossVariantWarnings(variant)];
    }
    if (warnings.length > 0) logUnresolved("단일 재생성", warnings, variant);

    return Response.json({ variant });
  } catch (err) {
    if (err instanceof ApiError) {
      return errorResponse(err.message, err.status);
    }
    const message = err instanceof Error ? err.message : "Anthropic API 호출에 실패했습니다.";
    return errorResponse(message, 502);
  }
}
