import { SupabaseClient } from "@supabase/supabase-js";
import type { IWorkspaceRepository } from "@/application/ports";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceMemberWithUser,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "@/types/workspace";

const WORKSPACE_FIELDS = "id, name, description, owner_id, created_at, updated_at";

export class WorkspaceRepository implements IWorkspaceRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(workspaceId: string, userId: string): Promise<Workspace | null> {
    const { data, error } = await this.supabase
      .from("workspace_members")
      .select(`workspace:workspaces(${WORKSPACE_FIELDS})`)
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;
    const ws = (data as { workspace: Workspace | Workspace[] | null }).workspace;
    return Array.isArray(ws) ? (ws[0] ?? null) : ws;
  }

  async findAllByUserId(userId: string): Promise<Workspace[]> {
    const { data, error } = await this.supabase
      .from("workspace_members")
      .select(`workspace:workspaces(${WORKSPACE_FIELDS})`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data
      .map((row) => {
        const ws = row.workspace;
        return Array.isArray(ws) ? (ws[0] as Workspace ?? null) : (ws as Workspace | null);
      })
      .filter((w): w is Workspace => w !== null);
  }

  async create(userId: string, input: CreateWorkspaceInput): Promise<Workspace | null> {
    const { error: insertError } = await this.supabase
      .from("workspaces")
      .insert({ name: input.name, description: input.description ?? null, owner_id: userId });

    if (insertError) {
      console.error("[WorkspaceRepository.create] insert error:", insertError);
      return null;
    }

    const { data: workspace, error: selectError } = await this.supabase
      .from("workspaces")
      .select(WORKSPACE_FIELDS)
      .eq("owner_id", userId)
      .eq("name", input.name)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (selectError || !workspace) {
      console.error("[WorkspaceRepository.create] select error:", selectError);
      return null;
    }
    return workspace as Workspace;
  }

  async update(workspaceId: string, input: UpdateWorkspaceInput): Promise<Workspace | null> {
    const { data, error } = await this.supabase
      .from("workspaces")
      .update(input)
      .eq("id", workspaceId)
      .select(WORKSPACE_FIELDS)
      .single();

    if (error || !data) {
      console.error("[WorkspaceRepository.update] error:", error);
      return null;
    }
    return data as Workspace;
  }

  async delete(workspaceId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("workspaces")
      .delete()
      .eq("id", workspaceId);

    if (error) console.error("[WorkspaceRepository.delete] error:", error);
    return !error;
  }

  async getMembers(workspaceId: string): Promise<WorkspaceMemberWithUser[]> {
    const { data, error } = await this.supabase.rpc("get_workspace_members", {
      p_workspace_id: workspaceId,
    });

    if (error || !data) {
      console.error("[WorkspaceRepository.getMembers] error:", error);
      return [];
    }
    return data as WorkspaceMemberWithUser[];
  }

  async getMemberRole(workspaceId: string, userId: string): Promise<WorkspaceMember["role"] | null> {
    const { data } = await this.supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .single();

    return data?.role ?? null;
  }

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    newRole: WorkspaceMember["role"]
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.rpc("update_member_role", {
      p_workspace_id: workspaceId,
      p_target_user_id: targetUserId,
      p_new_role: newRole,
    });

    if (error) {
      console.error("[WorkspaceRepository.updateMemberRole] error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }
}
