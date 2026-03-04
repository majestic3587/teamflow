import { createClient } from "@/utils/supabase/server";
import { SupabaseAuthAdapter } from "./auth-adapter";
import { ProfileRepository } from "../repositories/profile-repository";
import { WorkspaceRepository } from "../repositories/workspace-repository";
import { ProjectRepository } from "../repositories/project-repository";
import { TaskRepository } from "../repositories/task-repository";
import { CommentRepository } from "../repositories/comment-repository";
import { DueDateChangeRepository } from "../repositories/due-date-change-repository";
import { AuditLogRepository } from "../repositories/audit-log-repository";
import { ProfileUsecase } from "@/application/usecases/profile-usecase";
import { WorkspaceUsecase } from "@/application/usecases/workspace-usecase";
import { ProjectUsecase } from "@/application/usecases/project-usecase";
import { TaskUsecase } from "@/application/usecases/task-usecase";
import { CommentUsecase } from "@/application/usecases/comment-usecase";

export async function createContainer() {
  const supabase = await createClient();

  const auth = new SupabaseAuthAdapter(supabase);
  const profileRepo = new ProfileRepository(supabase);
  const workspaceRepo = new WorkspaceRepository(supabase);
  const projectRepo = new ProjectRepository(supabase);
  const taskRepo = new TaskRepository(supabase);
  const commentRepo = new CommentRepository(supabase);
  const dueDateChangeRepo = new DueDateChangeRepository(supabase);
  const auditLogRepo = new AuditLogRepository(supabase);

  return {
    supabase,
    profileUsecase: new ProfileUsecase(auth, profileRepo),
    workspaceUsecase: new WorkspaceUsecase(auth, workspaceRepo, auditLogRepo),
    projectUsecase: new ProjectUsecase(auth, projectRepo),
    taskUsecase: new TaskUsecase(auth, taskRepo, projectRepo, workspaceRepo, dueDateChangeRepo),
    commentUsecase: new CommentUsecase(auth, taskRepo, commentRepo),
  };
}
