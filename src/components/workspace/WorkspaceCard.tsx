import Link from "next/link";
import type { Workspace } from "@/types/workspace";

type Props = {
  workspace: Workspace;
};

export function WorkspaceCard({ workspace }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-indigo-200 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-base font-bold text-indigo-600">
              {workspace.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{workspace.name}</h3>
            {workspace.description && (
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{workspace.description}</p>
            )}
          </div>
        </div>

        <Link
          href={`/dashboard/workspaces/${workspace.id}/edit`}
          className="flex-shrink-0 text-xs text-gray-400 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-colors"
        >
          編集
        </Link>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        作成日: {new Date(workspace.created_at).toLocaleDateString("ja-JP")}
      </p>
    </div>
  );
}
