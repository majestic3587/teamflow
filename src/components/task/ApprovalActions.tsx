"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskApprovalStatus } from "@/types/task";

type Props = {
  taskId: string;
  approvalStatus: TaskApprovalStatus;
  canSubmit: boolean;    // 作成者 または 担当者
  canApprove: boolean;   // manager / owner
};

export function ApprovalActions({
  taskId,
  approvalStatus,
  canSubmit,
  canApprove,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function callAction(action: "submit-approval" | "approve" | "reject") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "操作に失敗しました。");
        return;
      }
      router.refresh();
    } catch {
      setError("ネットワークエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  const showSubmit = canSubmit && approvalStatus === "DRAFT";
  const showApprove = canApprove && approvalStatus === "PENDING";
  const showReject = canApprove && approvalStatus === "PENDING";

  if (!showSubmit && !showApprove && !showReject) return null;

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        承認フロー
      </p>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {showSubmit && (
          <button
            onClick={() => callAction("submit-approval")}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            承認申請
          </button>
        )}

        {showApprove && (
          <button
            onClick={() => callAction("approve")}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 13l4 4L19 7" />
            </svg>
            承認
          </button>
        )}

        {showReject && (
          <button
            onClick={() => callAction("reject")}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
            差し戻し
          </button>
        )}
      </div>

      {/* 状態ガイド */}
      {approvalStatus === "REJECTED" && canSubmit && (
        <p className="text-xs text-amber-600 mt-2">
          差し戻されました。内容を修正して再度承認申請してください。
          （編集後、ステータスは自動で DRAFT に戻りません。編集画面から DRAFT に変更してください）
        </p>
      )}
    </div>
  );
}
