import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getProjectById } from "@/lib/db/projects";
import { getWorkspaceById } from "@/lib/db/workspaces";
import { getTasksByProjectId } from "@/lib/db/tasks";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TaskCard } from "@/components/task/TaskCard";
import type { Task } from "@/types/task";

export const metadata = {
  title: "タスク一覧 | TeamFlow",
};

type Props = { params: Promise<{ id: string }> };

export default async function ProjectTasksPage({ params }: Props) {
  const { id: projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectById(supabase, projectId);
  if (!project) notFound();

  const [workspace, tasks] = await Promise.all([
    getWorkspaceById(supabase, project.workspace_id, user.id),
    getTasksByProjectId(supabase, projectId),
  ]);

  // 担当者プロフィールを一括取得
  const assigneeIds = Array.from(
    new Set(
      tasks.filter((t: Task) => t.assignee_id).map((t: Task) => t.assignee_id!)
    )
  );
  const profileMap = new Map<string, string>();
  if (assigneeIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", assigneeIds);
    profiles?.forEach((p) => profileMap.set(p.id, p.display_name));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        {/* パンくず */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
          <Link href="/dashboard" className="hover:text-gray-600 transition-colors">
            ダッシュボード
          </Link>
          <ChevronIcon />
          <Link
            href="/dashboard/workspaces"
            className="hover:text-gray-600 transition-colors"
          >
            ワークスペース
          </Link>
          {workspace && (
            <>
              <ChevronIcon />
              <Link
                href={`/dashboard/workspaces/${workspace.id}/projects`}
                className="hover:text-gray-600 transition-colors truncate max-w-[120px]"
              >
                {workspace.name}
              </Link>
            </>
          )}
          <ChevronIcon />
          <span className="text-gray-600 truncate max-w-[120px]">{project.name}</span>
          <ChevronIcon />
          <span className="text-gray-600">タスク</span>
        </nav>

        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">タスク</h1>
            <p className="text-sm text-gray-500 mt-1">{tasks.length} 件のタスク</p>
          </div>
          <Link
            href={`/dashboard/projects/${projectId}/tasks/new`}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            新規作成
          </Link>
        </div>

        {/* タスク一覧 */}
        {tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-4">まだタスクがありません</p>
            <Link
              href={`/dashboard/projects/${projectId}/tasks/new`}
              className="text-indigo-600 text-sm font-medium hover:text-indigo-700"
            >
              最初のタスクを作成する →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tasks.map((task: Task) => (
              <TaskCard
                key={task.id}
                task={task}
                assigneeName={
                  task.assignee_id ? profileMap.get(task.assignee_id) : null
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="w-4 h-4 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
