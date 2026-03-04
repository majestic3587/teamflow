import { SupabaseClient } from "@supabase/supabase-js";
import { TaskComment } from "@/types/task-comment";

const COMMENT_FIELDS = "id, task_id, user_id, body, created_at";

/** タスクに紐づくコメント一覧を取得（RLS でプロジェクトメンバーチェック） */
export async function getCommentsByTaskId(
  supabase: SupabaseClient,
  taskId: string
): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from("task_comments")
    .select(COMMENT_FIELDS)
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("[getCommentsByTaskId] error:", error);
    return [];
  }
  return data as TaskComment[];
}

/** コメントを更新（RLS で自分のコメントのみ） */
export async function updateComment(
  supabase: SupabaseClient,
  commentId: string,
  body: string
): Promise<TaskComment | null> {
  const { data, error } = await supabase
    .from("task_comments")
    .update({ body })
    .eq("id", commentId)
    .select(COMMENT_FIELDS)
    .single();

  if (error || !data) {
    console.error("[updateComment] error:", error);
    return null;
  }
  return data as TaskComment;
}

/** コメントを削除（RLS で自分のコメントのみ） */
export async function deleteComment(
  supabase: SupabaseClient,
  commentId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("task_comments")
    .delete()
    .eq("id", commentId);

  if (error) console.error("[deleteComment] error:", error);
  return !error;
}

/** コメントを投稿（RLS でプロジェクトメンバーチェック） */
export async function createComment(
  supabase: SupabaseClient,
  taskId: string,
  userId: string,
  body: string
): Promise<TaskComment | null> {
  const { error: insertError } = await supabase
    .from("task_comments")
    .insert({ task_id: taskId, user_id: userId, body });

  if (insertError) {
    console.error("[createComment] insert error:", insertError);
    return null;
  }

  const { data, error: selectError } = await supabase
    .from("task_comments")
    .select(COMMENT_FIELDS)
    .eq("task_id", taskId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (selectError || !data) {
    console.error("[createComment] select error:", selectError);
    return null;
  }
  return data as TaskComment;
}
