export type DueDateChange = {
  id: string;
  task_id: string;
  changed_by: string | null;
  old_due_date: string | null;
  new_due_date: string | null;
  reason: string | null;
  created_at: string;
};
