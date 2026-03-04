import type {
  IAuthPort,
  IWorkspaceRepository,
  IAuditLogRepository,
} from "@/application/ports";
import {
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  internal,
} from "@/application/errors";
import type { Workspace, WorkspaceMemberWithUser } from "@/types/workspace";
import type { AuditLogWithActor } from "@/types/audit-log";

export class WorkspaceUsecase {
  constructor(
    private auth: IAuthPort,
    private workspaceRepo: IWorkspaceRepository,
    private auditLogRepo: IAuditLogRepository
  ) {}

  async getWorkspaces(): Promise<Workspace[]> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    return this.workspaceRepo.findAllByUserId(user.id);
  }

  async getWorkspace(workspaceId: string): Promise<Workspace> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const ws = await this.workspaceRepo.findById(workspaceId, user.id);
    if (!ws) throw notFound("ワークスペースが見つかりません。");
    return ws;
  }

  async createWorkspace(input: {
    name?: unknown;
    description?: unknown;
  }): Promise<Workspace> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    if (
      typeof input.name !== "string" ||
      input.name.trim().length === 0
    ) {
      throw badRequest("name は必須です。");
    }
    if (input.name.trim().length > 50) {
      throw badRequest("name は50文字以内で指定してください。");
    }
    if (
      input.description !== undefined &&
      input.description !== null &&
      typeof input.description !== "string"
    ) {
      throw badRequest("description は文字列で指定してください。");
    }

    const created = await this.workspaceRepo.create(user.id, {
      name: input.name.trim(),
      description:
        typeof input.description === "string"
          ? input.description.trim()
          : undefined,
    });
    if (!created) throw internal();
    return created;
  }

  async updateWorkspace(
    workspaceId: string,
    input: { name?: unknown; description?: unknown }
  ): Promise<Workspace> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const existing = await this.workspaceRepo.findById(workspaceId, user.id);
    if (!existing) throw notFound("ワークスペースが見つかりません。");

    if (input.name !== undefined) {
      if (typeof input.name !== "string" || input.name.trim().length === 0) {
        throw badRequest("name は1文字以上の文字列で指定してください。");
      }
      if (input.name.trim().length > 50) {
        throw badRequest("name は50文字以内で指定してください。");
      }
    }
    if (
      input.description !== undefined &&
      input.description !== null &&
      typeof input.description !== "string"
    ) {
      throw badRequest("description は文字列で指定してください。");
    }

    const patch: { name?: string; description?: string } = {};
    if (typeof input.name === "string") patch.name = input.name.trim();
    if (typeof input.description === "string")
      patch.description = input.description.trim();
    if (Object.keys(patch).length === 0) {
      throw badRequest("更新するフィールドを指定してください。");
    }

    const updated = await this.workspaceRepo.update(workspaceId, patch);
    if (!updated) throw forbidden();
    return updated;
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const existing = await this.workspaceRepo.findById(workspaceId, user.id);
    if (!existing) throw notFound("ワークスペースが見つかりません。");

    const ok = await this.workspaceRepo.delete(workspaceId);
    if (!ok) throw internal();
  }

  async getMembers(workspaceId: string): Promise<WorkspaceMemberWithUser[]> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const members = await this.workspaceRepo.getMembers(workspaceId);
    if (members.length === 0) throw forbidden();
    return members;
  }

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    input: { role?: unknown }
  ): Promise<{ success: boolean }> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const validRoles = ["owner", "manager", "member"] as const;
    if (
      typeof input.role !== "string" ||
      !validRoles.includes(input.role as (typeof validRoles)[number])
    ) {
      throw badRequest(
        "role は owner / manager / member のいずれかを指定してください。"
      );
    }

    const result = await this.workspaceRepo.updateMemberRole(
      workspaceId,
      targetUserId,
      input.role as "owner" | "manager" | "member"
    );
    if (!result.success) throw forbidden(result.error ?? "権限がありません。");
    return { success: true };
  }

  async getAuditLogs(
    workspaceId: string,
    limit?: number
  ): Promise<AuditLogWithActor[]> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const existing = await this.workspaceRepo.findById(workspaceId, user.id);
    if (!existing) throw notFound("ワークスペースが見つかりません。");

    const safeLimit = Math.min(Math.max(limit ?? 50, 1), 500);
    return this.auditLogRepo.findAllByWorkspaceId(workspaceId, safeLimit);
  }
}
