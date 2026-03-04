"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  taskId: string;
  currentDueDate: string | null;
};

const DEADLINE_TEMPLATE = (dueDate: string | null) =>
  `【期限変更申請】
現在の期日: ${dueDate ? new Date(dueDate).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" }) : "未設定"}
希望する新しい期日: 
変更理由: `;

export function CommentForm({ taskId, currentDueDate }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim() }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "投稿に失敗しました。");
      setSubmitting(false);
      return;
    }

    setBody("");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="コメントを入力してください..."
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
      />

      <div className="flex items-center justify-between gap-3">
        {/* 期限変更申請テンプレ */}
        <button
          type="button"
          onClick={() => setBody(DEADLINE_TEMPLATE(currentDueDate))}
          className="text-xs text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-400 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          📅 期限変更申請テンプレを使う
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{body.length} / 2000</span>
          <button
            type="submit"
            disabled={!body.trim() || submitting}
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "投稿中..." : "投稿する"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          <svg
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}
    </form>
  );
}
