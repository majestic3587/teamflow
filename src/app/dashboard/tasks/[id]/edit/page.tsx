import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getTaskById } from "@/lib/db/tasks";
import { getWorkspaceMembers } from "@/lib/db/workspaces";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TaskForm } from "@/components/task/TaskForm";

export const metadata = {
  title: "タスク編集 | TeamFlow",
};

type Props = { params: Promise<{ id: string }> };

export default async function EditTaskPage({ params }: Props) {
  const { id: taskId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const task = await getTaskById(supabase, taskId);
  if (!task) notFound();

  // 編集権限チェック: 作成者 または manager/owner
  const { data: memberRow } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", task.workspace_id)
    .eq("user_id", user.id)
    .single();

  const canEdit =
    task.created_by === user.id ||
    memberRow?.role === "owner" ||
    memberRow?.role === "manager";

  if (!canEdit) redirect(`/dashboard/tasks/${taskId}`);

  const members = await getWorkspaceMembers(supabase, task.workspace_id);
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
            href={`/dashboard/tasks/${taskId}`}
            className="hover:text-gray-600 transition-colors truncate max-w-[200px]"
          >
            {task.title}
          </Link>
          <ChevronIcon />
          <span className="text-gray-600">編集</span>
        </nav>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-8">
          <h1 className="text-xl font-bold text-gray-900 mb-6">タスクを編集</h1>
          <TaskForm mode="edit" task={task} members={memberOptions} />
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
