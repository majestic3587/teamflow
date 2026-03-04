import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getTaskById, updateTask } from "@/lib/db/tasks";
import { createDueDateChange } from "@/lib/db/due-date-changes";
import {
  ok,
  unauthorized,
  notFound,
  forbidden,
  badRequest,
} from "@/lib/api-response";

type Params = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────
// PATCH /api/tasks/[id]/due-date
// 期限を変更し、変更履歴を記録する
// 実行可能者: owner または manager のみ
// ─────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const task = await getTaskById(supabase, id);
  if (!task) return notFound();

  // 権限チェック: owner / manager のみ
  const { data: memberRow } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", task.workspace_id)
    .eq("user_id", user.id)
    .single();

  const canChange =
    memberRow?.role === "owner" || memberRow?.role === "manager";
  if (!canChange) {
    return forbidden();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("リクエストボディが不正です。");
  }

  const input = body as Record<string, unknown>;

  // new_due_date: ISO文字列 または null（期限なしに変更）
  if (!("new_due_date" in input)) {
    return badRequest("new_due_date は必須です。");
  }

  const rawNewDate = input.new_due_date;
  if (rawNewDate !== null && typeof rawNewDate !== "string") {
    return badRequest(
      "new_due_date は ISO 8601 形式の文字列または null で指定してください。"
    );
  }

  const newDueDate = typeof rawNewDate === "string" ? rawNewDate : null;

  // reason: 任意
  const reason =
    typeof input.reason === "string" ? input.reason.trim() || null : null;

  // 変更なしの場合は早期リターン
  const oldDueDateIso = task.due_date ?? null;
  const oldDueDateDate = oldDueDateIso ? oldDueDateIso.slice(0, 10) : null;
  const newDueDateDate = newDueDate ? newDueDate.slice(0, 10) : null;

  if (oldDueDateDate === newDueDateDate) {
    return badRequest("新しい期限が現在の期限と同じです。");
  }

  // tasks テーブルを更新
  const updated = await updateTask(supabase, id, { due_date: newDueDate });
  if (!updated) return forbidden();

  // 変更履歴を記録
  await createDueDateChange(
    supabase,
    id,
    user.id,
    oldDueDateDate,
    newDueDateDate,
    reason
  );

  return ok(updated);
}
