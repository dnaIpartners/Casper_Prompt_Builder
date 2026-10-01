"use client";

import { useMemo, useState } from "react";
import { BTN_PRIMARY } from "../(builder)/ui";
import {
  ACTION_TYPE_LABELS,
  clearHistory,
  HistoryEntry,
  MONTH_OPTIONS,
  removeHistoryEntry,
  useHistoryStore,
} from "./copy-model";

function formatTime(ts: number) {
  return new Date(ts).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CopyHistoryModal({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (entry: HistoryEntry) => void;
}) {
  const history = useHistoryStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<number | "all">("all");

  const filtered = useMemo(
    () => (monthFilter === "all" ? history : history.filter((h) => h.month === monthFilter)),
    [history, monthFilter]
  );

  if (!open) return null;

  function handleApply(entry: HistoryEntry) {
    if (!confirm("현재 제작 화면의 입력값·결과가 선택한 버전으로 대체됩니다. 계속할까요?")) return;
    onApply(entry);
    onClose();
  }

  function handleDelete(id: string) {
    removeHistoryEntry(id);
    if (expandedId === id) setExpandedId(null);
  }

  function handleClearAll() {
    if (history.length === 0) return;
    if (!confirm("이 기기에 저장된 모든 개인 히스토리를 삭제합니다. 계속할까요?")) return;
    clearHistory();
    setExpandedId(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-xl flex-col rounded-xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
          <h3 className="m-0 text-base font-bold text-[#111827]">이전 히스토리</h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-lg leading-none text-[#9ca3af] hover:text-[#111827]"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <p className="m-0 border-b border-[#e5e7eb] bg-[#fafafa] px-5 py-2.5 text-[11.5px] leading-relaxed text-[#9ca3af]">
          이 히스토리는 로그인 없이 이 브라우저에만 저장됩니다. 다른 기기·브라우저에서는 보이지 않으며, 저장소를
          삭제하면 함께 사라집니다.
        </p>

        <div className="flex items-center justify-between gap-2 border-b border-[#e5e7eb] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6b7280]">월별 필터</span>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="appearance-none rounded-md border border-[#d1d5db] bg-white bg-[length:12px] bg-[right_0.5rem_center] bg-no-repeat py-1 pr-6 pl-2 text-xs"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              }}
            >
              <option value="all">전체</option>
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="cursor-pointer text-[12px] font-semibold text-[#dc2626] hover:underline"
            >
              이 기기 히스토리 전체 삭제
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm leading-relaxed text-[#9ca3af]">
            {history.length === 0
              ? "아직 생성된 히스토리가 없습니다."
              : "이 월에 해당하는 히스토리가 없습니다."}
          </div>
        ) : (
          <div className="overflow-y-auto p-4">
            <div className="flex flex-col gap-2.5">
              {filtered.map((entry) => {
                const expanded = expandedId === entry.id;
                return (
                  <div
                    key={entry.id}
                    className={
                      "overflow-hidden rounded-lg border transition-colors " +
                      (expanded ? "border-[#4090f1]" : "border-[#e5e7eb]")
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : entry.id)}
                      className="flex w-full cursor-pointer items-center justify-between gap-2 bg-[#e4effc] px-3.5 py-2.5 text-left"
                    >
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-bold text-[#6b7280]">
                        <span>{entry.month}월</span>
                        <span>·</span>
                        <span>{ACTION_TYPE_LABELS[entry.actionType]}</span>
                        <span>·</span>
                        <span>{formatTime(entry.createdAt)}</span>
                      </span>
                      <span
                        className={
                          "flex-shrink-0 text-[#9ca3af] transition-transform " + (expanded ? "rotate-180" : "")
                        }
                      >
                        ▾
                      </span>
                    </button>
                    <div className="bg-white px-3.5 py-3">
                      {/* line-clamp만으로는 일부 브라우저에서 overflow가 실제로 잘리지 않고 4번째
                          줄 일부가 새어나오는 렌더링 버그가 확인되어, max-h를 함께 걸어 높이를
                          이중으로 강제한다(텍스트 3줄 높이보다 약간 여유를 둔 값). */}
                      <div className="line-clamp-3 max-h-[4.5rem] text-[12.5px] leading-relaxed text-[#111827]">
                        {entry.prompt}
                      </div>
                    </div>
                    {expanded && (
                      <div className="border-t border-[#e5e7eb] bg-[#fafafa] px-3.5 py-3.5">
                        <div className="mb-3 rounded-md bg-white p-2.5">
                          <div className="mb-1 text-[10.5px] font-bold tracking-wide text-[#4090f1] uppercase">
                            감각 앵커
                          </div>
                          <div className="text-[12.5px] text-[#6b7280]">
                            {entry.anchor.source_words.join(", ")} — {entry.anchor.note}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {entry.variants.map((v, i) => (
                            <div key={i} className="rounded-md bg-white p-2.5">
                              <div className="mb-0.5 text-[10.5px] font-bold tracking-wide text-[#9ca3af] uppercase">
                                안 {i + 1}
                              </div>
                              {v.tag && (
                                <span className="mb-1 inline-block rounded-full bg-[#f4f5f7] px-2 py-0.5 text-[10px] font-bold text-[#6b7280] uppercase">
                                  {v.tag}
                                </span>
                              )}
                              {v.subcopy && <div className="text-[12.5px] text-[#6b7280]">{v.subcopy}</div>}
                              <div className="text-sm font-bold text-[#111827]">{v.headline}</div>
                              {v.with_casper && (
                                <div className="mt-0.5 text-[10.5px] font-semibold text-[#9ca3af]">{v.with_casper}</div>
                              )}
                              <div className="mt-1.5 text-[11.5px] leading-relaxed text-[#9ca3af]">
                                <div>
                                  <span className="font-semibold">앵커 적용:</span> {v.anchor_rationale}
                                </div>
                                <div>
                                  <span className="font-semibold">제안 배경:</span> {v.proposal_rationale}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3.5 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleApply(entry)}
                            className={BTN_PRIMARY + " flex-1 text-xs"}
                          >
                            이 버전 제작 화면에 불러오기
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            className="cursor-pointer rounded-lg border border-[#fca5a5] px-3 text-xs font-semibold text-[#dc2626] hover:bg-[#fef2f2]"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
