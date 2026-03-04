import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getTaskById } from "@/lib/db/tasks";
import { getCommentsByTaskId, createComment } from "@/lib/db/task-comments";
import {
  ok,
  created,
  unauthorized,
  notFound,
  badRequest,
  serverError,
} from "@/lib/api-response";

type Params = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────
// GET /api/tasks/[id]/comments
// タスクのコメント一覧（所属必須・RLS）
// ─────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id: taskId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const task = await getTaskById(supabase, taskId);
  if (!task) return notFound();

  const comments = await getCommentsByTaskId(supabase, taskId);
  return ok(comments);
}

// ─────────────────────────────────────────
// POST /api/tasks/[id]/comments
// コメント投稿（所属必須・RLS）
// ─────────────────────────────────────────
export async function POST(request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id: taskId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const task = await getTaskById(supabase, taskId);
  if (!task) return notFound();

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

  const comment = await createComment(supabase, taskId, user.id, commentBody.trim());
  if (!comment) return serverError();

  return created(comment);
}
