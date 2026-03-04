import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TaskCard } from "@/components/task/TaskCard";
import { TaskFilterBar } from "@/components/task/TaskFilterBar";
import type { Task, TaskWorkStatus, TaskApprovalStatus } from "@/types/task";

export const metadata = {
  title: "自分のタスク | TeamFlow",
};

type Props = {
  searchParams: Promise<{ ws?: string; as?: string; due?: string }>;
};

function filterTasks(
  tasks: Task[],
  ws: string,
  as: string,
  due: string
): Task[] {
  const selectedWork = ws.split(",").filter(Boolean) as TaskWorkStatus[];
  const selectedApproval = as.split(",").filter(Boolean) as TaskApprovalStatus[];
  const now = new Date();

  return tasks.filter((task) => {
    if (selectedWork.length > 0 && !selectedWork.includes(task.work_status)) return false;
    if (selectedApproval.length > 0 && !selectedApproval.includes(task.approval_status)) return false;
    if (due === "overdue") {
      if (!task.due_date || task.work_status === "DONE" || new Date(task.due_date) >= now) return false;
    }
    if (due === "upcoming") {
      if (!task.due_date || new Date(task.due_date) < now) return false;
    }
    return true;
  });
}

export default async function MyTasksPage({ searchParams }: Props) {
  const { ws = "", as = "", due = "" } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 自分が担当者のタスクを全件取得
  const { data: tasksRaw } = await supabase
    .from("tasks")
    .select(
      "id, workspace_id, project_id, created_by, assignee_id, title, due_date, definition_of_done, approval_status, work_status, created_at"
    )
    .eq("assignee_id", user.id)
    .order("created_at", { ascending: false });

  const tasks = (tasksRaw ?? []) as Task[];

  // 自分の表示名をprofilesから取得
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const myDisplayName = myProfile?.display_name ?? user.user_metadata?.display_name ?? user.email ?? "";

  // プロジェクト名を一括取得
  const projectIds = Array.from(new Set(tasks.map((t) => t.project_id)));
  const projectNameMap = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name")
      .in("id", projectIds);
    projects?.forEach((p) => projectNameMap.set(p.id, p.name));
  }

  const filteredTasks = filterTasks(tasks, ws, as, due);
  const hasFilter = ws !== "" || as !== "" || due !== "";

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        {/* パンくず */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/dashboard" className="hover:text-gray-600 transition-colors">
            ダッシュボード
          </Link>
          <ChevronIcon />
          <span className="text-gray-600">自分のタスク</span>
        </nav>

        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">自分のタスク</h1>
            <p className="text-sm text-gray-500 mt-1">
              {hasFilter
                ? `${filteredTasks.length} / ${tasks.length} 件のタスク`
                : `${tasks.length} 件のタスク`}
            </p>
          </div>
        </div>

        {/* フィルターバー */}
        <Suspense>
          <TaskFilterBar totalCount={tasks.length} filteredCount={filteredTasks.length} />
        </Suspense>

        {/* タスク一覧 */}
        {tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">担当しているタスクはありません</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">条件に一致するタスクがありません</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assigneeName={myDisplayName}
                projectName={projectNameMap.get(task.project_id)}
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
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
