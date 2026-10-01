// 6.4 규칙 기반 자동 점검 — 서버(API 라우트의 내부 자동 보정 루프)와 클라이언트 어디서든
// 재사용할 수 있도록 React/브라우저 의존성 없는 순수 함수로 둔다.

export interface CopyVariantText {
  tag: string;
  headline: string;
  subcopy: string;
  with_casper: string;
}

export type WarningType =
  | "sensory_mismatch"
  | "termination"
  | "structure_uniform"
  | "aggressive_expression"
  | "character_limit"
  | "month_repeat"
  | "month_mismatch"
  | "first_person"
  | "word_repeat";

export interface CopyWarning {
  type: WarningType;
  message: string;
}

const ONOMATOPOEIA_RULES: { forms: string[]; category: string; incompatibleVerbs: string[] }[] = [
  { forms: ["타닥타닥"], category: "타격·연소음", incompatibleVerbs: ["번지", "스며들", "퍼지"] },
  { forms: ["반짝이", "반짝반짝"], category: "점멸", incompatibleVerbs: ["번지", "스며들", "퍼지"] },
];

const AGGRESSIVE_PHRASES = [
  "초특가", "대박", "무조건", "지금 안 사면 후회", "한정특가", "파격가", "역대급 할인",
  "마감임박", "선착순",
];

// 메인타이틀 규칙1: 3인칭 장면 묘사가 기본이며 1인칭 지칭어는 지양한다.
// "내"는 "내려앉은"처럼 무관한 단어에도 흔히 포함되므로, 조사가 붙어 명확히 1인칭 지칭으로만 쓰이는
// 형태(나를/나에게/나의/내가)만 검사해 오탐을 피한다.
const FIRST_PERSON_PATTERNS = ["나를", "나에게", "나에겐", "나의", "내가"];

// v1.1: "-습니다" 계열뿐 아니라 "~있다/~하네" 등 주어+서술어가 완결되는 일반 종결어미까지 폭넓게 탐지한다.
// 다만 "~고 싶은"처럼 뒤에 명사가 오는 관형형(욕구형) 어미는 완결 문장이 아니므로 대상이 아니다.
const TERMINATION_ENDINGS = [
  "있다", "없다", "않다", "한다", "했다", "이다", "니다",
  "하네", "이네", "어요", "아요", "네요", "군요", "구나", "거든", "잖아", "란다", "는다",
];
const TERMINATION_REGEX = new RegExp(`(${TERMINATION_ENDINGS.join("|")})[.!]?\\s*$`);

const UNIFORM_TEMPLATE_REGEX = /고\s*싶은\s*[가-힣]+/;

// "~하고 싶은"은 뒤에 명사가 이어질 때만 허용되는 관형형이다(Headline Termination Rule).
// 명사 없이 "~고 싶은"에서 그대로 끝나면 목적어를 생략한 여운체(예: "곁에 두고 싶은")가 되어
// 오히려 시적 여운을 만드는 효과를 내므로, 이 경우는 명사가 있는 형태와 달리 위반으로 본다.
const DANGLING_DESIRE_REGEX = /(?:하고|고)\s*싶은[.!]?\s*$/;

// v1.1: "N월 특별 기획전" 관습형 메인타이틀은 글자수 제한(18자)의 예외로 처리한다.
// "특별"이라는 단어에 고정하면 "12월 겨울 기획전", "12월, 반짝임을 담은 기획전"처럼 실제로
// 생성되는 유사 관습형 헤드라인을 놓친다 — "N월 ... 기획전" 형태 전반을 관습형으로 인식하도록
// 사이 구간을 느슨하게(최대 12자) 허용한다.
const CONVENTIONAL_HEADLINE_REGEX = /\d{1,2}\s*월.{0,12}?기획전/;

// 게재월("N월") 표현이 한 안의 여러 필드에 걸쳐 중복 언급되는 것을 탐지한다.
const MONTH_MENTION_REGEX = /\d{1,2}\s*월/g;

// 어휘 반복 탐지: 공백 기준 어절 단위로 비교하되, 흔한 조사를 뗀 뒤 비교한다("빛이"/"빛을" → "빛").
// 완전한 형태소 분석은 아니라서 놓치는 경우가 있을 수 있지만, 같은 명사 어근에 조사만 붙어
// 반복되는 가장 흔한 패턴은 잡아낸다. 톤 컴퍼스가 권장하는 경험 동사는 의도된 반복이므로 제외한다.
const WORD_REPEAT_STOPWORDS = new Set([
  "그리고", "그러나", "하지만", "그런", "이런", "저런", "함께", "채우는", "누리는",
  // 1글자 허용에 따라 단독으로 자주 쓰이는 지시어·부사도 제외한다 (반복돼도 문제 아님).
  "그", "이", "저", "다", "좀", "곧", "또", "늘", "막", "안", "밖", "위", "옆", "꼭",
]);
// 이 톤에서 핵심 어휘가 "빛/밤/결/향"처럼 한 글자 명사인 경우가 많아 최소 길이를 1로 둔다.
// 단독 eojeol로 쓰인 한 글자는 조사가 아니라 대부분 실제 단어이므로(조사는 항상 앞말에 붙는
// 의존형태소라 자기 혼자 어절을 이루지 않음) 오탐 위험이 낮다.
const WORD_REPEAT_MIN_LENGTH = 1;

const PARTICLE_SUFFIXES = [
  "에게서", "으로부터", "로부터", "이라서", "이지만", "이나마", "이라도",
  "에게", "에는", "에도", "으로", "까지", "부터", "마저", "조차", "이며", "이랑", "처럼", "같이", "만큼",
  "지만", "라서", "라도",
  "은", "는", "이", "가", "을", "를", "의", "에", "로", "와", "과", "도", "만", "랑", "나",
].sort((a, b) => b.length - a.length);

// 조사로 보이는 접미사를 제거한 어근을 반환한다. 어근이 완전히 없어지지만 않으면(빈 문자열)
// 1글자까지 허용한다 — "빛/밤" 같은 한 글자 명사에 조사가 붙은 형태를 정규화하기 위함.
function stripParticle(token: string): string {
  for (const suffix of PARTICLE_SUFFIXES) {
    if (token.length - suffix.length >= 1 && token.endsWith(suffix)) {
      return token.slice(0, token.length - suffix.length);
    }
  }
  return token;
}

interface Token {
  original: string;
  root: string;
}

function significantTokens(text: string): Token[] {
  return text
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= WORD_REPEAT_MIN_LENGTH && !WORD_REPEAT_STOPWORDS.has(t))
    .map((t) => ({ original: t, root: stripParticle(t) }));
}

const TAG_MAX = 15;
const SUBCOPY_MAX = 20;
const HEADLINE_MAX = 18;
const WITH_CASPER_MAX = 12;

// 가이드라인 v1.7.1 기준으로는 글자수 제한이 보정 루프 트리거가 아니라 생성 단계 지시일 뿐이라
// 넘겨도 재시도하지 않는 게 원칙이다. 다만 실제 지면(물리적 노출 공간) 제약이라는 성격을 고려해,
// 1~2자 정도의 사소한 초과는 허용하고, 그보다 크게(3자 초과부터) 벗어나는 경우에만 재시도를
// 트리거하는 절충안을 적용한다.
const CHARACTER_LIMIT_TOLERANCE = 2;

// 6.1: 글자수는 공백 포함, 이모지·특수기호 제외로 측정한다.
function measureLength(text: string): number {
  const withoutEmoji = text.replace(/\p{Extended_Pictographic}/gu, "");
  const withoutSymbols = withoutEmoji.replace(/[!-/:-@[-`{-~·“”‘’…]/g, "");
  return withoutSymbols.length;
}

function checkOnomatopoeiaMismatch(text: string): CopyWarning[] {
  const warnings: CopyWarning[] = [];
  for (const rule of ONOMATOPOEIA_RULES) {
    const hasForm = rule.forms.some((f) => text.includes(f));
    if (!hasForm) continue;
    const hasIncompatibleVerb = rule.incompatibleVerbs.some((v) => text.includes(v));
    if (hasIncompatibleVerb) {
      warnings.push({
        type: "sensory_mismatch",
        message: `"${rule.forms[0]}"(${rule.category} 계열 의성/의태어)와 뒤따르는 동사의 감각이 어긋날 수 있습니다.`,
      });
    }
  }
  return warnings;
}

function checkTermination(headline: string): CopyWarning[] {
  const trimmed = headline.trim();
  if (TERMINATION_REGEX.test(trimmed)) {
    return [
      {
        type: "termination",
        message:
          "헤드라인이 주어+서술어가 완결되는 문장(예: -습니다/-있다/-하네 등)으로 종결되어 Headline Termination Rule을 위반할 수 있습니다.",
      },
    ];
  }
  if (DANGLING_DESIRE_REGEX.test(trimmed)) {
    return [
      {
        type: "termination",
        message:
          "헤드라인이 명사 없이 '~고 싶은'으로 끝났습니다. Headline Termination Rule은 '~하고 싶은 [명사]'처럼 뒤에 명사가 이어지는 형태만 허용합니다 — 명사를 붙이거나 다른 종결로 바꿔주세요.",
      },
    ];
  }
  return [];
}

function checkAggressiveExpression(text: string): CopyWarning[] {
  const warnings: CopyWarning[] = [];
  const found = AGGRESSIVE_PHRASES.filter((p) => text.includes(p));
  if (found.length > 0) {
    warnings.push({
      type: "aggressive_expression",
      message: `자극적 표현(${found.join(", ")})이 포함되어 있습니다. 할인 정보가 없는 무드 중심 기획전이므로 제거를 권장합니다.`,
    });
  }
  if ((text.match(/!/g)?.length ?? 0) >= 2) {
    warnings.push({
      type: "aggressive_expression",
      message: "느낌표가 반복 사용되었습니다. 표현 자극도를 낮게 유지해주세요.",
    });
  }
  return warnings;
}

function checkCharacterLimits(variant: CopyVariantText): CopyWarning[] {
  const warnings: CopyWarning[] = [];
  if (variant.tag && measureLength(variant.tag) > TAG_MAX + CHARACTER_LIMIT_TOLERANCE) {
    warnings.push({
      type: "character_limit",
      message: `태그가 ${TAG_MAX}자를 초과했습니다 (현재 ${measureLength(variant.tag)}자).`,
    });
  }
  if (variant.subcopy && measureLength(variant.subcopy) > SUBCOPY_MAX + CHARACTER_LIMIT_TOLERANCE) {
    warnings.push({
      type: "character_limit",
      message: `서브카피가 ${SUBCOPY_MAX}자를 초과했습니다 (현재 ${measureLength(variant.subcopy)}자).`,
    });
  }
  const isConventional = CONVENTIONAL_HEADLINE_REGEX.test(variant.headline);
  if (!isConventional && measureLength(variant.headline) > HEADLINE_MAX + CHARACTER_LIMIT_TOLERANCE) {
    warnings.push({
      type: "character_limit",
      message: `메인타이틀이 ${HEADLINE_MAX}자를 초과했습니다 (현재 ${measureLength(variant.headline)}자, 관습형 예외 아님).`,
    });
  }
  if (variant.with_casper && measureLength(variant.with_casper) > WITH_CASPER_MAX + CHARACTER_LIMIT_TOLERANCE) {
    warnings.push({
      type: "character_limit",
      message: `With CASPER 표기가 ${WITH_CASPER_MAX}자를 초과했습니다 (현재 ${measureLength(variant.with_casper)}자).`,
    });
  }
  return warnings;
}

function checkFirstPerson(headline: string): CopyWarning[] {
  const found = FIRST_PERSON_PATTERNS.filter((p) => headline.includes(p));
  if (found.length > 0) {
    return [
      {
        type: "first_person",
        message: `헤드라인에 1인칭 지칭어(${found.join(", ")})가 포함되어 있습니다. 3인칭 장면 묘사로 바꿔주세요.`,
      },
    ];
  }
  return [];
}

function checkIntraVariantWordRepetition(variant: CopyVariantText): CopyWarning[] {
  const namedFields: [string, string][] = [
    ["태그", variant.tag],
    ["헤드라인", variant.headline],
    ["서브카피", variant.subcopy],
    ["With CASPER", variant.with_casper],
  ].filter(([, text]) => text) as [string, string][];

  const rootOccurrences = new Map<string, { original: string; fields: string[] }>();
  for (const [fieldName, text] of namedFields) {
    const seenInField = new Set<string>();
    for (const token of significantTokens(text)) {
      if (seenInField.has(token.root)) continue; // 같은 필드 안에서의 반복은 별개 이슈이므로 여기선 세지 않음
      seenInField.add(token.root);
      const entry = rootOccurrences.get(token.root) ?? { original: token.original, fields: [] };
      entry.fields.push(fieldName);
      rootOccurrences.set(token.root, entry);
    }
  }

  for (const { original, fields } of rootOccurrences.values()) {
    if (fields.length >= 2) {
      return [
        {
          type: "word_repeat",
          message: `같은 단어("${original}")가 ${fields.join("·")}에 중복 등장했습니다. 한 곳에서만 쓰고 다른 표현으로 바꿔주세요.`,
        },
      ];
    }
  }
  return [];
}

function checkMonthDuplication(variant: CopyVariantText, month: number): CopyWarning[] {
  const combined = `${variant.tag} ${variant.headline} ${variant.subcopy} ${variant.with_casper}`;
  const matches = combined.match(MONTH_MENTION_REGEX) ?? [];
  if (matches.length >= 2) {
    return [
      {
        type: "month_repeat",
        message: `게재월 표현(${matches.join(", ")})이 태그·헤드라인·서브카피·With CASPER 표기 중 두 곳 이상에 중복 등장했습니다. 한 곳에만 남기세요.`,
      },
    ];
  }
  // MONTH_MENTION_REGEX는 "N월" 형태라면 어떤 숫자든 매칭하므로, 등장한 숫자가 실제 입력받은
  // 게재월과 다른 경우(예: 10월 입력인데 "9월 특별 기획전"으로 생성)를 별도로 잡아낸다.
  const mismatched = matches.filter((m) => Number.parseInt(m, 10) !== month);
  if (mismatched.length > 0) {
    return [
      {
        type: "month_mismatch",
        message: `게재월 표현(${mismatched.join(", ")})이 입력된 게재월(${month}월)과 일치하지 않습니다. ${month}월로 수정하세요.`,
      },
    ];
  }
  return [];
}

export function runSlotChecks(variant: CopyVariantText, month: number): CopyWarning[] {
  const combined = `${variant.tag} ${variant.headline} ${variant.subcopy} ${variant.with_casper}`;
  return [
    ...checkTermination(variant.headline),
    ...checkOnomatopoeiaMismatch(`${variant.headline} ${variant.subcopy}`),
    ...checkAggressiveExpression(combined),
    ...checkCharacterLimits(variant),
    ...checkMonthDuplication(variant, month),
    ...checkFirstPerson(variant.headline),
    ...checkIntraVariantWordRepetition(variant),
  ];
}

export function checkStructuralUniformity(headlines: string[]): CopyWarning | null {
  if (headlines.length < 2) return null;

  const templateMatches = headlines.filter((h) => UNIFORM_TEMPLATE_REGEX.test(h));
  if (templateMatches.length >= 2) {
    return {
      type: "structure_uniform",
      message: `${templateMatches.length}개 안이 "~고 싶은 ~" 문형으로 수렴했습니다.`,
    };
  }

  const conventionalMatches = headlines.filter((h) => CONVENTIONAL_HEADLINE_REGEX.test(h));
  if (conventionalMatches.length >= 2) {
    return {
      type: "structure_uniform",
      message: `${conventionalMatches.length}개 안이 "N월 특별 기획전" 관습형 구조를 중복 사용했습니다. 최대 1개 안에서만 사용하세요.`,
    };
  }

  if (headlines.length >= 3) {
    const endings = headlines.map((h) => h.trim().slice(-3));
    if (endings.every((e) => e === endings[0])) {
      return {
        type: "structure_uniform",
        message: "3개 안의 어미가 모두 동일해 구조가 획일화되었습니다.",
      };
    }
  }

  return null;
}

export function checkVocabularyOverlap(variants: CopyVariantText[]): CopyWarning | null {
  if (variants.length < 2) return null;

  const rootOccurrences = new Map<string, { original: string; count: number }>();
  for (const variant of variants) {
    const seenInVariant = new Set<string>();
    for (const token of significantTokens(`${variant.headline} ${variant.subcopy}`)) {
      if (seenInVariant.has(token.root)) continue; // 한 안 안의 반복은 checkIntraVariantWordRepetition이 담당
      seenInVariant.add(token.root);
      const entry = rootOccurrences.get(token.root) ?? { original: token.original, count: 0 };
      entry.count++;
      rootOccurrences.set(token.root, entry);
    }
  }

  for (const { original, count } of rootOccurrences.values()) {
    if (count >= 2) {
      return {
        type: "word_repeat",
        message: `같은 단어("${original}")가 ${count}개 안의 헤드라인·서브카피에 걸쳐 반복 등장했습니다. 앵커의 감각 성질은 유지하되 표현 어휘는 안마다 다르게 바꿔주세요.`,
      };
    }
  }
  return null;
}

export function summarizeWarnings(warnings: CopyWarning[]): string {
  return warnings.map((w) => w.message).join(" ");
}

// 가이드라인 v1.7.1 §4-1 F유형(수식어 중복) — 다른 항목과 달리 강제 재작성 대상이 아니라
// "재검토 트리거"일 뿐이다. 임계값은 잠정치이며, 결과는 재시도 없이 낭독 검수 안내문구에
// 통합해 사람이 최종 확인하도록 노출한다.
export interface CopyAdvisory {
  type: "emphasis_repeat" | "synonym_stack" | "hanja_suffix";
  message: string;
  // 특정 안에 귀속되는 항목(한자어 접미사·동의어 이중 수식)만 안의 인덱스를 갖는다. 강조부사
  // 중복은 3안 전체 합산 판정이라 특정 안 하나에 귀속시킬 수 없어 undefined로 둔다.
  variantIndex?: number;
}

const EMPHASIS_ADVERBS = ["정말", "매우", "너무", "아주"];
const EMPHASIS_REPEAT_THRESHOLD = 2; // 잠정치: 3안 전체 합산 2회 초과(3회 이상)면 트리거

const HANJA_SUFFIX_REGEX = /[가-힣]+(적|성|화)(?=[\s,.!]|$)/g;
const HANJA_SUFFIX_THRESHOLD = 3; // 잠정치: 한 안 내 3회 이상

// 가이드라인 원문은 "감각 앵커 후보가 2개 이상 검출되면" 트리거하는 방식을 언급하지만, 그 방식은
// 별도의 앵커 후보 추출기가 있다는 전제다. 본 도구는 앵커를 LLM이 자유롭게 추출해 후보 리스트가
// 없으므로, 톤 컴퍼스가 실제로 반복 사용하는 "따뜻함·고요함" 계열 수식어 클러스터로 근사한다 —
// 한 안의 헤드라인·서브카피에 이 클러스터의 서로 다른 단어가 2개 이상 겹치면 동의어 이중 수식으로
// 의심한다.
const WARMTH_SYNONYM_CLUSTER = ["따뜻한", "포근한", "온기", "온화한", "훈훈한", "은은한", "잔잔한", "고요한"];

function checkEmphasisAdverbRepetition(variants: CopyVariantText[]): CopyAdvisory | null {
  const combined = variants.map((v) => `${v.tag} ${v.headline} ${v.subcopy} ${v.with_casper}`).join(" ");
  let count = 0;
  for (const adv of EMPHASIS_ADVERBS) {
    count += combined.split(adv).length - 1;
  }
  if (count > EMPHASIS_REPEAT_THRESHOLD) {
    return {
      type: "emphasis_repeat",
      message: `강조 부사(정말·매우·너무·아주)가 3안 전체에서 ${count}회 등장해 과다 사용이 의심됩니다.`,
    };
  }
  return null;
}

function checkHanjaSuffixOveruse(variant: CopyVariantText, label: string, variantIndex: number): CopyAdvisory | null {
  const combined = `${variant.tag} ${variant.headline} ${variant.subcopy} ${variant.with_casper}`;
  const matches = combined.match(HANJA_SUFFIX_REGEX) ?? [];
  if (matches.length >= HANJA_SUFFIX_THRESHOLD) {
    return {
      type: "hanja_suffix",
      message: `${label}에서 한자어 명사화 접미사(-적/-성/-화)가 ${matches.length}회 등장해 과다 사용이 의심됩니다.`,
      variantIndex,
    };
  }
  return null;
}

function checkSynonymStacking(variant: CopyVariantText, label: string, variantIndex: number): CopyAdvisory | null {
  const combined = `${variant.headline} ${variant.subcopy}`;
  const found = WARMTH_SYNONYM_CLUSTER.filter((w) => combined.includes(w));
  if (found.length >= 2) {
    return {
      type: "synonym_stack",
      message: `${label}에서 같은 감각 계열 수식어(${found.join(", ")})가 겹쳐 쓰여 감각 앵커가 하나로 수렴하지 않았을 수 있습니다.`,
      variantIndex,
    };
  }
  return null;
}

export function runAdvisoryChecks(variants: CopyVariantText[]): CopyAdvisory[] {
  const advisories: CopyAdvisory[] = [];
  const emphasis = checkEmphasisAdverbRepetition(variants);
  if (emphasis) advisories.push(emphasis);
  variants.forEach((variant, i) => {
    const label = `안 ${i + 1}`;
    const hanja = checkHanjaSuffixOveruse(variant, label, i);
    if (hanja) advisories.push(hanja);
    const synonym = checkSynonymStacking(variant, label, i);
    if (synonym) advisories.push(synonym);
  });
  return advisories;
}

// 구조/어휘 다양성 문제가 있을 때 "어느 안을 다시 쓸지"를 특정한다. 전체 3안을 통째로
// 재작성(anchor 재추출 포함, 가장 비용이 큰 호출)하는 대신 문제를 일으킨 안 1개만 골라
// generateSingle로 가볍게 재생성하기 위함이다.
export function findDiversityRetryIndex(variants: CopyVariantText[]): number | null {
  const headlines = variants.map((v) => v.headline);

  const templateMatches = headlines
    .map((h, i) => (UNIFORM_TEMPLATE_REGEX.test(h) ? i : -1))
    .filter((i) => i !== -1);
  if (templateMatches.length >= 2) return templateMatches[templateMatches.length - 1];

  const conventionalMatches = headlines
    .map((h, i) => (CONVENTIONAL_HEADLINE_REGEX.test(h) ? i : -1))
    .filter((i) => i !== -1);
  if (conventionalMatches.length >= 2) return conventionalMatches[conventionalMatches.length - 1];

  if (headlines.length >= 3) {
    const endings = headlines.map((h) => h.trim().slice(-3));
    if (endings.every((e) => e === endings[0])) return headlines.length - 1;
  }

  const rootFirstIndex = new Map<string, number>();
  for (let i = 0; i < variants.length; i++) {
    const seen = new Set<string>();
    for (const token of significantTokens(`${variants[i].headline} ${variants[i].subcopy}`)) {
      if (seen.has(token.root)) continue;
      seen.add(token.root);
      if (rootFirstIndex.has(token.root)) return i;
      rootFirstIndex.set(token.root, i);
    }
  }

  return null;
}
