"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BuilderState,
  Material,
  Mode,
  PromptResult,
  Rendering,
  Step,
  STEP_PATHS,
  REQUIRED_FIELDS,
  MATERIAL_RENDERING_MATRIX,
  buildRequestBody,
  defaultState,
  generateSampleResult,
  isFilled,
  isMaterialDisabled,
} from "./builder-model";

interface BuilderContextValue {
  state: BuilderState;
  currentStep: Step;
  set: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void;
  selectRendering: (value: Rendering) => void;
  toggleMaterial: (mat: Material) => void;
  isMaterialDisabled: (mat: Material) => boolean;
  missingFields: { key: keyof BuilderState; step: Step; label: string }[];
  overallProgress: number;
  isStepComplete: (step: Step) => boolean;
  goToStep: (step: Step) => void;
  exampleOpen: boolean;
  setExampleOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  renderingAccordionOpen: boolean;
  setRenderingAccordionOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  resultData: PromptResult | null;
  resultStale: boolean;
  lastMode: Mode;
  apiError: string | null;
  apiLoading: boolean;
  handleSample: () => void;
  generateViaApi: () => Promise<void>;
  resetAll: () => void;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function BuilderProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<BuilderState>(defaultState());
  const [resultData, setResultData] = useState<PromptResult | null>(null);
  const [resultStale, setResultStale] = useState(false);
  const [lastMode, setLastMode] = useState<Mode>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [exampleOpen, setExampleOpen] = useState(false);
  const [renderingAccordionOpen, setRenderingAccordionOpen] = useState(true);

  const currentStep: Step = useMemo(() => {
    const match = /step-(\d)/.exec(pathname ?? "");
    const n = match ? Number(match[1]) : 1;
    return (n >= 1 && n <= 4 ? n : 1) as Step;
  }, [pathname]);

  function goToStep(step: Step) {
    router.push(STEP_PATHS[step]);
  }

  function set<K extends keyof BuilderState>(key: K, value: BuilderState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
    if (resultData) setResultStale(true);
  }

  function selectRendering(value: Rendering) {
    setState((prev) => {
      const matrix = MATERIAL_RENDERING_MATRIX[value];
      const filtered = prev.material.filter((m) => matrix[m] !== "block");
      return { ...prev, rendering: value, material: filtered };
    });
    if (resultData) setResultStale(true);
  }

  function toggleMaterial(mat: Material) {
    setState((prev) => {
      if (isMaterialDisabled(prev, mat)) return prev;
      const has = prev.material.includes(mat);
      return { ...prev, material: has ? prev.material.filter((m) => m !== mat) : [...prev.material, mat] };
    });
    if (resultData) setResultStale(true);
  }

  const missingFields = useMemo(
    () => REQUIRED_FIELDS.filter((f) => !isFilled(state, f.key)),
    [state]
  );

  const overallProgress = useMemo(() => {
    const filled = REQUIRED_FIELDS.filter((f) => isFilled(state, f.key)).length;
    return Math.round((filled / REQUIRED_FIELDS.length) * 100);
  }, [state]);

  function isStepComplete(step: Step): boolean {
    // 샘플 출력은 실제 결과가 아니므로 Step 4 완료로 인정하지 않는다.
    if (step === 4) return !!resultData && lastMode === "api";
    return REQUIRED_FIELDS.filter((f) => f.step === step).every((f) => isFilled(state, f.key));
  }

  function handleSample() {
    setResultData(generateSampleResult(state));
    setResultStale(false);
    setLastMode("sample");
    setApiError(null);
  }

  async function generateViaApi() {
    if (missingFields.length > 0) return;
    setApiLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRequestBody(state)),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data?.error?.message ?? "알 수 없는 오류가 발생했습니다.");
        setResultData(null);
        setResultStale(false);
      } else {
        setResultData(data);
        setResultStale(false);
        setLastMode("api");
        setApiError(null);
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "서버와 통신할 수 없습니다.");
    } finally {
      setApiLoading(false);
    }
  }

  function resetAll() {
    if (!confirm("모든 입력값이 초기화됩니다. 계속할까요?")) return;
    setState(defaultState());
    setResultData(null);
    setResultStale(false);
    setLastMode(null);
    setApiError(null);
    setExampleOpen(false);
    setRenderingAccordionOpen(true);
    router.push(STEP_PATHS[1]);
  }

  const value: BuilderContextValue = {
    state,
    currentStep,
    set,
    selectRendering,
    toggleMaterial,
    isMaterialDisabled: (mat) => isMaterialDisabled(state, mat),
    missingFields,
    overallProgress,
    isStepComplete,
    goToStep,
    exampleOpen,
    setExampleOpen,
    renderingAccordionOpen,
    setRenderingAccordionOpen,
    resultData,
    resultStale,
    lastMode,
    apiError,
    apiLoading,
    handleSample,
    generateViaApi,
    resetAll,
  };

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilder(): BuilderContextValue {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within a BuilderProvider");
  return ctx;
}
