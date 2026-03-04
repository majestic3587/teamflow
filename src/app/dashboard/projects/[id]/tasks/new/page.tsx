import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getProjectById } from "@/lib/db/projects";
import { getWorkspaceMembers } from "@/lib/db/workspaces";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TaskForm } from "@/components/task/TaskForm";

export const metadata = {
  title: "タスク作成 | TeamFlow",
};

type Props = { params: Promise<{ id: string }> };

export default async function NewTaskPage({ params }: Props) {
  const { id: projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectById(supabase, projectId);
  if (!project) notFound();

  const members = await getWorkspaceMembers(supabase, project.workspace_id);
  const memberOptions = members.map((m) => ({
    id: m.user_id,
    display_name: m.display_name,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        {/* パンくず */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
          <Link href="/dashboard" className="hover:text-gray-600 transition-colors">
            ダッシュボード
          </Link>
          <ChevronIcon />
          <Link
            href={`/dashboard/projects/${projectId}/tasks`}
            className="hover:text-gray-600 transition-colors truncate max-w-[160px]"
          >
            {project.name}
          </Link>
          <ChevronIcon />
          <span className="text-gray-600">タスク</span>
          <ChevronIcon />
          <span className="text-gray-600">新規作成</span>
        </nav>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-8">
          <h1 className="text-xl font-bold text-gray-900 mb-6">タスクを作成</h1>
          <TaskForm mode="create" projectId={projectId} members={memberOptions} />
        </div>
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
