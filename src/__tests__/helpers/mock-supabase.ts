import { vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import type { Task } from "@/types/task";
import type { Profile } from "@/types/profile";

// ─── 固定フィクスチャ ────────────────────────────────────────────

export const OWNER_ID = "owner-user-id";
export const MEMBER_ID = "member-user-id";
export const OTHER_ID = "other-user-id";

export const mockUser = (id = OWNER_ID): User =>
  ({
    id,
    email: `${id}@example.com`,
    user_metadata: { display_name: `User ${id}` },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  }) as unknown as User;

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

export const mockWorkspaceMembers = (userId = OWNER_ID, role = "owner") => [
  {
    id: "member-row-1",
    workspace_id: "ws-1",
    user_id: userId,
    role,
    created_at: "2024-01-01T00:00:00Z",
    display_name: `User ${userId}`,
    email: `${userId}@example.com`,
  },
];

// ─── モック Supabase クライアント ────────────────────────────────

export function createMockSupabase(authedUserId: string | null = OWNER_ID) {
  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue(
        authedUserId
          ? { data: { user: mockUser(authedUserId) }, error: null }
          : { data: { user: null }, error: new Error("Not authenticated") }
      ),
      updateUser: vi.fn().mockResolvedValue({
        data: { user: mockUser(authedUserId ?? OWNER_ID) },
        error: null,
      }),
    },
    from: vi.fn(),
  };
  return supabase;
}

// ─── Next.js リクエスト生成ヘルパー ──────────────────────────────

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

// ─── レスポンス検証ヘルパー ──────────────────────────────────────

export async function parseResponse(res: Response) {
  const json = await res.json();
  return { status: res.status, body: json };
}
