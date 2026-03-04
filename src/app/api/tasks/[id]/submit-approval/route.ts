import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getTaskById, updateTask } from "@/lib/db/tasks";
import { getWorkspaceMembers } from "@/lib/db/workspaces";
import {
  ok,
  unauthorized,
  notFound,
  forbidden,
  badRequest,
} from "@/lib/api-response";

type Params = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────
// POST /api/tasks/[id]/submit-approval
// Draft → PendingApproval に遷移（承認申請）
// 実行可能者: タスクの作成者 または 担当者
// ─────────────────────────────────────────
export async function POST(_request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const task = await getTaskById(supabase, id);
  if (!task) return notFound();

  // 状態チェック: DRAFT のみ申請可能
  if (task.approval_status !== "DRAFT") {
    return badRequest(
      `承認申請は DRAFT 状態のタスクにのみ実行できます。現在の状態: ${task.approval_status}`
    );
  }

  // 権限チェック: 作成者 または 担当者のみ申請可能
  const isCreator = task.created_by === user.id;
  const isAssignee = task.assignee_id === user.id;
  if (!isCreator && !isAssignee) {
    const members = await getWorkspaceMembers(supabase, task.workspace_id);
    const currentMember = members.find((m) => m.user_id === user.id);
    const isManager =
      currentMember?.role === "owner" || currentMember?.role === "manager";
    if (!isManager) return forbidden();
  }

  const updated = await updateTask(supabase, id, { approval_status: "PENDING" });
  if (!updated) return forbidden();

  return ok(updated);
}
