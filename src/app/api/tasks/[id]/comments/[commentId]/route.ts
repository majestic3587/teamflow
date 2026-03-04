import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { updateComment, deleteComment } from "@/lib/db/task-comments";
import {
  ok,
  unauthorized,
  notFound,
  forbidden,
  badRequest,
  serverError,
} from "@/lib/api-response";

type Params = { params: Promise<{ id: string; commentId: string }> };

// ─────────────────────────────────────────
// PATCH /api/tasks/[id]/comments/[commentId]
// コメント編集（自分のコメントのみ・RLS）
// ─────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { commentId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  // 対象コメントを取得して所有者チェック
  const { data: existing, error: fetchError } = await supabase
    .from("task_comments")
    .select("id, user_id")
    .eq("id", commentId)
    .single();

  if (fetchError || !existing) return notFound();
  if (existing.user_id !== user.id) return forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("リクエストボディが不正です。");
  }

  const input = body as Record<string, unknown>;
  const commentBody = input.body;

  if (typeof commentBody !== "string" || commentBody.trim().length === 0) {
    return badRequest("body は必須です。");
  }
  if (commentBody.trim().length > 2000) {
    return badRequest("body は2000文字以内で入力してください。");
  }

  const updated = await updateComment(supabase, commentId, commentBody.trim());
  if (!updated) return serverError();

  return ok(updated);
}

// ─────────────────────────────────────────
// DELETE /api/tasks/[id]/comments/[commentId]
// コメント削除（自分のコメントのみ・RLS）
// ─────────────────────────────────────────
export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { commentId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const { data: existing, error: fetchError } = await supabase
    .from("task_comments")
    .select("id, user_id")
    .eq("id", commentId)
    .single();

  if (fetchError || !existing) return notFound();
  if (existing.user_id !== user.id) return forbidden();

  const success = await deleteComment(supabase, commentId);
  if (!success) return serverError();

  return ok({ id: commentId });
}
