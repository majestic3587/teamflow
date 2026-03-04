"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskWorkStatus, TaskApprovalStatus } from "@/types/task";

type Props = {
  taskId: string;
  workStatus: TaskWorkStatus;
  approvalStatus: TaskApprovalStatus;
  canUpdate: boolean; // 担当者 / 作成者 / manager / owner
};

const STATUS_LABELS: Record<TaskWorkStatus, string> = {
  NOT_STARTED: "未着手",
  IN_PROGRESS: "進行中",
  DONE: "完了",
};

const TRANSITIONS: Record<TaskWorkStatus, TaskWorkStatus[]> = {
  NOT_STARTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["NOT_STARTED", "DONE"],
  DONE: ["IN_PROGRESS"],
};

const BUTTON_STYLES: Record<TaskWorkStatus, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200",
  DONE: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200",
};

export function WorkStatusActions({
  taskId,
  workStatus,
  approvalStatus,
  canUpdate,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isApproved = approvalStatus === "APPROVED";
  const nextStatuses = TRANSITIONS[workStatus];

  if (!canUpdate) return null;

  async function changeStatus(next: TaskWorkStatus) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work_status: next }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "ステータスの更新に失敗しました。");
        return;
      }
      router.refresh();
    } catch {
      setError("ネットワークエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        進捗ステータス
      </p>

      {/* 未承認の警告 */}
      {!isApproved && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
          承認済み（APPROVED）になるまで「進行中」「完了」に変更できません。
        </p>
      )}

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((next) => {
          const blocked = !isApproved && (next === "IN_PROGRESS" || next === "DONE");
          return (
            <button
              key={next}
              onClick={() => changeStatus(next)}
              disabled={loading || blocked}
              title={blocked ? "承認済みのタスクのみ変更できます" : undefined}
              className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${BUTTON_STYLES[next]}`}
            >
              <StatusIcon status={next} />
              {STATUS_LABELS[next]}へ
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: TaskWorkStatus }) {
  if (status === "NOT_STARTED") {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
