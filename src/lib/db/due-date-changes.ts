import { SupabaseClient } from "@supabase/supabase-js";
import { DueDateChange } from "@/types/due-date-change";

const FIELDS = "id, task_id, changed_by, old_due_date, new_due_date, reason, created_at";

/** タスクの期限変更履歴を取得（RLS でプロジェクトメンバーチェック） */
export async function getDueDateChangesByTaskId(
  supabase: SupabaseClient,
  taskId: string
): Promise<DueDateChange[]> {
  const { data, error } = await supabase
    .from("due_date_changes")
    .select(FIELDS)
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("[getDueDateChangesByTaskId] error:", error);
    return [];
  }
  return data as DueDateChange[];
}

/** 期限変更履歴を1件追加 */
export async function createDueDateChange(
  supabase: SupabaseClient,
  taskId: string,
  changedBy: string,
  oldDueDate: string | null,
  newDueDate: string | null,
  reason?: string | null
): Promise<DueDateChange | null> {
  const { error: insertError } = await supabase
    .from("due_date_changes")
    .insert({
      task_id: taskId,
      changed_by: changedBy,
      old_due_date: oldDueDate,
      new_due_date: newDueDate,
      reason: reason ?? null,
    });

  if (insertError) {
    console.error("[createDueDateChange] insert error:", insertError);
    return null;
  }

  const { data, error: selectError } = await supabase
    .from("due_date_changes")
    .select(FIELDS)
    .eq("task_id", taskId)
    .eq("changed_by", changedBy)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (selectError || !data) {
    console.error("[createDueDateChange] select error:", selectError);
    return null;
  }
  return data as DueDateChange;
}
