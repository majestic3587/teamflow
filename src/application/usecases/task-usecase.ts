import type {
  IAuthPort,
  ITaskRepository,
  IProjectRepository,
  IWorkspaceRepository,
  IDueDateChangeRepository,
} from "@/application/ports";
import {
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  internal,
} from "@/application/errors";
import type {
  Task,
  TaskApprovalStatus,
  TaskWorkStatus,
} from "@/types/task";
import type { DueDateChange } from "@/types/due-date-change";

const APPROVAL_STATUSES: TaskApprovalStatus[] = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
];
const WORK_STATUSES: TaskWorkStatus[] = ["NOT_STARTED", "IN_PROGRESS", "DONE"];

export class TaskUsecase {
  constructor(
    private auth: IAuthPort,
    private taskRepo: ITaskRepository,
    private projectRepo: IProjectRepository,
    private workspaceRepo: IWorkspaceRepository,
    private dueDateChangeRepo: IDueDateChangeRepository
  ) {}

  async getTask(taskId: string): Promise<Task> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const task = await this.taskRepo.findById(taskId);
    if (!task) throw notFound("タスクが見つかりません。");
    return task;
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const project = await this.projectRepo.findById(projectId);
    if (!project) throw notFound("プロジェクトが見つかりません。");

    return this.taskRepo.findAllByProjectId(projectId);
  }

  async createTask(
    projectId: string,
    input: {
      title?: unknown;
      assignee_id?: unknown;
      due_date?: unknown;
      definition_of_done?: unknown;
      approval_status?: unknown;
      work_status?: unknown;
    }
  ): Promise<Task> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const project = await this.projectRepo.findById(projectId);
    if (!project) throw notFound("プロジェクトが見つかりません。");

    if (typeof input.title !== "string" || input.title.trim().length === 0) {
      throw badRequest("title は必須です。");
    }
    if (input.title.trim().length > 200) {
      throw badRequest("title は200文字以内で指定してください。");
    }

    if (
      input.assignee_id !== undefined &&
      input.assignee_id !== null &&
      typeof input.assignee_id !== "string"
    ) {
      throw badRequest("assignee_id は文字列で指定してください。");
    }
    if (
      input.due_date !== undefined &&
      input.due_date !== null &&
      typeof input.due_date !== "string"
    ) {
      throw badRequest("due_date は文字列で指定してください。");
    }
    if (
      input.definition_of_done !== undefined &&
      input.definition_of_done !== null &&
      typeof input.definition_of_done !== "string"
    ) {
      throw badRequest("definition_of_done は文字列で指定してください。");
    }

    if (
      input.approval_status !== undefined &&
      input.approval_status !== "DRAFT"
    ) {
      throw badRequest(
        "新規タスクの approval_status は DRAFT のみ指定できます。"
      );
    }
    if (
      input.work_status !== undefined &&
      input.work_status !== "NOT_STARTED"
    ) {
      throw badRequest(
        "新規タスクの work_status は NOT_STARTED のみ指定できます。"
      );
    }

    const created = await this.taskRepo.create(
      projectId,
      project.workspace_id,
      user.id,
      {
        title: input.title.trim(),
        assignee_id:
          typeof input.assignee_id === "string"
            ? input.assignee_id
            : null,
        due_date:
          typeof input.due_date === "string" ? input.due_date : null,
        definition_of_done:
          typeof input.definition_of_done === "string"
            ? input.definition_of_done
            : null,
        approval_status: "DRAFT",
        work_status: "NOT_STARTED",
      }
    );
    if (!created) throw internal();
    return created;
  }

  async updateTask(
    taskId: string,
    input: {
      title?: unknown;
      assignee_id?: unknown;
      due_date?: unknown;
      definition_of_done?: unknown;
      approval_status?: unknown;
      work_status?: unknown;
    }
  ): Promise<Task> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const existing = await this.taskRepo.findById(taskId);
    if (!existing) throw notFound("タスクが見つかりません。");

    if (input.title !== undefined) {
      if (typeof input.title !== "string" || input.title.trim().length === 0) {
        throw badRequest("title は1文字以上の文字列で指定してください。");
      }
      if (input.title.trim().length > 200) {
        throw badRequest("title は200文字以内で指定してください。");
      }
    }
    if (
      input.assignee_id !== undefined &&
      input.assignee_id !== null &&
      typeof input.assignee_id !== "string"
    ) {
      throw badRequest("assignee_id は文字列で指定してください。");
    }
    if (
      input.due_date !== undefined &&
      input.due_date !== null &&
      typeof input.due_date !== "string"
    ) {
      throw badRequest("due_date は文字列で指定してください。");
    }
    if (
      input.definition_of_done !== undefined &&
      input.definition_of_done !== null &&
      typeof input.definition_of_done !== "string"
    ) {
      throw badRequest("definition_of_done は文字列で指定してください。");
    }
    if (
      input.approval_status !== undefined &&
      typeof input.approval_status === "string" &&
      !APPROVAL_STATUSES.includes(input.approval_status as TaskApprovalStatus)
    ) {
      throw badRequest("approval_status の値が不正です。");
    }
    if (
      input.work_status !== undefined &&
      typeof input.work_status === "string" &&
      !WORK_STATUSES.includes(input.work_status as TaskWorkStatus)
    ) {
      throw badRequest("work_status の値が不正です。");
    }

    const newWorkStatus =
      typeof input.work_status === "string"
        ? (input.work_status as TaskWorkStatus)
        : undefined;
    if (
      newWorkStatus &&
      (newWorkStatus === "IN_PROGRESS" || newWorkStatus === "DONE") &&
      existing.approval_status !== "APPROVED"
    ) {
      throw badRequest(
        "承認済み (APPROVED) でないタスクを着手済み・完了にすることはできません。"
      );
    }

    const patch: Record<string, unknown> = {};
    if (typeof input.title === "string") patch.title = input.title.trim();
    if (input.assignee_id !== undefined)
      patch.assignee_id =
        typeof input.assignee_id === "string" ? input.assignee_id : null;
    if (input.due_date !== undefined)
      patch.due_date =
        typeof input.due_date === "string" ? input.due_date : null;
    if (input.definition_of_done !== undefined)
      patch.definition_of_done =
        typeof input.definition_of_done === "string"
          ? input.definition_of_done
          : null;
    if (typeof input.approval_status === "string")
      patch.approval_status = input.approval_status;
    if (typeof input.work_status === "string")
      patch.work_status = input.work_status;

    if (Object.keys(patch).length === 0) {
      throw badRequest("更新するフィールドを指定してください。");
    }

    const updated = await this.taskRepo.update(taskId, patch);
    if (!updated) throw forbidden();
    return updated;
  }

  async deleteTask(taskId: string): Promise<void> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const existing = await this.taskRepo.findById(taskId);
    if (!existing) throw notFound("タスクが見つかりません。");

    const ok = await this.taskRepo.delete(taskId);
    if (!ok) throw internal();
  }

  async submitApproval(taskId: string): Promise<Task> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const task = await this.taskRepo.findById(taskId);
    if (!task) throw notFound("タスクが見つかりません。");

    if (task.approval_status !== "DRAFT") {
      throw badRequest("承認申請は DRAFT 状態のタスクのみ可能です。");
    }

    const isCreatorOrAssignee =
      task.created_by === user.id || task.assignee_id === user.id;

    if (!isCreatorOrAssignee) {
      const role = await this.workspaceRepo.getMemberRole(
        task.workspace_id,
        user.id
      );
      if (role !== "owner" && role !== "manager") {
        throw forbidden("承認申請の権限がありません。");
      }
    }

    const updated = await this.taskRepo.update(taskId, {
      approval_status: "PENDING",
    });
    if (!updated) throw internal();
    return updated;
  }

  async approveTask(taskId: string): Promise<Task> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const task = await this.taskRepo.findById(taskId);
    if (!task) throw notFound("タスクが見つかりません。");

    if (task.approval_status !== "PENDING") {
      throw badRequest("承認は PENDING 状態のタスクのみ可能です。");
    }

    const members = await this.workspaceRepo.getMembers(task.workspace_id);
    const me = members.find((m) => m.user_id === user.id);
    if (!me || (me.role !== "owner" && me.role !== "manager")) {
      throw forbidden("承認権限がありません。");
    }

    const updated = await this.taskRepo.update(taskId, {
      approval_status: "APPROVED",
    });
    if (!updated) throw internal();
    return updated;
  }

  async rejectTask(taskId: string): Promise<Task> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const task = await this.taskRepo.findById(taskId);
    if (!task) throw notFound("タスクが見つかりません。");

    if (task.approval_status !== "PENDING") {
      throw badRequest("却下は PENDING 状態のタスクのみ可能です。");
    }

    const members = await this.workspaceRepo.getMembers(task.workspace_id);
    const me = members.find((m) => m.user_id === user.id);
    if (!me || (me.role !== "owner" && me.role !== "manager")) {
      throw forbidden("却下権限がありません。");
    }

    const updated = await this.taskRepo.update(taskId, {
      approval_status: "REJECTED",
    });
    if (!updated) throw internal();
    return updated;
  }

  async updateWorkStatus(
    taskId: string,
    input: { work_status?: unknown }
  ): Promise<Task> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const task = await this.taskRepo.findById(taskId);
    if (!task) throw notFound("タスクが見つかりません。");

    if (
      typeof input.work_status !== "string" ||
      !WORK_STATUSES.includes(input.work_status as TaskWorkStatus)
    ) {
      throw badRequest("work_status の値が不正です。");
    }

    const newStatus = input.work_status as TaskWorkStatus;
    if (
      (newStatus === "IN_PROGRESS" || newStatus === "DONE") &&
      task.approval_status !== "APPROVED"
    ) {
      throw badRequest(
        "承認済み (APPROVED) でないタスクを着手済み・完了にすることはできません。"
      );
    }

    const isCreatorOrAssignee =
      task.created_by === user.id || task.assignee_id === user.id;

    if (!isCreatorOrAssignee) {
      const role = await this.workspaceRepo.getMemberRole(
        task.workspace_id,
        user.id
      );
      if (role !== "owner" && role !== "manager") {
        throw forbidden("作業ステータスを更新する権限がありません。");
      }
    }

    const updated = await this.taskRepo.update(taskId, {
      work_status: newStatus,
    });
    if (!updated) throw internal();
    return updated;
  }

  async updateDueDate(
    taskId: string,
    input: { new_due_date?: unknown; reason?: unknown }
  ): Promise<{ task: Task; change: DueDateChange }> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const task = await this.taskRepo.findById(taskId);
    if (!task) throw notFound("タスクが見つかりません。");

    const role = await this.workspaceRepo.getMemberRole(
      task.workspace_id,
      user.id
    );
    if (role !== "owner" && role !== "manager") {
      throw forbidden("期日変更の権限がありません。");
    }

    if (
      input.new_due_date !== undefined &&
      input.new_due_date !== null &&
      typeof input.new_due_date !== "string"
    ) {
      throw badRequest("new_due_date は文字列で指定してください。");
    }

    const newDueDate =
      typeof input.new_due_date === "string" ? input.new_due_date : null;

    if (task.due_date === newDueDate) {
      throw badRequest("変更前と同じ期日です。");
    }

    const reason =
      typeof input.reason === "string" ? input.reason : null;

    const updated = await this.taskRepo.update(taskId, {
      due_date: newDueDate,
    });
    if (!updated) throw internal();

    const change = await this.dueDateChangeRepo.create(
      taskId,
      user.id,
      task.due_date,
      newDueDate,
      reason
    );
    if (!change) throw internal();

    return { task: updated, change };
  }
}
