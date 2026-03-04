"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskComment } from "@/types/task-comment";

type Props = {
  comment: TaskComment;
  taskId: string;
  displayName: string;
  isMe: boolean;
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;

  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CommentItem({ comment, taskId, displayName, isMe }: Props) {
  const router = useRouter();
  const initial = displayName.charAt(0).toUpperCase();

  // 編集モード
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [saving, setSaving] = useState(false);

  // 削除確認モード
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  async function handleSave() {
    if (!editBody.trim()) return;
    setSaving(true);
    setError("");

    const res = await fetch(
      `/api/tasks/${taskId}/comments/${comment.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody.trim() }),
      }
    );

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "更新に失敗しました。");
      setSaving(false);
      return;
    }

    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");

    const res = await fetch(
      `/api/tasks/${taskId}/comments/${comment.id}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "削除に失敗しました。");
      setDeleting(false);
      setConfirmDelete(false);
      return;
    }

    router.refresh();
  }

  return (
    <li className="flex gap-3">
      {/* アバター */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 mt-0.5 ${
          isMe ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-600"
        }`}
      >
        {initial}
      </div>

      {/* 本文エリア */}
      <div className="flex-1 min-w-0">
        {/* ヘッダー行 */}
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {displayName}
            </span>
            {isMe && (
              <span className="text-xs text-indigo-400 font-medium">自分</span>
            )}
            <span className="text-xs text-gray-400">
              {formatDate(comment.created_at)}
            </span>
          </div>

          {/* 自分のコメントのみ操作ボタンを表示 */}
          {isMe && !editing && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setEditBody(comment.body);
                  setEditing(true);
                  setConfirmDelete(false);
                  setError("");
                }}
                className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
              >
                編集
              </button>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  削除
                </button>
              ) : (
                <span className="flex items-center gap-1.5">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-md transition-colors disabled:opacity-50"
                  >
                    {deleting ? "削除中" : "確認"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* 本文 or 編集フォーム */}
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={3}
              maxLength={2000}
              autoFocus
              className="w-full px-3 py-2 border border-indigo-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={!editBody.trim() || saving}
                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditBody(comment.body);
                  setError("");
                }}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                キャンセル
              </button>
              <span className="text-xs text-gray-400 ml-auto">
                {editBody.length} / 2000
              </span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3 whitespace-pre-wrap leading-relaxed">
            {comment.body}
          </div>
        )}

        {/* エラー */}
        {error && (
          <p className="mt-1.5 text-xs text-red-500">{error}</p>
        )}
      </div>
    </li>
  );
}
