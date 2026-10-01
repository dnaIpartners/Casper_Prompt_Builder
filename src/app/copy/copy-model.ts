import { useSyncExternalStore } from "react";

export interface CopyVariant {
  tag: string;
  headline: string;
  subcopy: string;
  with_casper: string;
  anchor_rationale: string;
  proposal_rationale: string;
}

export interface SensoryAnchor {
  source_words: string[];
  note: string;
}

export type ActionType = "initial" | "regenerate_all" | "regenerate_slot_1" | "regenerate_slot_2" | "regenerate_slot_3";

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  initial: "초기 생성",
  regenerate_all: "전체 재생성",
  regenerate_slot_1: "안 1 재생성",
  regenerate_slot_2: "안 2 재생성",
  regenerate_slot_3: "안 3 재생성",
};

export interface HistoryEntry {
  id: string;
  createdAt: number;
  month: number;
  prompt: string;
  anchor: SensoryAnchor;
  variants: CopyVariant[];
  actionType: ActionType;
}

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export function makeId(): string {
  return `c${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// --- 개인 이력 저장 (로그인 없음 — 브라우저 localStorage에 귀속, 기기/브라우저 간 공유되지 않음) ---
// 6.5: 수동 저장 단계 없이, 생성/재생성이 완료될 때마다 자동으로 기록된다.
// §7/§9: localStorage 용량 한도(보통 5~10MB) 대응 — 이력 총량을 제한한다.

const HISTORY_KEY = "casper-copy-history-v1";
const MAX_HISTORY = 100;

function readHistoryFromStorage(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistoryToStorage(entries: HistoryEntry[]): HistoryEntry[] {
  const trimmed = entries.slice(0, MAX_HISTORY);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch {
    // 용량 초과 시 오래된 절반을 버리고 한 번 더 시도 — 그래도 실패하면 조용히 포기한다
    // (참고용 이력이므로 저장 실패가 치명적이지 않음).
    const halved = trimmed.slice(0, Math.ceil(trimmed.length / 2));
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(halved));
      return halved;
    } catch {
      return trimmed;
    }
  }
}

// 브라우저 localStorage를 외부 스토어로 취급해 useSyncExternalStore로 구독한다.
// 서버 렌더링 시점에는 항상 빈 배열을 스냅샷으로 반환해 하이드레이션 불일치를 피한다.
let historySnapshot: HistoryEntry[] | null = null;
const historyListeners = new Set<() => void>();

function getHistorySnapshot(): HistoryEntry[] {
  if (historySnapshot === null) {
    historySnapshot = readHistoryFromStorage();
  }
  return historySnapshot;
}

const EMPTY_HISTORY: HistoryEntry[] = [];

function getHistoryServerSnapshot(): HistoryEntry[] {
  return EMPTY_HISTORY;
}

function subscribeToHistory(listener: () => void): () => void {
  historyListeners.add(listener);
  return () => {
    historyListeners.delete(listener);
  };
}

function commitHistory(entries: HistoryEntry[]) {
  historySnapshot = writeHistoryToStorage(entries);
  for (const listener of historyListeners) listener();
}

export function useHistoryStore(): HistoryEntry[] {
  return useSyncExternalStore(subscribeToHistory, getHistorySnapshot, getHistoryServerSnapshot);
}

export function appendHistoryEntry(entry: Omit<HistoryEntry, "id" | "createdAt">) {
  const full: HistoryEntry = { ...entry, id: makeId(), createdAt: Date.now() };
  commitHistory([full, ...getHistorySnapshot()]);
}

export function removeHistoryEntry(id: string) {
  commitHistory(getHistorySnapshot().filter((h) => h.id !== id));
}

export function clearHistory() {
  commitHistory([]);
}
