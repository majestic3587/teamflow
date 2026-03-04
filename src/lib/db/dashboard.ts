import { SupabaseClient } from "@supabase/supabase-js";
import type { TaskWorkStatus, TaskApprovalStatus } from "@/types/task";

export type DashboardStats = {
  totalTasks: number;
  pendingApproval: number;
  inProgress: number;
  overdue: number;
};

export type MyTaskItem = {
  id: string;
  title: string;
  work_status: TaskWorkStatus;
  approval_status: TaskApprovalStatus;
  due_date: string | null;
  project_id: string;
  project_name: string;
};

export type ApprovalQueueItem = {
  id: string;
  title: string;
  due_date: string | null;
  project_id: string;
  project_name: string;
  requester_name: string;
};

/** ダッシュボード用の統計情報を取得（アクセス可能な全タスクを対象） */
export async function getDashboardStats(
  supabase: SupabaseClient
): Promise<DashboardStats> {
  const now = new Date().toISOString();

  const [
    { count: totalTasks },
    { count: pendingApproval },
    { count: inProgress },
    { count: overdue },
  ] = await Promise.all([
    supabase.from("tasks").select("*", { count: "exact", head: true }),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("approval_status", "PENDING"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("work_status", "IN_PROGRESS"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .neq("work_status", "DONE")
      .not("due_date", "is", null)
      .lt("due_date", now),
  ]);

  return {
    totalTasks: totalTasks ?? 0,
    pendingApproval: pendingApproval ?? 0,
    inProgress: inProgress ?? 0,
    overdue: overdue ?? 0,
  };
}

/** 自分に割り当てられた未完了タスクを取得（プロジェクト名付き） */
export async function getMyTasks(
  supabase: SupabaseClient,
  userId: string
): Promise<MyTaskItem[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, work_status, approval_status, due_date, project_id, projects(name)")
    .eq("assignee_id", userId)
    .neq("work_status", "DONE")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(10);

  if (error || !data) {
    console.error("[getMyTasks] error:", error);
    return [];
  }

  return data.map((row) => {
    const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
    return {
      id: row.id as string,
      title: row.title as string,
      work_status: row.work_status as TaskWorkStatus,
      approval_status: row.approval_status as TaskApprovalStatus,
      due_date: row.due_date as string | null,
      project_id: row.project_id as string,
      project_name: (project as { name: string } | null)?.name ?? "",
    };
  });
}

/** 自分が owner/manager のワークスペースにある承認待ちタスクを取得 */
export async function getApprovalQueue(
  supabase: SupabaseClient,
  userId: string
): Promise<ApprovalQueueItem[]> {
  // owner/manager のワークスペース ID を取得
  const { data: memberships, error: memberError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .in("role", ["owner", "manager"]);

  if (memberError || !memberships || memberships.length === 0) return [];

  const workspaceIds = memberships.map((m) => m.workspace_id as string);

  // 承認待ちタスクをプロジェクト名付きで取得
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, due_date, project_id, created_by, projects(name)")
    .eq("approval_status", "PENDING")
    .in("workspace_id", workspaceIds)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(10);

  if (error || !data) {
    console.error("[getApprovalQueue] error:", error);
    return [];
  }

  // 申請者のプロフィールを一括取得
  const requesterIds = Array.from(
    new Set(data.map((t) => t.created_by as string))
  );
  const profileMap = new Map<string, string>();
  if (requesterIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", requesterIds);
    profiles?.forEach((p) => profileMap.set(p.id, p.display_name));
  }

  return data.map((row) => {
    const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
    return {
      id: row.id as string,
      title: row.title as string,
      due_date: row.due_date as string | null,
      project_id: row.project_id as string,
      project_name: (project as { name: string } | null)?.name ?? "",
      requester_name: profileMap.get(row.created_by as string) ?? "不明",
    };
  });
}
