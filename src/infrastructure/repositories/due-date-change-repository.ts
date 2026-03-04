import { SupabaseClient } from "@supabase/supabase-js";
import type { IDueDateChangeRepository } from "@/application/ports";
import type { DueDateChange } from "@/types/due-date-change";

const FIELDS = "id, task_id, changed_by, old_due_date, new_due_date, reason, created_at";

export class DueDateChangeRepository implements IDueDateChangeRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(
    taskId: string,
    changedBy: string,
    oldDueDate: string | null,
    newDueDate: string | null,
    reason: string | null
  ): Promise<DueDateChange | null> {
    const { error: insertError } = await this.supabase
      .from("due_date_changes")
      .insert({
        task_id: taskId,
        changed_by: changedBy,
        old_due_date: oldDueDate,
        new_due_date: newDueDate,
        reason: reason ?? null,
      });

    if (insertError) {
      console.error("[DueDateChangeRepository.create] insert error:", insertError);
      return null;
    }

    const { data, error: selectError } = await this.supabase
      .from("due_date_changes")
      .select(FIELDS)
      .eq("task_id", taskId)
      .eq("changed_by", changedBy)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (selectError || !data) {
      console.error("[DueDateChangeRepository.create] select error:", selectError);
      return null;
    }
    return data as DueDateChange;
  }
}
