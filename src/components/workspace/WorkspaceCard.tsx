import Link from "next/link";
import type { Workspace } from "@/types/workspace";

type Props = {
  workspace: Workspace;
};

export function WorkspaceCard({ workspace }: Props) {
  const basePath = `/dashboard/workspaces/${workspace.id}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col">
      {/* ワークスペース情報 */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-base font-bold text-indigo-600">
            {workspace.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {workspace.name}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(workspace.created_at).toLocaleDateString("ja-JP")}
          </p>
        </div>
      </div>

      {workspace.description && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-4">
          {workspace.description}
        </p>
      )}

      {/* 区切り線 + アクションリンク */}
      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center gap-2">
        <Link
          href={`${basePath}/projects`}
          className="text-xs text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          プロジェクト
        </Link>
        <Link
          href={`${basePath}/members`}
          className="text-xs text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          メンバー
        </Link>
        <Link
          href={`${basePath}/audit-logs`}
          className="text-xs text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          監査ログ
        </Link>
        <Link
          href={`${basePath}/edit`}
          className="ml-auto text-xs text-gray-400 hover:text-indigo-600 transition-colors"
        >
          編集
        </Link>
      </div>
    </div>
  );
}
