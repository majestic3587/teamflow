import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getTaskById } from "@/lib/db/tasks";
import { getCommentsByTaskId } from "@/lib/db/task-comments";
import { getWorkspaceMembers } from "@/lib/db/workspaces";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CommentForm } from "@/components/task/CommentForm";
import { CommentItem } from "@/components/task/CommentItem";
import type { TaskComment } from "@/types/task-comment";

export const metadata = {
  title: "コメント | TeamFlow",
};

type Props = { params: Promise<{ id: string }> };

export default async function TaskCommentsPage({ params }: Props) {
  const { id: taskId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const task = await getTaskById(supabase, taskId);
  if (!task) notFound();

  const [comments, members] = await Promise.all([
    getCommentsByTaskId(supabase, taskId),
    getWorkspaceMembers(supabase, task.workspace_id),
  ]);

  const displayNameMap = new Map<string, string>();
  members.forEach((m) => displayNameMap.set(m.user_id, m.display_name));

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
          <span className="text-gray-600">コメント</span>
        </nav>

        {/* タスクタイトル */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 mb-4">
          <p className="text-xs text-gray-400 mb-1">タスク</p>
          <h1 className="text-base font-semibold text-gray-900 line-clamp-2">
            {task.title}
          </h1>
        </div>

        {/* コメント一覧 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-5">
            コメント
            <span className="ml-2 text-xs font-normal text-gray-400">
              {comments.length} 件
            </span>
          </h2>

          {comments.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-400">まだコメントはありません</p>
            </div>
          ) : (
            <ul className="space-y-5">
              {comments.map((comment: TaskComment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  taskId={taskId}
                  displayName={displayNameMap.get(comment.user_id) ?? comment.user_id}
                  isMe={comment.user_id === user.id}
                />
              ))}
            </ul>
          )}
        </div>

        {/* 投稿フォーム */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            コメントを投稿
          </h2>
          <CommentForm taskId={taskId} currentDueDate={task.due_date} />
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
