import { SupabaseClient } from "@supabase/supabase-js";
import {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "@/types/workspace";

const WORKSPACE_FIELDS = "id, name, description, owner_id, created_at, updated_at";

/** 自分が所属するワークスペース一覧を取得 */
export async function getWorkspacesByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select(`workspace:workspaces(${WORKSPACE_FIELDS})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data
    .map((row) => {
      const ws = row.workspace;
      // Supabase はリレーションを配列で返すため、単一オブジェクトに正規化する
      return Array.isArray(ws) ? (ws[0] as Workspace ?? null) : (ws as Workspace | null);
    })
    .filter((w): w is Workspace => w !== null);
}

/** ワークスペースを1件取得（メンバーのみアクセス可） */
export async function getWorkspaceById(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string
): Promise<Workspace | null> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select(`workspace:workspaces(${WORKSPACE_FIELDS})`)
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  const ws = (data as { workspace: Workspace | Workspace[] | null }).workspace;
  return Array.isArray(ws) ? (ws[0] ?? null) : ws;
}

/**
 * ワークスペースを作成する。
 * 作成者の workspace_members への owner 追加は DB Trigger (handle_new_workspace) が行う。
 */
export async function createWorkspace(
  supabase: SupabaseClient,
  userId: string,
  input: CreateWorkspaceInput
): Promise<Workspace | null> {
  // INSERT と SELECT を分離する。
  // .insert().select() だと RETURNING 句が使われ、workspaces の SELECT ポリシー
  // (workspace_members の存在チェック) が AFTER INSERT トリガーとの
  // タイミング問題で失敗するため。
  const { error: insertError } = await supabase
    .from("workspaces")
    .insert({ name: input.name, description: input.description ?? null, owner_id: userId });

  if (insertError) {
    console.error("[createWorkspace] insert error:", insertError);
    return null;
  }

  // トリガーが workspace_members に owner 行を作成済みなので SELECT は通る
  const { data: workspace, error: selectError } = await supabase
    .from("workspaces")
    .select(WORKSPACE_FIELDS)
    .eq("owner_id", userId)
    .eq("name", input.name)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (selectError || !workspace) {
    console.error("[createWorkspace] select error:", selectError);
    return null;
  }
  return workspace as Workspace;
}

/**
 * ワークスペースを更新する。
 * owner チェックは RLS ("workspaces: update for owner") に委譲する。
 */
export async function updateWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  input: UpdateWorkspaceInput
): Promise<Workspace | null> {
  const { data, error } = await supabase
    .from("workspaces")
    .update(input)
    .eq("id", workspaceId)
    .select(WORKSPACE_FIELDS)
    .single();

  if (error || !data) {
    console.error("[updateWorkspace] error:", error);
    return null;
  }
  return data as Workspace;
}

/**
 * ワークスペースを削除する。
 * owner チェックは RLS ("workspaces: delete for owner") に委譲する。
 */
export async function deleteWorkspace(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", workspaceId);

  if (error) console.error("[deleteWorkspace] error:", error);
  return !error;
}
