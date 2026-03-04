import type { Profile, UpdateProfileInput } from "@/types/profile";
import type { Workspace, WorkspaceMemberWithUser, WorkspaceMember, CreateWorkspaceInput, UpdateWorkspaceInput } from "@/types/workspace";
import type { Project, CreateProjectInput, UpdateProjectInput } from "@/types/project";
import type { Task, CreateTaskInput, UpdateTaskInput } from "@/types/task";
import type { TaskComment } from "@/types/task-comment";
import type { DueDateChange } from "@/types/due-date-change";
import type { AuditLogWithActor } from "@/types/audit-log";

// ─── Auth Port ──────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
};

export interface IAuthPort {
  getUser(): Promise<AuthUser | null>;
  updateUserMetadata(data: Record<string, unknown>): Promise<AuthUser | null>;
}

// ─── Profile Port ───────────────────────────────────────────────

export interface IProfileRepository {
  findById(userId: string): Promise<Profile | null>;
  update(userId: string, input: UpdateProfileInput): Promise<Profile | null>;
}

// ─── Workspace Port ─────────────────────────────────────────────

export interface IWorkspaceRepository {
  findById(workspaceId: string, userId: string): Promise<Workspace | null>;
  findAllByUserId(userId: string): Promise<Workspace[]>;
  create(userId: string, input: CreateWorkspaceInput): Promise<Workspace | null>;
  update(workspaceId: string, input: UpdateWorkspaceInput): Promise<Workspace | null>;
  delete(workspaceId: string): Promise<boolean>;
  getMembers(workspaceId: string): Promise<WorkspaceMemberWithUser[]>;
  getMemberRole(workspaceId: string, userId: string): Promise<WorkspaceMember["role"] | null>;
  updateMemberRole(workspaceId: string, targetUserId: string, newRole: WorkspaceMember["role"]): Promise<{ success: boolean; error?: string }>;
}

// ─── Project Port ───────────────────────────────────────────────

export interface IProjectRepository {
  findById(projectId: string): Promise<Project | null>;
  findAllByWorkspaceId(workspaceId: string): Promise<Project[]>;
  create(workspaceId: string, userId: string, input: CreateProjectInput): Promise<Project | null>;
  update(projectId: string, input: UpdateProjectInput): Promise<Project | null>;
  delete(projectId: string): Promise<boolean>;
}

// ─── Task Port ──────────────────────────────────────────────────

export interface ITaskRepository {
  findById(taskId: string): Promise<Task | null>;
  findAllByProjectId(projectId: string): Promise<Task[]>;
  create(projectId: string, workspaceId: string, userId: string, input: CreateTaskInput): Promise<Task | null>;
  update(taskId: string, input: UpdateTaskInput): Promise<Task | null>;
  delete(taskId: string): Promise<boolean>;
}

// ─── Comment Port ───────────────────────────────────────────────

export interface ICommentRepository {
  findAllByTaskId(taskId: string): Promise<TaskComment[]>;
  findById(commentId: string): Promise<{ id: string; user_id: string } | null>;
  create(taskId: string, userId: string, body: string): Promise<TaskComment | null>;
  update(commentId: string, body: string): Promise<TaskComment | null>;
  delete(commentId: string): Promise<boolean>;
}

// ─── DueDateChange Port ─────────────────────────────────────────

export interface IDueDateChangeRepository {
  create(
    taskId: string,
    changedBy: string,
    oldDueDate: string | null,
    newDueDate: string | null,
    reason: string | null
  ): Promise<DueDateChange | null>;
}

// ─── AuditLog Port ──────────────────────────────────────────────

export interface IAuditLogRepository {
  findAllByWorkspaceId(workspaceId: string, limit: number): Promise<AuditLogWithActor[]>;
}
