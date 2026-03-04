import type { IAuthPort, IProjectRepository } from "@/application/ports";
import {
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  internal,
} from "@/application/errors";
import type { Project } from "@/types/project";

export class ProjectUsecase {
  constructor(
    private auth: IAuthPort,
    private projectRepo: IProjectRepository
  ) {}

  async getProject(projectId: string): Promise<Project> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const project = await this.projectRepo.findById(projectId);
    if (!project) throw notFound("プロジェクトが見つかりません。");
    return project;
  }

  async getProjectsByWorkspace(workspaceId: string): Promise<Project[]> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    return this.projectRepo.findAllByWorkspaceId(workspaceId);
  }

  async createProject(
    workspaceId: string,
    input: { name?: unknown; description?: unknown }
  ): Promise<Project> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    if (typeof input.name !== "string" || input.name.trim().length === 0) {
      throw badRequest("name は必須です。");
    }
    if (input.name.trim().length > 100) {
      throw badRequest("name は100文字以内で指定してください。");
    }
    if (
      input.description !== undefined &&
      input.description !== null &&
      typeof input.description !== "string"
    ) {
      throw badRequest("description は文字列で指定してください。");
    }

    const created = await this.projectRepo.create(workspaceId, user.id, {
      name: input.name.trim(),
      description:
        typeof input.description === "string"
          ? input.description.trim()
          : undefined,
    });
    if (!created) throw internal();
    return created;
  }

  async updateProject(
    projectId: string,
    input: { name?: unknown; description?: unknown }
  ): Promise<Project> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const existing = await this.projectRepo.findById(projectId);
    if (!existing) throw notFound("プロジェクトが見つかりません。");

    if (input.name !== undefined) {
      if (typeof input.name !== "string" || input.name.trim().length === 0) {
        throw badRequest("name は1文字以上の文字列で指定してください。");
      }
      if (input.name.trim().length > 100) {
        throw badRequest("name は100文字以内で指定してください。");
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

    const updated = await this.projectRepo.update(projectId, patch);
    if (!updated) throw forbidden();
    return updated;
  }

  async deleteProject(projectId: string): Promise<void> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const existing = await this.projectRepo.findById(projectId);
    if (!existing) throw notFound("プロジェクトが見つかりません。");

    const ok = await this.projectRepo.delete(projectId);
    if (!ok) throw internal();
  }
}
