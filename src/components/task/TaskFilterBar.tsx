"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import type { TaskWorkStatus, TaskApprovalStatus } from "@/types/task";

const WORK_STATUS_OPTIONS: { value: TaskWorkStatus; label: string }[] = [
  { value: "NOT_STARTED", label: "未着手" },
  { value: "IN_PROGRESS", label: "進行中" },
  { value: "DONE", label: "完了" },
];

const APPROVAL_STATUS_OPTIONS: { value: TaskApprovalStatus; label: string }[] = [
  { value: "DRAFT", label: "下書き" },
  { value: "PENDING", label: "承認待ち" },
  { value: "APPROVED", label: "承認済み" },
  { value: "REJECTED", label: "却下" },
];

const WORK_STATUS_ACTIVE: Record<TaskWorkStatus, string> = {
  NOT_STARTED: "bg-gray-600 text-white border-gray-600",
  IN_PROGRESS: "bg-amber-500 text-white border-amber-500",
  DONE: "bg-emerald-500 text-white border-emerald-500",
};

const APPROVAL_STATUS_ACTIVE: Record<TaskApprovalStatus, string> = {
  DRAFT: "bg-gray-600 text-white border-gray-600",
  PENDING: "bg-blue-500 text-white border-blue-500",
  APPROVED: "bg-emerald-500 text-white border-emerald-500",
  REJECTED: "bg-red-500 text-white border-red-500",
};

type Props = {
  totalCount: number;
  filteredCount: number;
};

export function TaskFilterBar({ totalCount, filteredCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const selectedWork = (searchParams.get("ws") ?? "").split(",").filter(Boolean) as TaskWorkStatus[];
  const selectedApproval = (searchParams.get("as") ?? "").split(",").filter(Boolean) as TaskApprovalStatus[];
  const selectedDue = searchParams.get("due") ?? "";

  const hasFilter =
    selectedWork.length > 0 || selectedApproval.length > 0 || selectedDue !== "";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  function toggleWork(value: TaskWorkStatus) {
    const next = selectedWork.includes(value)
      ? selectedWork.filter((v) => v !== value)
      : [...selectedWork, value];
    updateParams({ ws: next.join(",") });
  }

  function toggleApproval(value: TaskApprovalStatus) {
    const next = selectedApproval.includes(value)
      ? selectedApproval.filter((v) => v !== value)
      : [...selectedApproval, value];
    updateParams({ as: next.join(",") });
  }

  function toggleDue(value: string) {
    updateParams({ due: selectedDue === value ? "" : value });
  }

  function clearAll() {
    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="mb-6">
      {/* トグルボタン */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border transition-all ${
            open
              ? "bg-indigo-50 text-indigo-600 border-indigo-200"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
            />
          </svg>
          絞り込み
          {hasFilter && (
            <span className="bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {selectedWork.length + selectedApproval.length + (selectedDue ? 1 : 0)}
            </span>
          )}
          <svg
            className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {hasFilter && !open && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            クリア
          </button>
        )}
      </div>

      {/* フィルターパネル */}
      {open && (
        <div className="mt-2 bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          {/* 作業ステータス */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-400 w-16 shrink-0">作業</span>
            <div className="flex gap-1.5 flex-wrap">
              {WORK_STATUS_OPTIONS.map((opt) => {
                const active = selectedWork.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleWork(opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      active
                        ? WORK_STATUS_ACTIVE[opt.value]
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 承認ステータス */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-400 w-16 shrink-0">承認</span>
            <div className="flex gap-1.5 flex-wrap">
              {APPROVAL_STATUS_OPTIONS.map((opt) => {
                const active = selectedApproval.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleApproval(opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      active
                        ? APPROVAL_STATUS_ACTIVE[opt.value]
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 期限 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-400 w-16 shrink-0">期限</span>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { value: "overdue", label: "⚠ 期限超過" },
                { value: "upcoming", label: "期限内" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleDue(opt.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    selectedDue === opt.value
                      ? opt.value === "overdue"
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-indigo-500 text-white border-indigo-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* フィルター件数 & クリア */}
          {hasFilter && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {filteredCount} / {totalCount} 件を表示中
              </span>
              <button
                onClick={clearAll}
                className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
              >
                フィルターをクリア
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
