import { SupabaseClient } from "@supabase/supabase-js";
import {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from "@/types/project";

const PROJECT_FIELDS =
  "id, workspace_id, name, description, created_by, created_at, updated_at";

/** ワークスペース配下のプロジェクト一覧を取得（RLS で所属チェック） */
export async function getProjectsByWorkspaceId(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_FIELDS)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[getProjectsByWorkspaceId] error:", error);
    return [];
  }
  return data as Project[];
}

/** プロジェクトを1件取得（RLS で所属チェック） */
export async function getProjectById(
  supabase: SupabaseClient,
  projectId: string
): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_FIELDS)
    .eq("id", projectId)
    .single();

  if (error || !data) return null;
  return data as Project;
}

/** プロジェクトを作成（RLS で所属チェック） */
export async function createProject(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
  input: CreateProjectInput
): Promise<Project | null> {
  const { error: insertError } = await supabase.from("projects").insert({
    workspace_id: workspaceId,
    name: input.name,
    description: input.description ?? null,
    created_by: userId,
  });

  if (insertError) {
    console.error("[createProject] insert error:", insertError);
    return null;
  }

  // INSERT + SELECT 分離（workspace の RETURNING 問題と同様のパターン回避）
  const { data, error: selectError } = await supabase
    .from("projects")
    .select(PROJECT_FIELDS)
    .eq("workspace_id", workspaceId)
    .eq("name", input.name)
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (selectError || !data) {
    console.error("[createProject] select error:", selectError);
    return null;
  }
  return data as Project;
}

/** プロジェクトを更新（RLS で manager/owner チェック） */
export async function updateProject(
  supabase: SupabaseClient,
  projectId: string,
  input: UpdateProjectInput
): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .update(input)
    .eq("id", projectId)
    .select(PROJECT_FIELDS)
    .single();

  if (error || !data) {
    console.error("[updateProject] error:", error);
    return null;
  }
  return data as Project;
}

/** プロジェクトを削除（RLS で manager/owner チェック） */
export async function deleteProject(
  supabase: SupabaseClient,
  projectId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) console.error("[deleteProject] error:", error);
  return !error;
}
