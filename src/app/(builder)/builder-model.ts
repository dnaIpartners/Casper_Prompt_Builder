export type Step = 1 | 2 | 3 | 4;
export type Composition = "single_hero" | "hero_supporting";
export type Angle = "front" | "angle45" | "side" | "top" | "isometric" | "closeup";
export type BgType = "gradient" | "solid" | "other";
export type Rendering =
  | "commercial_3d"
  | "photorealistic"
  | "semi_realistic"
  | "stylized_3d"
  | "clay_style"
  | "illustrative_3d";
export type Realism = "stylized_strong" | "stylized" | "mid" | "realistic" | "realistic_strong";
export type Detail = "low" | "mid" | "high";
export type Material = "glossy" | "soft_matte" | "glass" | "metallic" | "translucent";
export type MaterialRelation = "allow" | "subtle" | "block";
export type Mode = "sample" | "api" | null;

export interface BuilderState {
  theme: string;
  message: string;
  mood: string;
  object: string;
  assoc: string;
  highlight: string;
  composition: Composition | null;
  angle: Angle | null;
  bgType: BgType | null;
  background: string;
  rendering: Rendering | null;
  realism: Realism;
  detail: Detail;
  material: Material[];
}

export interface PromptResult {
  strategy: string;
  direction: string;
  prompt: string;
  avoid: string;
  prompt_ko: string;
  avoid_ko: string;
}

export const STEP_TITLES: Record<Step, string> = {
  1: "컨셉 정의",
  2: "오브젝트 정의",
  3: "시각 표현 정의",
  4: "결과",
};

export const STEP_PATHS: Record<Step, string> = {
  1: "/step-1",
  2: "/step-2",
  3: "/step-3",
  4: "/step-4",
};

export const REQUIRED_FIELDS: { key: keyof BuilderState; step: Step; label: string }[] = [
  { key: "theme", step: 1, label: "기획성 주제" },
  { key: "message", step: 1, label: "핵심 메시지" },
  { key: "mood", step: 1, label: "분위기 및 감성 설명" },
  { key: "object", step: 2, label: "메인 오브젝트" },
  { key: "assoc", step: 2, label: "연상 요소" },
  { key: "highlight", step: 2, label: "시각 강조 요소" },
  { key: "composition", step: 2, label: "구성 방식" },
  { key: "angle", step: 2, label: "오브젝트 앵글" },
  { key: "bgType", step: 3, label: "배경 유형" },
  { key: "background", step: 3, label: "배경 표현 설명" },
  { key: "rendering", step: 3, label: "렌더링 방식" },
];

export const COMPOSITION_OPTIONS: { value: Composition; title: string; sub: string }[] = [
  { value: "single_hero", title: "Single Hero Object", sub: "메인 오브젝트 단독 구성" },
  { value: "hero_supporting", title: "Hero + Supporting", sub: "메인 오브젝트 + 보조 오브젝트 구성" },
];

export const ANGLE_OPTIONS: { value: Angle; label: string }[] = [
  { value: "front", label: "정면" },
  { value: "angle45", label: "45도" },
  { value: "side", label: "측면" },
  { value: "top", label: "탑뷰" },
  { value: "isometric", label: "아이소메트릭" },
  { value: "closeup", label: "클로즈업" },
];

export const BGTYPE_OPTIONS: { value: BgType; label: string }[] = [
  { value: "gradient", label: "그라디언트" },
  { value: "solid", label: "단색" },
  { value: "other", label: "기타" },
];

export const RENDERING_OPTIONS: { value: Rendering; title: string; sub: string }[] = [
  { value: "commercial_3d", title: "Commercial 3D CGI", sub: "커머셜 3D CGI" },
  { value: "photorealistic", title: "Photorealistic CGI", sub: "포토리얼리스틱 CGI" },
  { value: "semi_realistic", title: "Semi Realistic CGI", sub: "세미 리얼리스틱 CGI" },
  { value: "stylized_3d", title: "Stylized 3D", sub: "스타일라이즈드 3D" },
  { value: "clay_style", title: "Clay Style 3D", sub: "클레이 스타일 3D" },
  { value: "illustrative_3d", title: "Illustrative 3D", sub: "일러스트레이티브 3D" },
];

export const REALISM_OPTIONS: { value: Realism; label: string; sub: string }[] = [
  { value: "stylized_strong", label: "Strong Stylized", sub: "매우 스타일라이즈드" },
  { value: "stylized", label: "Stylized", sub: "스타일라이즈드 쪽" },
  { value: "mid", label: "Balanced", sub: "중간" },
  { value: "realistic", label: "Realistic", sub: "사실적 쪽" },
  { value: "realistic_strong", label: "Photoreal", sub: "매우 사실적" },
];

export const DETAIL_OPTIONS: { value: Detail; label: string }[] = [
  { value: "low", label: "낮음" },
  { value: "mid", label: "중간" },
  { value: "high", label: "높음" },
];

export const MATERIAL_OPTIONS: { value: Material; label: string }[] = [
  { value: "glossy", label: "Glossy (광택)" },
  { value: "soft_matte", label: "Soft Matte (무광)" },
  { value: "glass", label: "Glass (유리)" },
  { value: "metallic", label: "Metallic (금속)" },
  { value: "translucent", label: "Translucent (반투명)" },
];

export const MATERIAL_LABELS: Record<Material, string> = {
  glossy: "Glossy(광택)",
  soft_matte: "Soft Matte(무광)",
  glass: "Glass(유리)",
  metallic: "Metallic(금속)",
  translucent: "Translucent(반투명)",
};

export const RENDERING_LABELS: Record<Rendering, string> = {
  commercial_3d: "Commercial 3D CGI",
  photorealistic: "Photorealistic CGI",
  semi_realistic: "Semi Realistic CGI",
  stylized_3d: "Stylized 3D",
  clay_style: "Clay Style 3D",
  illustrative_3d: "Illustrative 3D",
};

export const MATERIAL_RENDERING_MATRIX: Record<Rendering, Record<Material, MaterialRelation>> = {
  commercial_3d: { glossy: "allow", soft_matte: "allow", glass: "allow", metallic: "allow", translucent: "allow" },
  photorealistic: { glossy: "allow", soft_matte: "allow", glass: "allow", metallic: "allow", translucent: "allow" },
  semi_realistic: { glossy: "allow", soft_matte: "allow", glass: "allow", metallic: "allow", translucent: "allow" },
  stylized_3d: { glossy: "allow", soft_matte: "allow", glass: "subtle", metallic: "subtle", translucent: "allow" },
  clay_style: { glossy: "block", soft_matte: "allow", glass: "block", metallic: "block", translucent: "subtle" },
  illustrative_3d: { glossy: "subtle", soft_matte: "allow", glass: "block", metallic: "block", translucent: "subtle" },
};

export function defaultState(): BuilderState {
  return {
    theme: "",
    message: "",
    mood: "",
    object: "",
    assoc: "",
    highlight: "",
    composition: null,
    angle: null,
    bgType: null,
    background: "",
    rendering: null,
    realism: "mid",
    detail: "mid",
    material: [],
  };
}

export function isFilled(state: BuilderState, key: keyof BuilderState): boolean {
  const v = state[key];
  if (Array.isArray(v)) return v.length > 0;
  return v !== null && v !== undefined && String(v).trim() !== "";
}

export function getMaterialRelation(rendering: Rendering | null, mat: Material): MaterialRelation {
  if (!rendering) return "allow";
  return MATERIAL_RENDERING_MATRIX[rendering][mat];
}

export function isMaterialDisabled(state: BuilderState, mat: Material): boolean {
  if (getMaterialRelation(state.rendering, mat) === "block") return true;
  if (mat === "glossy" && state.material.includes("soft_matte")) return true;
  if (mat === "soft_matte" && state.material.includes("glossy")) return true;
  return false;
}

export function buildRequestBody(state: BuilderState) {
  return {
    theme: state.theme,
    message: state.message,
    mood: state.mood,
    object: state.object,
    assoc: state.assoc,
    highlight: state.highlight,
    composition: state.composition,
    angle: state.angle,
    bgType: state.bgType,
    background: state.background,
    rendering: state.rendering,
    realism: state.realism,
    detail: state.detail,
    material: state.material,
  };
}

export function generateSampleResult(state: BuilderState): PromptResult {
  const materialText = state.material.length
    ? state.material.map((m) => MATERIAL_LABELS[m]).join(", ")
    : "지정 안 함";
  const renderingText = state.rendering ? RENDERING_LABELS[state.rendering] : "(미지정)";
  return {
    strategy:
      `1. (샘플) "${state.theme || "기획성 주제"}" 컨셉을 중심으로 시각적 방향을 정의합니다.\n` +
      `2. 핵심 메시지 "${state.message || "-"}"를 오브젝트의 배치와 조명으로 전달합니다.\n` +
      `3. 분위기 설명을 바탕으로 ${renderingText} 톤을 적용해 감성적 완성도를 높입니다.`,
    direction:
      `1. (샘플) 메인 오브젝트: ${state.object || "-"}\n` +
      `2. 재질 스타일: ${materialText}\n` +
      `3. 배경: ${state.background || "-"}`,
    prompt:
      `(sample) ${renderingText}, ${materialText} — ${state.object || "main object"}` +
      ` with ${state.highlight || "highlight"}`,
    avoid: "no text, no watermark, no logo, no cropping, no harsh drop shadows, no human figures",
    prompt_ko: `(샘플) ${renderingText} 스타일로 표현된 ${state.object || "메인 오브젝트"} 이미지`,
    avoid_ko: "텍스트 없음, 워터마크 없음, 로고 없음, 크롭 없음, 강한 그림자 없음, 인물 없음",
  };
}

export function copyText(text: string) {
  return navigator.clipboard.writeText(text || "");
}
