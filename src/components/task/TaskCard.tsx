import Link from "next/link";
import type { Task, TaskApprovalStatus, TaskWorkStatus } from "@/types/task";

type Props = {
  task: Task;
  assigneeName?: string | null;
};

const WORK_STATUS_LABELS: Record<TaskWorkStatus, string> = {
  NOT_STARTED: "未着手",
  IN_PROGRESS: "進行中",
  DONE: "完了",
};

const WORK_STATUS_STYLES: Record<TaskWorkStatus, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  DONE: "bg-emerald-100 text-emerald-700",
};

const APPROVAL_STATUS_LABELS: Record<TaskApprovalStatus, string> = {
  DRAFT: "下書き",
  PENDING: "承認待ち",
  APPROVED: "承認済み",
  REJECTED: "却下",
};

const APPROVAL_STATUS_STYLES: Record<TaskApprovalStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-500",
  PENDING: "bg-blue-100 text-blue-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};

export function TaskCard({ task, assigneeName }: Props) {
  const isOverdue =
    task.due_date &&
    task.work_status !== "DONE" &&
    new Date(task.due_date) < new Date();

  return (
    <Link href={`/dashboard/tasks/${task.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
        {/* ステータスバッジ */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${WORK_STATUS_STYLES[task.work_status]}`}
          >
            {WORK_STATUS_LABELS[task.work_status]}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${APPROVAL_STATUS_STYLES[task.approval_status]}`}
          >
            {APPROVAL_STATUS_LABELS[task.approval_status]}
          </span>
        </div>

        {/* タイトル */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
          {task.title}
        </h3>

        {/* 担当者 / 期日 */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
          <span>
            {assigneeName ? (
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-[10px]">
                  {assigneeName.charAt(0).toUpperCase()}
                </span>
                {assigneeName}
              </span>
            ) : (
              <span className="text-gray-300">未割り当て</span>
            )}
          </span>
          {task.due_date && (
            <span className={isOverdue ? "text-red-500 font-medium" : ""}>
              {isOverdue ? "⚠ " : ""}
              {new Date(task.due_date).toLocaleDateString("ja-JP")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
