"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/types/project";

type Props =
  | { mode: "create"; workspaceId: string; project?: undefined }
  | { mode: "edit"; workspaceId?: undefined; project: Project };

export function ProjectForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const project = isEdit ? props.project : undefined;

  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // 削除用
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const url = props.mode === "edit"
      ? `/api/projects/${props.project.id}`
      : `/api/workspaces/${props.workspaceId}/projects`;

    const res = await fetch(url, {
      method: props.mode === "edit" ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || undefined,
      }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setErrorMsg(json.error ?? "保存に失敗しました。");
      setStatus("error");
      return;
    }

    if (props.mode === "edit") {
      router.push(`/dashboard/workspaces/${props.project.workspace_id}/projects`);
    } else {
      router.push(`/dashboard/workspaces/${props.workspaceId}/projects`);
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!isEdit) return;
    setDeleting(true);

    if (props.mode !== "edit") return;

    const res = await fetch(`/api/projects/${props.project.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setErrorMsg(json.error ?? "削除に失敗しました。");
      setDeleting(false);
      return;
    }

    router.push(`/dashboard/workspaces/${props.project.workspace_id}/projects`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* プロジェクト名 */}
      <div>
        <label
          htmlFor="projectName"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          プロジェクト名 <span className="text-red-400">*</span>
        </label>
        <input
          id="projectName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
          placeholder="例: 新規サービス開発"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
        <p className="text-xs text-gray-400 mt-1.5">{name.length} / 100</p>
      </div>

      {/* 説明 */}
      <div>
        <label
          htmlFor="projectDesc"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          説明
        </label>
        <textarea
          id="projectDesc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="プロジェクトの概要を入力してください"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
        />
      </div>

      {/* エラー */}
      {status === "error" && (
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
          {errorMsg}
        </div>
      )}

      {/* 保存ボタン */}
      <button
        type="submit"
        disabled={name.trim().length === 0 || status === "saving"}
        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "saving"
          ? "保存中..."
          : isEdit
            ? "変更を保存"
            : "プロジェクトを作成"}
      </button>

      {/* Danger Zone */}
      {isEdit && (
        <div className="mt-10 border-t border-gray-100 pt-8">
          <h3 className="text-sm font-semibold text-red-600 mb-3">
            Danger Zone
          </h3>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              このプロジェクトを削除する
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm text-white bg-red-600 px-4 py-2 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "削除中..." : "本当に削除する"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                キャンセル
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
