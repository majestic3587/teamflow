export type TaskApprovalStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
export type TaskWorkStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";

export type Task = {
  id: string;
  workspace_id: string;
  project_id: string;
  created_by: string;
  assignee_id: string | null;
  title: string;
  due_date: string | null;
  definition_of_done: string | null;
  approval_status: TaskApprovalStatus;
  work_status: TaskWorkStatus;
  created_at: string;
};

export type CreateTaskInput = {
  title: string;
  assignee_id?: string | null;
  due_date?: string | null;
  definition_of_done?: string | null;
  approval_status?: TaskApprovalStatus;
  work_status?: TaskWorkStatus;
};

export type UpdateTaskInput = {
  title?: string;
  assignee_id?: string | null;
  due_date?: string | null;
  definition_of_done?: string | null;
  approval_status?: TaskApprovalStatus;
  work_status?: TaskWorkStatus;
};
