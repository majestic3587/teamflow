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
// POST /api/tasks/[id]/approve
// PendingApproval → Approved に遷移（承認）
// 実行可能者: manager または owner（ワークスペース）
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

  // 状態チェック: PENDING のみ承認可能
  if (task.approval_status !== "PENDING") {
    return badRequest(
      `承認は PENDING 状態のタスクにのみ実行できます。現在の状態: ${task.approval_status}`
    );
  }

  // 権限チェック: manager または owner のみ承認可能
  const members = await getWorkspaceMembers(supabase, task.workspace_id);
  const currentMember = members.find((m) => m.user_id === user.id);
  const canApprove =
    currentMember?.role === "owner" || currentMember?.role === "manager";
  if (!canApprove) return forbidden();

  const updated = await updateTask(supabase, id, { approval_status: "APPROVED" });
  if (!updated) return forbidden();

  return ok(updated);
}
