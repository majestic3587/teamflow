import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getTaskById, updateTask } from "@/lib/db/tasks";
import {
  ok,
  unauthorized,
  notFound,
  forbidden,
  badRequest,
} from "@/lib/api-response";
import type { TaskWorkStatus } from "@/types/task";

type Params = { params: Promise<{ id: string }> };

const WORK_STATUSES: TaskWorkStatus[] = ["NOT_STARTED", "IN_PROGRESS", "DONE"];

// ─────────────────────────────────────────
// PATCH /api/tasks/[id]/status
// work_status を更新
// 制約: IN_PROGRESS / DONE は approval_status が APPROVED の場合のみ可能
// 実行可能者: 担当者 または 作成者 または manager/owner
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("リクエストボディが不正です。");
  }

  const { work_status } = body as Record<string, unknown>;

  if (!work_status || !WORK_STATUSES.includes(work_status as TaskWorkStatus)) {
    return badRequest(
      `work_status は ${WORK_STATUSES.join(", ")} のいずれかを指定してください。`
    );
  }

  const nextStatus = work_status as TaskWorkStatus;

  // APPROVED 以外は IN_PROGRESS / DONE に変更不可
  if (
    (nextStatus === "IN_PROGRESS" || nextStatus === "DONE") &&
    task.approval_status !== "APPROVED"
  ) {
    return badRequest(
      "作業を開始・完了するには、タスクが承認済み（APPROVED）である必要があります。"
    );
  }

  // 権限チェック: 担当者 / 作成者 / manager / owner
  const isAssignee = task.assignee_id === user.id;
  const isCreator = task.created_by === user.id;
  if (!isAssignee && !isCreator) {
    const { data: memberData } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", task.workspace_id)
      .eq("user_id", user.id)
      .single();
    const isManager =
      memberData?.role === "owner" || memberData?.role === "manager";
    if (!isManager) return forbidden();
  }

  const updated = await updateTask(supabase, id, { work_status: nextStatus });
  if (!updated) return forbidden();

  return ok(updated);
}
