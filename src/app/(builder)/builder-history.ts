import { useSyncExternalStore } from "react";
import { HistoryEntry } from "./builder-model";

// --- 개인 이력 저장 (브라우저 localStorage에 귀속, 기기/브라우저 간 공유되지 않음) ---
// Copy Composer(copy-model.ts)와 같은 방식: 생성이 완료될 때마다 자동으로 기록되고,
// 새로고침·탭 닫기·재로그인 후에도 남는다.
// localStorage 용량 한도(보통 5~10MB) 대응 — 최신순으로 MAX_HISTORY건만 남기고 오래된 이력부터 버린다.

const HISTORY_KEY = "casper-builder-history-v1";
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

export function appendHistoryEntry(entry: Omit<HistoryEntry, "id" | "seq" | "createdAt">) {
  const prev = getHistorySnapshot();
  // 오래된 이력이 정리돼도 번호가 겹치지 않도록 길이가 아니라 최신 번호 + 1을 쓴다.
  const seq = (prev[0]?.seq ?? 0) + 1;
  const full: HistoryEntry = {
    ...entry,
    id: `h${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    seq,
    createdAt: Date.now(),
  };
  commitHistory([full, ...prev]);
}
