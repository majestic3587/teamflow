import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PATCH as patchStatus } from "@/app/api/tasks/[id]/status/route";
import { GET as getComments, POST as postComment } from "@/app/api/tasks/[id]/comments/route";
import {
  createMockSupabase,
  makeRequest,
  makeParams,
  mockTask,
  parseResponse,
  OWNER_ID,
  MEMBER_ID,
  OTHER_ID,
} from "../../helpers/mock-supabase";

vi.mock("@/utils/supabase/server");
vi.mock("@/lib/db/tasks");
vi.mock("@/lib/db/task-comments");

import { createClient } from "@/utils/supabase/server";
import { getTaskById, updateTask } from "@/lib/db/tasks";
import { getCommentsByTaskId, createComment } from "@/lib/db/task-comments";

const mockedCreateClient = vi.mocked(createClient);
const mockedGetTaskById = vi.mocked(getTaskById);
const mockedUpdateTask = vi.mocked(updateTask);
const mockedGetCommentsByTaskId = vi.mocked(getCommentsByTaskId);
const mockedCreateComment = vi.mocked(createComment);

const mockComment = {
  id: "comment-1",
  task_id: "task-1",
  user_id: OWNER_ID,
  body: "テストコメント",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// ─── PATCH /api/tasks/[id]/status ──────────────────────────────

describe("PATCH /api/tasks/[id]/status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("未認証の場合 401 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(null) as never);
    const req = new NextRequest(makeRequest("PATCH", { work_status: "IN_PROGRESS" }));

    const res = await patchStatus(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("タスクが存在しない場合 404 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(null);

    const req = new NextRequest(makeRequest("PATCH", { work_status: "IN_PROGRESS" }));
    const res = await patchStatus(req, makeParams("nonexistent"));
    expect((await parseResponse(res)).status).toBe(404);
  });

  it("不正な work_status の場合 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask());

    const req = new NextRequest(makeRequest("PATCH", { work_status: "INVALID" }));
    const res = await patchStatus(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("APPROVED でないタスクを IN_PROGRESS にすると 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask({ approval_status: "DRAFT" }));

    const req = new NextRequest(makeRequest("PATCH", { work_status: "IN_PROGRESS" }));
    const res = await patchStatus(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("APPROVED でないタスクを DONE にすると 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask({ approval_status: "PENDING" }));

    const req = new NextRequest(makeRequest("PATCH", { work_status: "DONE" }));
    const res = await patchStatus(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("担当者が APPROVED タスクを IN_PROGRESS に変更できる", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(MEMBER_ID) as never);
    mockedGetTaskById.mockResolvedValue(
      mockTask({ approval_status: "APPROVED", assignee_id: MEMBER_ID })
    );
    mockedUpdateTask.mockResolvedValue(
      mockTask({ approval_status: "APPROVED", work_status: "IN_PROGRESS" })
    );

    const req = new NextRequest(makeRequest("PATCH", { work_status: "IN_PROGRESS" }));
    const res = await patchStatus(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.work_status).toBe("IN_PROGRESS");
  });

  it("作成者が NOT_STARTED に戻せる", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(
      mockTask({
        approval_status: "APPROVED",
        work_status: "IN_PROGRESS",
        created_by: OWNER_ID,
      })
    );
    mockedUpdateTask.mockResolvedValue(
      mockTask({ approval_status: "APPROVED", work_status: "NOT_STARTED" })
    );

    const req = new NextRequest(makeRequest("PATCH", { work_status: "NOT_STARTED" }));
    const res = await patchStatus(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(200);
  });

  it("無関係なユーザーが変更しようとすると 403 を返す", async () => {
    const mockSupabase = createMockSupabase(OTHER_ID);
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    (mockSupabase as unknown as { from: typeof fromMock }).from = fromMock;
    mockedCreateClient.mockResolvedValue(mockSupabase as never);
    mockedGetTaskById.mockResolvedValue(
      mockTask({ created_by: OWNER_ID, assignee_id: MEMBER_ID })
    );

    const req = new NextRequest(makeRequest("PATCH", { work_status: "NOT_STARTED" }));
    const res = await patchStatus(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(403);
  });
});

// ─── GET /api/tasks/[id]/comments ──────────────────────────────

describe("GET /api/tasks/[id]/comments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("未認証の場合 401 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(null) as never);
    const req = new NextRequest(makeRequest("GET"));

    const res = await getComments(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("タスクが存在しない場合 404 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(null);

    const req = new NextRequest(makeRequest("GET"));
    const res = await getComments(req, makeParams("nonexistent"));
    expect((await parseResponse(res)).status).toBe(404);
  });

  it("コメント一覧を 200 で返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask());
    mockedGetCommentsByTaskId.mockResolvedValue([mockComment] as never);

    const req = new NextRequest(makeRequest("GET"));
    const res = await getComments(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].body).toBe("テストコメント");
  });
});

// ─── POST /api/tasks/[id]/comments ─────────────────────────────

describe("POST /api/tasks/[id]/comments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("未認証の場合 401 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(null) as never);
    const req = new NextRequest(makeRequest("POST", { body: "コメント" }));

    const res = await postComment(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("タスクが存在しない場合 404 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(null);

    const req = new NextRequest(makeRequest("POST", { body: "コメント" }));
    const res = await postComment(req, makeParams("nonexistent"));
    expect((await parseResponse(res)).status).toBe(404);
  });

  it("正常なコメントで 201 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask());
    mockedCreateComment.mockResolvedValue(mockComment as never);

    const req = new NextRequest(makeRequest("POST", { body: "テストコメント" }));
    const res = await postComment(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(201);
    expect(body.data.body).toBe("テストコメント");
  });

  it("body が空の場合 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask());

    const req = new NextRequest(makeRequest("POST", { body: "" }));
    const res = await postComment(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("body が 2000 文字超の場合 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask());

    const req = new NextRequest(makeRequest("POST", { body: "あ".repeat(2001) }));
    const res = await postComment(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("createComment が null の場合 500 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask());
    mockedCreateComment.mockResolvedValue(null as never);

    const req = new NextRequest(makeRequest("POST", { body: "コメント" }));
    const res = await postComment(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(500);
  });
});
