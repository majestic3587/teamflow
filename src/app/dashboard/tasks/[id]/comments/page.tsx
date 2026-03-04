import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getTaskById } from "@/lib/db/tasks";
import { getCommentsByTaskId } from "@/lib/db/task-comments";
import { getDueDateChangesByTaskId } from "@/lib/db/due-date-changes";
import { getWorkspaceMembers } from "@/lib/db/workspaces";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CommentForm } from "@/components/task/CommentForm";
import { CommentItem } from "@/components/task/CommentItem";
import { DueDateChangeForm } from "@/components/task/DueDateChangeForm";
import type { TaskComment } from "@/types/task-comment";
import type { DueDateChange } from "@/types/due-date-change";

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

  const [comments, dueDateChanges, members] = await Promise.all([
    getCommentsByTaskId(supabase, taskId),
    getDueDateChangesByTaskId(supabase, taskId),
    getWorkspaceMembers(supabase, task.workspace_id),
  ]);

  const displayNameMap = new Map<string, string>();
  members.forEach((m) => displayNameMap.set(m.user_id, m.display_name));

  // owner/manager かどうか
  const currentMember = members.find((m) => m.user_id === user.id);
  const canChangeDueDate =
    currentMember?.role === "owner" || currentMember?.role === "manager";

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
          {task.due_date && (
            <p className="text-xs text-gray-500 mt-1">
              期限:{" "}
              {new Date(task.due_date).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
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
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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

        {/* 期限変更履歴 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-5">
            期限変更履歴
            <span className="ml-2 text-xs font-normal text-gray-400">
              {dueDateChanges.length} 件
            </span>
          </h2>

          {dueDateChanges.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              期限変更の履歴はありません
            </p>
          ) : (
            <ol className="relative border-l border-gray-200 ml-2 space-y-6">
              {dueDateChanges.map((change: DueDateChange) => (
                <DueDateChangeEntry
                  key={change.id}
                  change={change}
                  displayName={
                    change.changed_by
                      ? (displayNameMap.get(change.changed_by) ?? change.changed_by)
                      : "不明なユーザー"
                  }
                />
              ))}
            </ol>
          )}
        </div>

        {/* 期限変更フォーム（owner/manager のみ表示） */}
        {canChangeDueDate && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-6 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">
              期限を変更する
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Owner / Manager のみ変更できます
            </p>
            <DueDateChangeForm taskId={taskId} currentDueDate={task.due_date} />
          </div>
        )}

        {/* コメント投稿フォーム */}
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

// ─── 期限変更履歴エントリー ──────────────────────────────

function DueDateChangeEntry({
  change,
  displayName,
}: {
  change: DueDateChange;
  displayName: string;
}) {
  function formatDate(iso: string | null): string {
    if (!iso) return "なし";
    return new Date(iso).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <li className="ml-4">
      {/* タイムラインドット */}
      <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />

      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className="text-sm font-semibold text-gray-900">{displayName}</span>
        <span className="text-xs text-gray-400">
          {new Date(change.created_at).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
          {" "}
          {new Date(change.created_at).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* 変更内容 */}
      <div className="flex items-center gap-2 text-sm text-gray-700 flex-wrap">
        <span className="bg-red-50 text-red-500 line-through px-2 py-0.5 rounded text-xs">
          {formatDate(change.old_due_date)}
        </span>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium">
          {formatDate(change.new_due_date)}
        </span>
      </div>

      {/* 変更理由 */}
      {change.reason && (
        <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          {change.reason}
        </p>
      )}
    </li>
  );
}

function ChevronIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
