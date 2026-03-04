"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  taskId: string;
  currentDueDate: string | null;
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function DueDateChangeForm({ taskId, currentDueDate }: Props) {
  const router = useRouter();
  const [newDate, setNewDate] = useState(toDateInputValue(currentDueDate));
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const res = await fetch(`/api/tasks/${taskId}/due-date`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        new_due_date: newDate ? new Date(newDate).toISOString() : null,
        reason: reason.trim() || null,
      }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "期限の変更に失敗しました。");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setReason("");
    router.refresh();
    setLoading(false);
  }

  const inputClass =
    "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 新しい期限 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          新しい期限
        </label>
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className={inputClass}
        />
        <p className="text-xs text-gray-400 mt-1">
          空欄にすると期限なしに変更されます
        </p>
      </div>

      {/* 変更理由 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          変更理由
          <span className="ml-1 text-xs font-normal text-gray-400">（任意）</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="例: 仕様変更のため2週間延長"
          className={`${inputClass} resize-none`}
        />
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {success && (
        <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          期限を変更しました。
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "変更中..." : "期限を変更する"}
      </button>
    </form>
  );
}
