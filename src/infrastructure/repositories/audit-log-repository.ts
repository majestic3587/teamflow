import { SupabaseClient } from "@supabase/supabase-js";
import type { IAuditLogRepository } from "@/application/ports";
import type { AuditLogWithActor } from "@/types/audit-log";

export class AuditLogRepository implements IAuditLogRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findAllByWorkspaceId(
    workspaceId: string,
    limit: number
  ): Promise<AuditLogWithActor[]> {
    const { data, error } = await this.supabase.rpc("get_audit_logs", {
      p_workspace_id: workspaceId,
      p_limit: limit,
    });

    if (error || !data) {
      console.error("[AuditLogRepository.findAllByWorkspaceId] error:", error);
      return [];
    }
    return data as AuditLogWithActor[];
  }
}
