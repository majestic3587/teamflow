import { SupabaseClient } from "@supabase/supabase-js";
import { AuditLogWithActor } from "@/types/audit-log";

/**
 * ワークスペースの監査ログ一覧を取得。
 * actor_display_name は RPC 関数 (get_audit_logs) が auth.users から直接解決する。
 * 所属チェックも RPC 関数側で実施。
 */
export async function getAuditLogsByWorkspaceId(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<AuditLogWithActor[]> {
  const { data, error } = await supabase.rpc("get_audit_logs", {
    p_workspace_id: workspaceId,
  });

  if (error || !data) {
    console.error("[getAuditLogsByWorkspaceId] error:", error);
    return [];
  }
  return data as AuditLogWithActor[];
}
