"use client";

import { useState } from "react";
import { useBuilder } from "./builder-context";
import { describeState, HistoryEntry } from "./builder-model";
import { BTN_PRIMARY } from "./ui";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export function HistoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { history, applyHistoryEntry } = useBuilder();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (!open) return null;

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleApply(entry: HistoryEntry) {
    if (!confirm("현재 builder에 작성중인 내용이 선택한 항목으로 대체됩니다. 계속하시겠습니까?")) return;
    applyHistoryEntry(entry);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
    >
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

        {history.length === 0 ? (
          <div className="p-8 text-center text-sm leading-relaxed text-[#9ca3af]">
            아직 생성된 히스토리가 없습니다.
            <br />
            &apos;결과 생성하기&apos;를 눌러 결과를 만들면 여기에 기록됩니다.
          </div>
        ) : (
          <div className="max-h-[520px] overflow-y-auto p-4">
            <div className="flex flex-col gap-2.5">
              {history.map((entry) => {
                const expanded = expandedIds.has(entry.id);
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
                      onClick={() => toggle(entry.id)}
                      className="flex w-full cursor-pointer items-center justify-between gap-2 bg-[#e4effc] px-3.5 py-2.5 text-left"
                    >
                      <span className="text-xs font-bold text-[#6b7280]">
                        #{entry.seq} · {formatTime(entry.createdAt)}
                      </span>
                      <span
                        className={
                          "flex-shrink-0 text-[#9ca3af] transition-transform " + (expanded ? "rotate-180" : "")
                        }
                      >
                        ▾
                      </span>
                    </button>
                    <div className="bg-white px-3.5 py-3 text-[0.8125rem] leading-relaxed text-[#111827]">
                      {entry.result.prompt_ko}
                    </div>
                    {expanded && (
                      <div className="border-t border-[#e5e7eb] bg-[#fafafa] px-3.5 py-3.5">
                        <dl className="flex flex-col gap-1.5 text-xs">
                          {describeState(entry.state).map((f) => (
                            <div key={f.label} className="flex gap-2">
                              <dt className="w-28 flex-shrink-0 font-bold text-[#6b7280]">{f.label}</dt>
                              <dd className="leading-relaxed text-[#111827]">{f.value}</dd>
                            </div>
                          ))}
                        </dl>
                        <button
                          type="button"
                          onClick={() => handleApply(entry)}
                          className={BTN_PRIMARY + " mt-3.5 w-full text-xs"}
                        >
                          현재 설정값으로 적용하기
                        </button>
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
