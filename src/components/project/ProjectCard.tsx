import Link from "next/link";
import type { Project } from "@/types/project";

type Props = {
  project: Project;
  canManage: boolean;
};

export function ProjectCard({ project, canManage }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-indigo-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-base font-bold text-emerald-600">
              {project.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {canManage && (
          <Link
            href={`/dashboard/projects/${project.id}/edit`}
            className="flex-shrink-0 text-xs text-gray-400 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            編集
          </Link>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        作成日: {new Date(project.created_at).toLocaleDateString("ja-JP")}
      </p>
    </div>
  );
}
