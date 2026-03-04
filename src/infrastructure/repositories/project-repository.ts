import { SupabaseClient } from "@supabase/supabase-js";
import type { IProjectRepository } from "@/application/ports";
import type { Project, CreateProjectInput, UpdateProjectInput } from "@/types/project";

const PROJECT_FIELDS =
  "id, workspace_id, name, description, created_by, created_at, updated_at";

export class ProjectRepository implements IProjectRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(projectId: string): Promise<Project | null> {
    const { data, error } = await this.supabase
      .from("projects")
      .select(PROJECT_FIELDS)
      .eq("id", projectId)
      .single();

    if (error || !data) return null;
    return data as Project;
  }

  async findAllByWorkspaceId(workspaceId: string): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from("projects")
      .select(PROJECT_FIELDS)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("[ProjectRepository.findAllByWorkspaceId] error:", error);
      return [];
    }
    return data as Project[];
  }

  async create(
    workspaceId: string,
    userId: string,
    input: CreateProjectInput
  ): Promise<Project | null> {
    const { error: insertError } = await this.supabase.from("projects").insert({
      workspace_id: workspaceId,
      name: input.name,
      description: input.description ?? null,
      created_by: userId,
    });

    if (insertError) {
      console.error("[ProjectRepository.create] insert error:", insertError);
      return null;
    }

    const { data, error: selectError } = await this.supabase
      .from("projects")
      .select(PROJECT_FIELDS)
      .eq("workspace_id", workspaceId)
      .eq("name", input.name)
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (selectError || !data) {
      console.error("[ProjectRepository.create] select error:", selectError);
      return null;
    }
    return data as Project;
  }

  async update(projectId: string, input: UpdateProjectInput): Promise<Project | null> {
    const { data, error } = await this.supabase
      .from("projects")
      .update(input)
      .eq("id", projectId)
      .select(PROJECT_FIELDS)
      .single();

    if (error || !data) {
      console.error("[ProjectRepository.update] error:", error);
      return null;
    }
    return data as Project;
  }

  async delete(projectId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) console.error("[ProjectRepository.delete] error:", error);
    return !error;
  }
}
