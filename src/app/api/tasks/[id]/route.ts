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
import type { TaskApprovalStatus, TaskWorkStatus, UpdateTaskInput } from "@/types/task";

type Params = { params: Promise<{ id: string }> };

const APPROVAL_STATUSES: TaskApprovalStatus[] = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
];
const WORK_STATUSES: TaskWorkStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "DONE",
];

// ─────────────────────────────────────────
// GET /api/tasks/[id]
// タスク詳細（所属必須・RLS）
// ─────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const task = await getTaskById(supabase, id);
  if (!task) return notFound();

  return ok(task);
}

// ─────────────────────────────────────────
// PATCH /api/tasks/[id]
// タスク更新（作成者 or Manager 以上・RLS）
// ─────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const existing = await getTaskById(supabase, id);
  if (!existing) return notFound();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("リクエストボディが不正です。");
  }

  const input = body as Record<string, unknown>;
  const patch: UpdateTaskInput = {};

  if ("title" in input) {
    const title = input.title;
    if (typeof title !== "string" || title.trim().length === 0) {
      return badRequest("title は1文字以上の文字列で入力してください。");
    }
    if (title.trim().length > 200) {
      return badRequest("title は200文字以内で入力してください。");
    }
    patch.title = title.trim();
  }

  if ("assignee_id" in input) {
    const assigneeId = input.assignee_id;
    if (assigneeId !== null && typeof assigneeId !== "string") {
      return badRequest("assignee_id は文字列または null で入力してください。");
    }
    patch.assignee_id = typeof assigneeId === "string" ? assigneeId : null;
  }

  if ("due_date" in input) {
    const dueDate = input.due_date;
    if (dueDate !== null && typeof dueDate !== "string") {
      return badRequest("due_date は ISO 8601 形式の文字列または null で入力してください。");
    }
    patch.due_date = typeof dueDate === "string" ? dueDate : null;
  }

  if ("definition_of_done" in input) {
    const dod = input.definition_of_done;
    if (dod !== null && typeof dod !== "string") {
      return badRequest("definition_of_done は文字列または null で入力してください。");
    }
    patch.definition_of_done = typeof dod === "string" ? dod.trim() || null : null;
  }

  if ("approval_status" in input) {
    const status = input.approval_status;
    if (!APPROVAL_STATUSES.includes(status as TaskApprovalStatus)) {
      return badRequest(
        `approval_status は ${APPROVAL_STATUSES.join(", ")} のいずれかで入力してください。`
      );
    }
    patch.approval_status = status as TaskApprovalStatus;
  }

  if ("work_status" in input) {
    const status = input.work_status;
    if (!WORK_STATUSES.includes(status as TaskWorkStatus)) {
      return badRequest(
        `work_status は ${WORK_STATUSES.join(", ")} のいずれかで入力してください。`
      );
    }
    patch.work_status = status as TaskWorkStatus;
  }

  if (Object.keys(patch).length === 0) {
    return badRequest("更新するフィールドを指定してください。");
  }

  const updated = await updateTask(supabase, id, patch);
  if (!updated) return forbidden();

  return ok(updated);
}
