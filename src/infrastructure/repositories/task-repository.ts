import { SupabaseClient } from "@supabase/supabase-js";
import type { ITaskRepository } from "@/application/ports";
import type { Task, CreateTaskInput, UpdateTaskInput } from "@/types/task";

const TASK_FIELDS =
  "id, workspace_id, project_id, created_by, assignee_id, title, due_date, definition_of_done, approval_status, work_status, created_at";

export class TaskRepository implements ITaskRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(taskId: string): Promise<Task | null> {
    const { data, error } = await this.supabase
      .from("tasks")
      .select(TASK_FIELDS)
      .eq("id", taskId)
      .single();

    if (error || !data) return null;
    return data as Task;
  }

  async findAllByProjectId(projectId: string): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from("tasks")
      .select(TASK_FIELDS)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("[TaskRepository.findAllByProjectId] error:", error);
      return [];
    }
    return data as Task[];
  }

  async create(
    projectId: string,
    workspaceId: string,
    userId: string,
    input: CreateTaskInput
  ): Promise<Task | null> {
    const { error: insertError } = await this.supabase.from("tasks").insert({
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
      console.error("[TaskRepository.create] insert error:", insertError);
      return null;
    }

    const { data, error: selectError } = await this.supabase
      .from("tasks")
      .select(TASK_FIELDS)
      .eq("project_id", projectId)
      .eq("created_by", userId)
      .eq("title", input.title)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (selectError || !data) {
      console.error("[TaskRepository.create] select error:", selectError);
      return null;
    }
    return data as Task;
  }

  async update(taskId: string, input: UpdateTaskInput): Promise<Task | null> {
    const { data, error } = await this.supabase
      .from("tasks")
      .update(input)
      .eq("id", taskId)
      .select(TASK_FIELDS)
      .single();

    if (error || !data) {
      console.error("[TaskRepository.update] error:", error);
      return null;
    }
    return data as Task;
  }

  async delete(taskId: string): Promise<boolean> {
    const { error } = await this.supabase.from("tasks").delete().eq("id", taskId);
    if (error) console.error("[TaskRepository.delete] error:", error);
    return !error;
  }
}
