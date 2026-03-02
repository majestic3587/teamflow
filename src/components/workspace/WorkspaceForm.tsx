"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Workspace } from "@/types/workspace";

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  workspace?: Workspace;
  isOwner?: boolean;
};

export function WorkspaceForm({ mode, workspace, isOwner = false }: Props) {
  const router = useRouter();
  const [name, setName] = useState(workspace?.name ?? "");
  const [description, setDescription] = useState(workspace?.description ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting" | "error">("idle");

  const isEdit = mode === "edit";
  const isDirty = isEdit
    ? name.trim() !== workspace?.name || description.trim() !== (workspace?.description ?? "")
    : name.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const body = {
      name: name.trim(),
      description: description.trim() || undefined,
    };

    const res = await fetch(
      isEdit ? `/api/workspaces/${workspace!.id}` : "/api/workspaces",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setErrorMsg(json.error ?? "保存に失敗しました。");
      setStatus("error");
      return;
    }

    router.push("/dashboard/workspaces");
    router.refresh();
  }

  async function handleDelete() {
    setDeleteStatus("deleting");

    const res = await fetch(`/api/workspaces/${workspace!.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setDeleteStatus("error");
      setShowDeleteConfirm(false);
      return;
    }

    router.push("/dashboard/workspaces");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* 編集フォーム */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ワークスペース名 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            ワークスペース名
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            required
            placeholder="例: 新規事業開発チーム"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
          <p className="text-xs text-gray-400 mt-1.5">{name.length} / 50</p>
        </div>

        {/* 説明 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
            説明
            <span className="text-xs text-gray-400 ml-2">（任意）</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="ワークスペースの目的や概要を入力してください"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
          />
          <p className="text-xs text-gray-400 mt-1.5">{description.length} / 200</p>
        </div>

        {/* エラー */}
        {status === "error" && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errorMsg}
          </div>
        )}

        {/* 保存・キャンセルボタン */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!isDirty || status === "saving"}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "saving" ? "保存中..." : isEdit ? "変更を保存" : "作成する"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </form>

      {/* 危険ゾーン（owner かつ edit モードのみ表示） */}
      {isEdit && isOwner && (
        <div className="border border-red-100 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-red-600 mb-1">危険な操作</h2>
          <p className="text-xs text-gray-400 mb-4">
            ワークスペースを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。
          </p>

          {deleteStatus === "error" && (
            <p className="text-xs text-red-500 mb-3">削除に失敗しました。もう一度お試しください。</p>
          )}

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm font-medium text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              ワークスペースを削除する
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteStatus === "deleting"}
                className="text-sm font-semibold text-white bg-red-500 px-4 py-2 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteStatus === "deleting" ? "削除中..." : "本当に削除する"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                キャンセル
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
