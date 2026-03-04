import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "@/app/api/tasks/[id]/route";
import { AppError } from "@/application/errors";
import {
  createMockContainer,
  makeRequest,
  makeParams,
  mockTask,
  parseResponse,
} from "../../helpers/mock-supabase";

vi.mock("@/infrastructure/supabase/container");

import { createContainer } from "@/infrastructure/supabase/container";
const mockedCreateContainer = vi.mocked(createContainer);

// ─── GET /api/tasks/[id] ────────────────────────────────────────

describe("GET /api/tasks/[id]", () => {
  let container: ReturnType<typeof createMockContainer>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createMockContainer();
    mockedCreateContainer.mockResolvedValue(container as never);
  });

  it("未認証の場合 401 を返す", async () => {
    container.taskUsecase.getTask.mockRejectedValue(
      new AppError("UNAUTHORIZED", "認証が必要です。")
    );

    const req = new NextRequest(makeRequest("GET"));
    const res = await GET(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("タスクが存在しない場合 404 を返す", async () => {
    container.taskUsecase.getTask.mockRejectedValue(
      new AppError("NOT_FOUND", "タスクが見つかりません。")
    );

    const req = new NextRequest(makeRequest("GET"));
    const res = await GET(req, makeParams("nonexistent"));
    expect((await parseResponse(res)).status).toBe(404);
  });

  it("タスクを 200 で返す", async () => {
    const task = mockTask();
    container.taskUsecase.getTask.mockResolvedValue(task);

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
  let container: ReturnType<typeof createMockContainer>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createMockContainer();
    mockedCreateContainer.mockResolvedValue(container as never);
  });

  it("未認証の場合 401 を返す", async () => {
    container.taskUsecase.updateTask.mockRejectedValue(
      new AppError("UNAUTHORIZED", "認証が必要です。")
    );

    const req = new NextRequest(makeRequest("PATCH", { title: "更新" }));
    const res = await PATCH(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("タスクが存在しない場合 404 を返す", async () => {
    container.taskUsecase.updateTask.mockRejectedValue(
      new AppError("NOT_FOUND", "タスクが見つかりません。")
    );

    const req = new NextRequest(makeRequest("PATCH", { title: "更新" }));
    const res = await PATCH(req, makeParams("nonexistent"));
    expect((await parseResponse(res)).status).toBe(404);
  });

  it("title を正常に更新できる", async () => {
    const updated = mockTask({ title: "更新後タイトル" });
    container.taskUsecase.updateTask.mockResolvedValue(updated);

    const req = new NextRequest(
      makeRequest("PATCH", { title: "更新後タイトル" })
    );
    const res = await PATCH(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.title).toBe("更新後タイトル");
  });

  it("title が空文字の場合 400 を返す", async () => {
    container.taskUsecase.updateTask.mockRejectedValue(
      new AppError(
        "BAD_REQUEST",
        "title は1文字以上の文字列で指定してください。"
      )
    );

    const req = new NextRequest(makeRequest("PATCH", { title: "" }));
    const res = await PATCH(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("title が 200 文字超の場合 400 を返す", async () => {
    container.taskUsecase.updateTask.mockRejectedValue(
      new AppError(
        "BAD_REQUEST",
        "title は200文字以内で指定してください。"
      )
    );

    const req = new NextRequest(
      makeRequest("PATCH", { title: "あ".repeat(201) })
    );
    const res = await PATCH(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("不正な approval_status の場合 400 を返す", async () => {
    container.taskUsecase.updateTask.mockRejectedValue(
      new AppError("BAD_REQUEST", "approval_status の値が不正です。")
    );

    const req = new NextRequest(
      makeRequest("PATCH", { approval_status: "INVALID" })
    );
    const res = await PATCH(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("APPROVED でないタスクを IN_PROGRESS にしようとすると 400 を返す", async () => {
    container.taskUsecase.updateTask.mockRejectedValue(
      new AppError(
        "BAD_REQUEST",
        "承認済み (APPROVED) でないタスクを着手済み・完了にすることはできません。"
      )
    );

    const req = new NextRequest(
      makeRequest("PATCH", { work_status: "IN_PROGRESS" })
    );
    const res = await PATCH(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("APPROVED タスクを IN_PROGRESS に変更できる", async () => {
    const updated = mockTask({
      approval_status: "APPROVED",
      work_status: "IN_PROGRESS",
    });
    container.taskUsecase.updateTask.mockResolvedValue(updated);

    const req = new NextRequest(
      makeRequest("PATCH", { work_status: "IN_PROGRESS" })
    );
    const res = await PATCH(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.work_status).toBe("IN_PROGRESS");
  });

  it("更新フィールドが空の場合 400 を返す", async () => {
    container.taskUsecase.updateTask.mockRejectedValue(
      new AppError("BAD_REQUEST", "更新するフィールドを指定してください。")
    );

    const req = new NextRequest(makeRequest("PATCH", {}));
    const res = await PATCH(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });
});

// ─── DELETE /api/tasks/[id] ─────────────────────────────────────

describe("DELETE /api/tasks/[id]", () => {
  let container: ReturnType<typeof createMockContainer>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createMockContainer();
    mockedCreateContainer.mockResolvedValue(container as never);
  });

  it("未認証の場合 401 を返す", async () => {
    container.taskUsecase.deleteTask.mockRejectedValue(
      new AppError("UNAUTHORIZED", "認証が必要です。")
    );

    const req = new NextRequest(makeRequest("DELETE"));
    const res = await DELETE(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("タスクが存在しない場合 404 を返す", async () => {
    container.taskUsecase.deleteTask.mockRejectedValue(
      new AppError("NOT_FOUND", "タスクが見つかりません。")
    );

    const req = new NextRequest(makeRequest("DELETE"));
    const res = await DELETE(req, makeParams("nonexistent"));
    expect((await parseResponse(res)).status).toBe(404);
  });

  it("正常に削除できた場合 200 を返す", async () => {
    container.taskUsecase.deleteTask.mockResolvedValue(undefined);

    const req = new NextRequest(makeRequest("DELETE"));
    const res = await DELETE(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(200);
  });

  it("削除に失敗した場合 500 を返す", async () => {
    container.taskUsecase.deleteTask.mockRejectedValue(
      new AppError("INTERNAL", "サーバーエラーが発生しました。")
    );

    const req = new NextRequest(makeRequest("DELETE"));
    const res = await DELETE(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(500);
  });
});
