import { SupabaseClient } from "@supabase/supabase-js";
import type { ICommentRepository } from "@/application/ports";
import type { TaskComment } from "@/types/task-comment";

const COMMENT_FIELDS = "id, task_id, user_id, body, created_at";

export class CommentRepository implements ICommentRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findAllByTaskId(taskId: string): Promise<TaskComment[]> {
    const { data, error } = await this.supabase
      .from("task_comments")
      .select(COMMENT_FIELDS)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error || !data) {
      console.error("[CommentRepository.findAllByTaskId] error:", error);
      return [];
    }
    return data as TaskComment[];
  }

  async findById(commentId: string): Promise<{ id: string; user_id: string } | null> {
    const { data } = await this.supabase
      .from("task_comments")
      .select("id, user_id")
      .eq("id", commentId)
      .single();

    return data ?? null;
  }

  async create(taskId: string, userId: string, body: string): Promise<TaskComment | null> {
    const { error: insertError } = await this.supabase
      .from("task_comments")
      .insert({ task_id: taskId, user_id: userId, body });

    if (insertError) {
      console.error("[CommentRepository.create] insert error:", insertError);
      return null;
    }

    const { data, error: selectError } = await this.supabase
      .from("task_comments")
      .select(COMMENT_FIELDS)
      .eq("task_id", taskId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (selectError || !data) {
      console.error("[CommentRepository.create] select error:", selectError);
      return null;
    }
    return data as TaskComment;
  }

  async update(commentId: string, body: string): Promise<TaskComment | null> {
    const { data, error } = await this.supabase
      .from("task_comments")
      .update({ body })
      .eq("id", commentId)
      .select(COMMENT_FIELDS)
      .single();

    if (error || !data) {
      console.error("[CommentRepository.update] error:", error);
      return null;
    }
    return data as TaskComment;
  }

  async delete(commentId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("task_comments")
      .delete()
      .eq("id", commentId);

    if (error) console.error("[CommentRepository.delete] error:", error);
    return !error;
  }
}
