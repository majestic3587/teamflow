import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "@/app/api/tasks/[id]/route";
import {
  createMockSupabase,
  makeRequest,
  makeParams,
  mockTask,
  parseResponse,
  OWNER_ID,
} from "../../helpers/mock-supabase";

vi.mock("@/utils/supabase/server");
vi.mock("@/lib/db/tasks");

import { createClient } from "@/utils/supabase/server";
import { getTaskById, updateTask, deleteTask } from "@/lib/db/tasks";

const mockedCreateClient = vi.mocked(createClient);
const mockedGetTaskById = vi.mocked(getTaskById);
const mockedUpdateTask = vi.mocked(updateTask);
const mockedDeleteTask = vi.mocked(deleteTask);

// ─── GET /api/tasks/[id] ────────────────────────────────────────

describe("GET /api/tasks/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("未認証の場合 401 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(null) as never);
    const req = new NextRequest(makeRequest("GET"));

    const res = await GET(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("タスクが存在しない場合 404 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(null);

    const req = new NextRequest(makeRequest("GET"));
    const res = await GET(req, makeParams("nonexistent"));
    expect((await parseResponse(res)).status).toBe(404);
  });

  it("タスクを 200 で返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    const task = mockTask();
    mockedGetTaskById.mockResolvedValue(task);

    const req = new NextRequest(makeRequest("GET"));
    const res = await GET(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.id).toBe("task-1");
    expect(body.data.title).toBe("テストタスク");
  });
});

// ─── PATCH /api/tasks/[id] ──────────────────────────────────────

describe("PATCH /api/tasks/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("未認証の場合 401 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(null) as never);
    const req = new NextRequest(makeRequest("PATCH", { title: "更新" }));

    const res = await PATCH(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("タスクが存在しない場合 404 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(null);

    const req = new NextRequest(makeRequest("PATCH", { title: "更新" }));
    const res = await PATCH(req, makeParams("nonexistent"));
    expect((await parseResponse(res)).status).toBe(404);
  });

  it("title を正常に更新できる", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    const task = mockTask();
    mockedGetTaskById.mockResolvedValue(task);
    const updated = mockTask({ title: "更新後タイトル" });
    mockedUpdateTask.mockResolvedValue(updated);

    const req = new NextRequest(makeRequest("PATCH", { title: "更新後タイトル" }));
    const res = await PATCH(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.title).toBe("更新後タイトル");
  });

  it("title が空文字の場合 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask());

    const req = new NextRequest(makeRequest("PATCH", { title: "" }));
    const res = await PATCH(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("title が 200 文字超の場合 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask());

    const req = new NextRequest(makeRequest("PATCH", { title: "あ".repeat(201) }));
    const res = await PATCH(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("不正な approval_status の場合 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask());

    const req = new NextRequest(makeRequest("PATCH", { approval_status: "INVALID" }));
    const res = await PATCH(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("APPROVED でないタスクを IN_PROGRESS にしようとすると 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask({ approval_status: "DRAFT" }));

    const req = new NextRequest(makeRequest("PATCH", { work_status: "IN_PROGRESS" }));
    const res = await PATCH(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("APPROVED タスクを IN_PROGRESS に変更できる", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(
      mockTask({ approval_status: "APPROVED" })
    );
    mockedUpdateTask.mockResolvedValue(
      mockTask({ approval_status: "APPROVED", work_status: "IN_PROGRESS" })
    );

    const req = new NextRequest(makeRequest("PATCH", { work_status: "IN_PROGRESS" }));
    const res = await PATCH(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.work_status).toBe("IN_PROGRESS");
  });

  it("更新フィールドが空の場合 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask());

    const req = new NextRequest(makeRequest("PATCH", {}));
    const res = await PATCH(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });
});

// ─── DELETE /api/tasks/[id] ─────────────────────────────────────

describe("DELETE /api/tasks/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("未認証の場合 401 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(null) as never);
    const req = new NextRequest(makeRequest("DELETE"));

    const res = await DELETE(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("タスクが存在しない場合 404 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(null);

    const req = new NextRequest(makeRequest("DELETE"));
    const res = await DELETE(req, makeParams("nonexistent"));
    expect((await parseResponse(res)).status).toBe(404);
  });

  it("正常に削除できた場合 200 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask());
    mockedDeleteTask.mockResolvedValue(true);

    const req = new NextRequest(makeRequest("DELETE"));
    const res = await DELETE(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.id).toBe("task-1");
  });

  it("削除に失敗した場合 500 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask());
    mockedDeleteTask.mockResolvedValue(false);

    const req = new NextRequest(makeRequest("DELETE"));
    const res = await DELETE(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(500);
  });
});
