import type {
  IAuthPort,
  ITaskRepository,
  ICommentRepository,
} from "@/application/ports";
import {
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  internal,
} from "@/application/errors";
import type { TaskComment } from "@/types/task-comment";

export class CommentUsecase {
  constructor(
    private auth: IAuthPort,
    private taskRepo: ITaskRepository,
    private commentRepo: ICommentRepository
  ) {}

  async getComments(taskId: string): Promise<TaskComment[]> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const task = await this.taskRepo.findById(taskId);
    if (!task) throw notFound("タスクが見つかりません。");

    return this.commentRepo.findAllByTaskId(taskId);
  }

  async createComment(
    taskId: string,
    input: { body?: unknown }
  ): Promise<TaskComment> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const task = await this.taskRepo.findById(taskId);
    if (!task) throw notFound("タスクが見つかりません。");

    if (typeof input.body !== "string" || input.body.trim().length === 0) {
      throw badRequest("body は必須です。");
    }
    if (input.body.trim().length > 2000) {
      throw badRequest("body は2000文字以内で指定してください。");
    }

    const created = await this.commentRepo.create(
      taskId,
      user.id,
      input.body.trim()
    );
    if (!created) throw internal();
    return created;
  }

  async updateComment(
    commentId: string,
    input: { body?: unknown }
  ): Promise<TaskComment> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const existing = await this.commentRepo.findById(commentId);
    if (!existing) throw notFound("コメントが見つかりません。");

    if (existing.user_id !== user.id) {
      throw forbidden("他のユーザーのコメントは編集できません。");
    }

    if (typeof input.body !== "string" || input.body.trim().length === 0) {
      throw badRequest("body は必須です。");
    }
    if (input.body.trim().length > 2000) {
      throw badRequest("body は2000文字以内で指定してください。");
    }

    const updated = await this.commentRepo.update(
      commentId,
      input.body.trim()
    );
    if (!updated) throw internal();
    return updated;
  }

  async deleteComment(commentId: string): Promise<void> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const existing = await this.commentRepo.findById(commentId);
    if (!existing) throw notFound("コメントが見つかりません。");

    if (existing.user_id !== user.id) {
      throw forbidden("他のユーザーのコメントは削除できません。");
    }

    const ok = await this.commentRepo.delete(commentId);
    if (!ok) throw internal();
  }
}
