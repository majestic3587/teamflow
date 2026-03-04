import { SupabaseClient } from "@supabase/supabase-js";
import { Task, CreateTaskInput, UpdateTaskInput } from "@/types/task";

const TASK_FIELDS =
  "id, workspace_id, project_id, created_by, assignee_id, title, due_date, definition_of_done, approval_status, work_status, created_at";

/** プロジェクト配下のタスク一覧を取得（RLS で所属チェック） */
export async function getTasksByProjectId(
  supabase: SupabaseClient,
  projectId: string
): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_FIELDS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[getTasksByProjectId] error:", error);
    return [];
  }
  return data as Task[];
}

/** タスクを1件取得（RLS で所属チェック） */
export async function getTaskById(
  supabase: SupabaseClient,
  taskId: string
): Promise<Task | null> {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_FIELDS)
    .eq("id", taskId)
    .single();

  if (error || !data) return null;
  return data as Task;
}

/** タスクを作成（RLS で所属チェック） */
export async function createTask(
  supabase: SupabaseClient,
  projectId: string,
  workspaceId: string,
  userId: string,
  input: CreateTaskInput
): Promise<Task | null> {
  const { error: insertError } = await supabase.from("tasks").insert({
    project_id: projectId,
    workspace_id: workspaceId,
    created_by: userId,
    title: input.title,
    assignee_id: input.assignee_id ?? null,
    due_date: input.due_date ?? null,
    definition_of_done: input.definition_of_done ?? null,
    approval_status: input.approval_status ?? "DRAFT",
    work_status: input.work_status ?? "NOT_STARTED",
  });

  if (insertError) {
    console.error("[createTask] insert error:", insertError);
    return null;
  }

  // INSERT + SELECT 分離（RETURNING 問題と同様のパターン回避）
  const { data, error: selectError } = await supabase
    .from("tasks")
    .select(TASK_FIELDS)
    .eq("project_id", projectId)
    .eq("created_by", userId)
    .eq("title", input.title)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (selectError || !data) {
    console.error("[createTask] select error:", selectError);
    return null;
  }
  return data as Task;
}

/** タスクを更新（RLS で作成者 or manager/owner チェック） */
export async function updateTask(
  supabase: SupabaseClient,
  taskId: string,
  input: UpdateTaskInput
): Promise<Task | null> {
  const { data, error } = await supabase
    .from("tasks")
    .update(input)
    .eq("id", taskId)
    .select(TASK_FIELDS)
    .single();

  if (error || !data) {
    console.error("[updateTask] error:", error);
    return null;
  }
  return data as Task;
}
