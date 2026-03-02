import { MOCK_APPROVAL_QUEUE } from "@/lib/mock/dashboard";

export function ApprovalQueue() {
  const tasks = MOCK_APPROVAL_QUEUE;

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
        {tasks.map((task) => (
          <li key={task.id} className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">{task.project}</span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400">申請者: {task.requester}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">期限: {task.dueDate}</p>
              </div>

              {/* Action buttons */}
              <div className="flex-shrink-0 flex items-center gap-2">
                <button className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                  承認
                </button>
                <button className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  差し戻し
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
