"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Task } from "@/types/task";

type AssigneeOption = {
  id: string;
  display_name: string;
};

type Props =
  | {
      mode: "create";
      projectId: string;
      members: AssigneeOption[];
      task?: undefined;
    }
  | {
      mode: "edit";
      task: Task;
      members: AssigneeOption[];
      projectId?: undefined;
    };


function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function TaskForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const task = isEdit ? props.task : undefined;

  const [title, setTitle] = useState(task?.title ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id ?? "");
  const [dueDate, setDueDate] = useState(toDateInputValue(task?.due_date));
  const [dod, setDod] = useState(task?.definition_of_done ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const url = isEdit
      ? `/api/tasks/${task!.id}`
      : `/api/projects/${props.projectId}/tasks`;

    const body: Record<string, unknown> = {
      title: title.trim(),
      assignee_id: assigneeId || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      definition_of_done: dod.trim() || null,
    };

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setErrorMsg(json.error ?? "保存に失敗しました。");
      setStatus("error");
      return;
    }

    if (isEdit) {
      router.push(`/dashboard/tasks/${task!.id}`);
    } else {
      router.push(`/dashboard/projects/${props.projectId}/tasks`);
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!isEdit) return;
    setDeleting(true);

    const res = await fetch(`/api/tasks/${task!.id}`, { method: "DELETE" });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setErrorMsg(json.error ?? "削除に失敗しました。");
      setDeleting(false);
      return;
    }

    router.push(`/dashboard/projects/${task!.project_id}/tasks`);
    router.refresh();
  }

  const inputClass =
    "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* タイトル */}
      <div>
        <label htmlFor="taskTitle" className={labelClass}>
          タイトル <span className="text-red-400">*</span>
        </label>
        <input
          id="taskTitle"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
          placeholder="例: ログイン画面の実装"
          className={inputClass}
        />
        <p className="text-xs text-gray-400 mt-1.5">{title.length} / 200</p>
      </div>

      {/* 担当者 */}
      <div>
        <label htmlFor="taskAssignee" className={labelClass}>
          担当者
        </label>
        <select
          id="taskAssignee"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className={inputClass}
        >
          <option value="">未割り当て</option>
          {props.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* 期日 */}
      <div>
        <label htmlFor="taskDueDate" className={labelClass}>
          期日
        </label>
        <input
          id="taskDueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={inputClass}
        />
      </div>


      {/* 完了定義 */}
      <div>
        <label htmlFor="taskDod" className={labelClass}>
          完了の定義 (Definition of Done)
        </label>
        <textarea
          id="taskDod"
          value={dod}
          onChange={(e) => setDod(e.target.value)}
          rows={4}
          placeholder="このタスクが完了したと見なす条件を記入してください"
          className={`${inputClass} resize-none`}
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
        disabled={title.trim().length === 0 || status === "saving"}
        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "saving"
          ? "保存中..."
          : isEdit
            ? "変更を保存"
            : "タスクを作成"}
      </button>

      {/* Danger Zone */}
      {isEdit && (
        <div className="mt-10 border-t border-gray-100 pt-8">
          <h3 className="text-sm font-semibold text-red-600 mb-3">Danger Zone</h3>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              このタスクを削除する
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
