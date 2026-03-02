import { MOCK_MY_TASKS, type TaskStatus } from "@/lib/mock/dashboard";

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  pending_approval: { label: "承認待ち",  className: "bg-yellow-100 text-yellow-700" },
  approved:         { label: "承認済み",  className: "bg-green-100 text-green-700" },
  in_progress:      { label: "進行中",    className: "bg-blue-100 text-blue-700" },
  done:             { label: "完了",      className: "bg-gray-100 text-gray-600" },
  rejected:         { label: "差し戻し",  className: "bg-red-100 text-red-600" },
};

function isOverdue(dueDate: string, status: TaskStatus) {
  if (status === "done") return false;
  return new Date(dueDate) < new Date();
}

export function MyTaskList() {
  const tasks = MOCK_MY_TASKS;

  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">自分のタスク</h2>
        <span className="text-xs text-gray-400">{tasks.length} 件</span>
      </div>

      <ul className="divide-y divide-gray-50">
        {tasks.map((task) => {
          const overdue = isOverdue(task.dueDate, task.status);
          const { label, className } = STATUS_CONFIG[task.status];

          return (
            <li key={task.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              {/* Status badge */}
              <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${className}`}>
                {label}
              </span>

              {/* Title & project */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{task.project}</p>
              </div>

              {/* Due date */}
              <div className={`flex-shrink-0 flex items-center gap-1 text-xs ${overdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                {overdue && (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                {task.dueDate}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
