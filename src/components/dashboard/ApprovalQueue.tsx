import Link from "next/link";
import type { ApprovalQueueItem } from "@/lib/db/dashboard";

type Props = { tasks: ApprovalQueueItem[] };

export function ApprovalQueue({ tasks }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">承認待ちキュー</h2>
        </div>
        <div className="px-6 py-12 text-center">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">承認待ちのタスクはありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">承認待ちキュー</h2>
        <span className="text-xs bg-yellow-100 text-yellow-700 font-medium px-2.5 py-1 rounded-full">
          {tasks.length} 件
        </span>
      </div>

      <ul className="divide-y divide-gray-50">
        {tasks.map((task) => {
          const isOverdue =
            task.due_date && new Date(task.due_date) < new Date();

          return (
            <li key={task.id} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400 truncate">{task.project_name}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-xs text-gray-400">申請者: {task.requester_name}</span>
                  </div>
                  {task.due_date && (
                    <p className={`text-xs mt-0.5 ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                      期限: {new Date(task.due_date).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                </div>

                <Link
                  href={`/dashboard/tasks/${task.id}`}
                  className="flex-shrink-0 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  確認する
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
