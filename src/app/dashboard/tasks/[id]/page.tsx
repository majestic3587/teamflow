import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getTaskById } from "@/lib/db/tasks";
import { getProjectById } from "@/lib/db/projects";
import { getWorkspaceMembers } from "@/lib/db/workspaces";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import type { TaskApprovalStatus, TaskWorkStatus } from "@/types/task";

export const metadata = {
  title: "タスク詳細 | TeamFlow",
};

type Props = { params: Promise<{ id: string }> };

const WORK_STATUS_LABELS: Record<TaskWorkStatus, string> = {
  NOT_STARTED: "未着手",
  IN_PROGRESS: "進行中",
  DONE: "完了",
};
const WORK_STATUS_STYLES: Record<TaskWorkStatus, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  DONE: "bg-emerald-100 text-emerald-700",
};
const APPROVAL_STATUS_LABELS: Record<TaskApprovalStatus, string> = {
  DRAFT: "下書き",
  PENDING: "承認待ち",
  APPROVED: "承認済み",
  REJECTED: "却下",
};
const APPROVAL_STATUS_STYLES: Record<TaskApprovalStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-500",
  PENDING: "bg-blue-100 text-blue-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};

export default async function TaskDetailPage({ params }: Props) {
  const { id: taskId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const task = await getTaskById(supabase, taskId);
  if (!task) notFound();

  const project = await getProjectById(supabase, task.project_id);

  // ワークスペースメンバー一覧を取得（auth.users の display_name を含む）
  const members = await getWorkspaceMembers(supabase, task.workspace_id);
  const displayNameMap = new Map<string, string>();
  members.forEach((m) => displayNameMap.set(m.user_id, m.display_name));

  // 編集権限: 作成者 または manager/owner
  const currentMember = members.find((m) => m.user_id === user.id);
  const canEdit =
    task.created_by === user.id ||
    currentMember?.role === "owner" ||
    currentMember?.role === "manager";

  const isOverdue =
    task.due_date &&
    task.work_status !== "DONE" &&
    new Date(task.due_date) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        {/* パンくず */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
          <Link href="/dashboard" className="hover:text-gray-600 transition-colors">
            ダッシュボード
          </Link>
          {project && (
            <>
              <ChevronIcon />
              <Link
                href={`/dashboard/projects/${project.id}/tasks`}
                className="hover:text-gray-600 transition-colors truncate max-w-[160px]"
              >
                {project.name}
              </Link>
              <ChevronIcon />
              <span className="text-gray-600">タスク</span>
            </>
          )}
          <ChevronIcon />
          <span className="text-gray-600 truncate max-w-[160px]">{task.title}</span>
        </nav>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-8">
          {/* ヘッダー */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${WORK_STATUS_STYLES[task.work_status]}`}
              >
                {WORK_STATUS_LABELS[task.work_status]}
              </span>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${APPROVAL_STATUS_STYLES[task.approval_status]}`}
              >
                {APPROVAL_STATUS_LABELS[task.approval_status]}
              </span>
            </div>
            {canEdit && (
              <Link
                href={`/dashboard/tasks/${taskId}/edit`}
                className="flex-shrink-0 text-xs text-gray-400 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                編集
              </Link>
            )}
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-8">{task.title}</h1>

          {/* 詳細情報 */}
          <dl className="space-y-5">
            <DetailRow label="担当者">
              {task.assignee_id ? (
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-xs">
                    {(displayNameMap.get(task.assignee_id) ?? "?")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-900">
                    {displayNameMap.get(task.assignee_id) ?? task.assignee_id}
                  </span>
                </span>
              ) : (
                <span className="text-sm text-gray-400">未割り当て</span>
              )}
            </DetailRow>

            <DetailRow label="期日">
              {task.due_date ? (
                <span
                  className={`text-sm ${isOverdue ? "text-red-500 font-medium" : "text-gray-900"}`}
                >
                  {isOverdue && "⚠ "}
                  {new Date(task.due_date).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {isOverdue && (
                    <span className="ml-2 text-xs text-red-400">期限超過</span>
                  )}
                </span>
              ) : (
                <span className="text-sm text-gray-400">設定なし</span>
              )}
            </DetailRow>

            <DetailRow label="作成者">
              <span className="text-sm text-gray-900">
                {displayNameMap.get(task.created_by) ?? task.created_by}
              </span>
            </DetailRow>

            <DetailRow label="作成日">
              <span className="text-sm text-gray-900">
                {new Date(task.created_at).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </DetailRow>

            {task.definition_of_done && (
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  完了の定義
                </dt>
                <dd className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3 whitespace-pre-wrap">
                  {task.definition_of_done}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </main>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <dt className="w-24 flex-shrink-0 text-xs font-semibold text-gray-500 uppercase tracking-wide pt-0.5">
        {label}
      </dt>
      <dd className="flex-1">{children}</dd>
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
