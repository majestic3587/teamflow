import { vi } from "vitest";
import type { Task } from "@/types/task";
import type { Profile } from "@/types/profile";

export const OWNER_ID = "owner-user-id";
export const MEMBER_ID = "member-user-id";
export const OTHER_ID = "other-user-id";

export const mockProfile = (userId = OWNER_ID): Profile => ({
  id: userId,
  display_name: `User ${userId}`,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
});

export const mockTask = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  workspace_id: "ws-1",
  project_id: "proj-1",
  created_by: OWNER_ID,
  assignee_id: MEMBER_ID,
  title: "テストタスク",
  due_date: null,
  definition_of_done: null,
  approval_status: "DRAFT",
  work_status: "NOT_STARTED",
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const mockWorkspace = {
  id: "ws-1",
  name: "テストワークスペース",
  description: "説明文",
  owner_id: OWNER_ID,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const mockComment = {
  id: "comment-1",
  task_id: "task-1",
  user_id: OWNER_ID,
  body: "テストコメント",
  created_at: "2024-01-01T00:00:00Z",
};

export function makeRequest(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown
): Request {
  return new Request("http://localhost/api/test", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export const makeParams = (id: string) => ({
  params: Promise.resolve({ id }),
});

export const makeCommentParams = (id: string, commentId: string) => ({
  params: Promise.resolve({ id, commentId }),
});

export async function parseResponse(res: Response) {
  const json = await res.json();
  return { status: res.status, body: json };
}

export function createMockContainer() {
  return {
    profileUsecase: {
      getMyProfile: vi.fn(),
      updateMyProfile: vi.fn(),
    },
    workspaceUsecase: {
      getWorkspaces: vi.fn(),
      getWorkspace: vi.fn(),
      createWorkspace: vi.fn(),
      updateWorkspace: vi.fn(),
      deleteWorkspace: vi.fn(),
      getMembers: vi.fn(),
      updateMemberRole: vi.fn(),
      getAuditLogs: vi.fn(),
    },
    projectUsecase: {
      getProject: vi.fn(),
      getProjectsByWorkspace: vi.fn(),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
    },
    taskUsecase: {
      getTask: vi.fn(),
      getTasksByProject: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      submitApproval: vi.fn(),
      approveTask: vi.fn(),
      rejectTask: vi.fn(),
      updateWorkStatus: vi.fn(),
      updateDueDate: vi.fn(),
    },
    commentUsecase: {
      getComments: vi.fn(),
      createComment: vi.fn(),
      updateComment: vi.fn(),
      deleteComment: vi.fn(),
    },
  };
}
