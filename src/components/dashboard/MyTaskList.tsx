import Link from "next/link";
import type { MyTaskItem } from "@/lib/db/dashboard";
import type { TaskWorkStatus, TaskApprovalStatus } from "@/types/task";

const WORK_STATUS_CONFIG: Record<TaskWorkStatus, { label: string; className: string }> = {
  NOT_STARTED: { label: "未着手",  className: "bg-gray-100 text-gray-600" },
  IN_PROGRESS:  { label: "進行中",  className: "bg-blue-100 text-blue-700" },
  DONE:         { label: "完了",    className: "bg-emerald-100 text-emerald-700" },
};

const APPROVAL_STATUS_CONFIG: Record<TaskApprovalStatus, { label: string; className: string }> = {
  DRAFT:    { label: "下書き",   className: "bg-gray-100 text-gray-500" },
  PENDING:  { label: "承認待ち", className: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "承認済み", className: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "却下",    className: "bg-red-100 text-red-600" },
};

type Props = { tasks: MyTaskItem[] };

export function MyTaskList({ tasks }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">自分のタスク</h2>
          <span className="text-xs text-gray-400">0 件</span>
        </div>
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-gray-400">担当中のタスクはありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">自分のタスク</h2>
        <span className="text-xs text-gray-400">{tasks.length} 件</span>
      </div>

      <ul className="divide-y divide-gray-50">
        {tasks.map((task) => {
          const isOverdue =
            task.due_date &&
            new Date(task.due_date) < new Date();
          const workCfg = WORK_STATUS_CONFIG[task.work_status];
          const approvalCfg = APPROVAL_STATUS_CONFIG[task.approval_status];

          return (
            <li key={task.id}>
              <Link
                href={`/dashboard/tasks/${task.id}`}
                className="px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                {/* ステータスバッジ */}
                <div className="flex-shrink-0 flex flex-col gap-1">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${workCfg.className}`}>
                    {workCfg.label}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${approvalCfg.className}`}>
                    {approvalCfg.label}
                  </span>
                </div>

                {/* タイトル & プロジェクト */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{task.project_name}</p>
                </div>

                {/* 期日 */}
                {task.due_date && (
                  <div className={`flex-shrink-0 flex items-center gap-1 text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                    {isOverdue && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    {new Date(task.due_date).toLocaleDateString("ja-JP")}
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
