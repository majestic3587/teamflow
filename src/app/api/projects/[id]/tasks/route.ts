import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getProjectById } from "@/lib/db/projects";
import { getTasksByProjectId, createTask } from "@/lib/db/tasks";
import {
  ok,
  created,
  unauthorized,
  notFound,
  badRequest,
  serverError,
} from "@/lib/api-response";
import type { TaskApprovalStatus, TaskWorkStatus } from "@/types/task";

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
// GET /api/projects/[id]/tasks
// プロジェクト配下のタスク一覧（所属必須・RLS）
// ─────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id: projectId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const project = await getProjectById(supabase, projectId);
  if (!project) return notFound();

  const tasks = await getTasksByProjectId(supabase, projectId);
  return ok(tasks);
}

// ─────────────────────────────────────────
// POST /api/projects/[id]/tasks
// タスク新規作成（所属必須・RLS）
// ─────────────────────────────────────────
export async function POST(request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id: projectId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const project = await getProjectById(supabase, projectId);
  if (!project) return notFound();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("リクエストボディが不正です。");
  }

  const input = body as Record<string, unknown>;

  const title = input.title;
  if (typeof title !== "string" || title.trim().length === 0) {
    return badRequest("title は必須です。");
  }
  if (title.trim().length > 200) {
    return badRequest("title は200文字以内で入力してください。");
  }

  const assigneeId = input.assignee_id;
  if (
    assigneeId !== undefined &&
    assigneeId !== null &&
    typeof assigneeId !== "string"
  ) {
    return badRequest("assignee_id は文字列または null で入力してください。");
  }

  const dueDate = input.due_date;
  if (
    dueDate !== undefined &&
    dueDate !== null &&
    typeof dueDate !== "string"
  ) {
    return badRequest("due_date は ISO 8601 形式の文字列または null で入力してください。");
  }

  const dod = input.definition_of_done;
  if (dod !== undefined && dod !== null && typeof dod !== "string") {
    return badRequest("definition_of_done は文字列または null で入力してください。");
  }

  const approvalStatus = input.approval_status;
  if (
    approvalStatus !== undefined &&
    !APPROVAL_STATUSES.includes(approvalStatus as TaskApprovalStatus)
  ) {
    return badRequest(
      `approval_status は ${APPROVAL_STATUSES.join(", ")} のいずれかで入力してください。`
    );
  }

  const workStatus = input.work_status;
  if (
    workStatus !== undefined &&
    !WORK_STATUSES.includes(workStatus as TaskWorkStatus)
  ) {
    return badRequest(
      `work_status は ${WORK_STATUSES.join(", ")} のいずれかで入力してください。`
    );
  }

  const task = await createTask(supabase, projectId, project.workspace_id, user.id, {
    title: title.trim(),
    assignee_id: typeof assigneeId === "string" ? assigneeId : null,
    due_date: typeof dueDate === "string" ? dueDate : null,
    definition_of_done: typeof dod === "string" ? dod.trim() || null : null,
    approval_status: approvalStatus as TaskApprovalStatus | undefined,
    work_status: workStatus as TaskWorkStatus | undefined,
  });
  if (!task) return serverError();

  return created(task);
}
