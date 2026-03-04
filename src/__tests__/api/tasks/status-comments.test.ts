import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PATCH as patchStatus } from "@/app/api/tasks/[id]/status/route";
import {
  GET as getComments,
  POST as postComment,
} from "@/app/api/tasks/[id]/comments/route";
import { AppError } from "@/application/errors";
import {
  createMockContainer,
  makeRequest,
  makeParams,
  mockTask,
  mockComment,
  parseResponse,
} from "../../helpers/mock-supabase";

vi.mock("@/infrastructure/supabase/container");

import { createContainer } from "@/infrastructure/supabase/container";
const mockedCreateContainer = vi.mocked(createContainer);

// ─── PATCH /api/tasks/[id]/status ──────────────────────────────

describe("PATCH /api/tasks/[id]/status", () => {
  let container: ReturnType<typeof createMockContainer>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createMockContainer();
    mockedCreateContainer.mockResolvedValue(container as never);
  });

  it("未認証の場合 401 を返す", async () => {
    container.taskUsecase.updateWorkStatus.mockRejectedValue(
      new AppError("UNAUTHORIZED", "認証が必要です。")
    );

    const req = new NextRequest(
      makeRequest("PATCH", { work_status: "IN_PROGRESS" })
    );
    const res = await patchStatus(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("タスクが存在しない場合 404 を返す", async () => {
    container.taskUsecase.updateWorkStatus.mockRejectedValue(
      new AppError("NOT_FOUND", "タスクが見つかりません。")
    );

    const req = new NextRequest(
      makeRequest("PATCH", { work_status: "IN_PROGRESS" })
    );
    const res = await patchStatus(req, makeParams("nonexistent"));
    expect((await parseResponse(res)).status).toBe(404);
  });

  it("不正な work_status の場合 400 を返す", async () => {
    container.taskUsecase.updateWorkStatus.mockRejectedValue(
      new AppError("BAD_REQUEST", "work_status の値が不正です。")
    );

    const req = new NextRequest(
      makeRequest("PATCH", { work_status: "INVALID" })
    );
    const res = await patchStatus(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("APPROVED でないタスクを IN_PROGRESS にすると 400 を返す", async () => {
    container.taskUsecase.updateWorkStatus.mockRejectedValue(
      new AppError(
        "BAD_REQUEST",
        "承認済み (APPROVED) でないタスクを着手済み・完了にすることはできません。"
      )
    );

    const req = new NextRequest(
      makeRequest("PATCH", { work_status: "IN_PROGRESS" })
    );
    const res = await patchStatus(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("担当者が APPROVED タスクを IN_PROGRESS に変更できる", async () => {
    const updated = mockTask({
      approval_status: "APPROVED",
      work_status: "IN_PROGRESS",
    });
    container.taskUsecase.updateWorkStatus.mockResolvedValue(updated);

    const req = new NextRequest(
      makeRequest("PATCH", { work_status: "IN_PROGRESS" })
    );
    const res = await patchStatus(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.work_status).toBe("IN_PROGRESS");
  });

  it("作成者が NOT_STARTED に戻せる", async () => {
    const updated = mockTask({
      approval_status: "APPROVED",
      work_status: "NOT_STARTED",
    });
    container.taskUsecase.updateWorkStatus.mockResolvedValue(updated);

    const req = new NextRequest(
      makeRequest("PATCH", { work_status: "NOT_STARTED" })
    );
    const res = await patchStatus(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(200);
  });

  it("無関係なユーザーが変更しようとすると 403 を返す", async () => {
    container.taskUsecase.updateWorkStatus.mockRejectedValue(
      new AppError(
        "FORBIDDEN",
        "作業ステータスを更新する権限がありません。"
      )
    );

    const req = new NextRequest(
      makeRequest("PATCH", { work_status: "NOT_STARTED" })
    );
    const res = await patchStatus(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(403);
  });
});

// ─── GET /api/tasks/[id]/comments ──────────────────────────────

describe("GET /api/tasks/[id]/comments", () => {
  let container: ReturnType<typeof createMockContainer>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createMockContainer();
    mockedCreateContainer.mockResolvedValue(container as never);
  });

  it("未認証の場合 401 を返す", async () => {
    container.commentUsecase.getComments.mockRejectedValue(
      new AppError("UNAUTHORIZED", "認証が必要です。")
    );

    const req = new NextRequest(makeRequest("GET"));
    const res = await getComments(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("タスクが存在しない場合 404 を返す", async () => {
    container.commentUsecase.getComments.mockRejectedValue(
      new AppError("NOT_FOUND", "タスクが見つかりません。")
    );

    const req = new NextRequest(makeRequest("GET"));
    const res = await getComments(req, makeParams("nonexistent"));
    expect((await parseResponse(res)).status).toBe(404);
  });

  it("コメント一覧を 200 で返す", async () => {
    container.commentUsecase.getComments.mockResolvedValue([mockComment]);

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
  let container: ReturnType<typeof createMockContainer>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createMockContainer();
    mockedCreateContainer.mockResolvedValue(container as never);
  });

  it("未認証の場合 401 を返す", async () => {
    container.commentUsecase.createComment.mockRejectedValue(
      new AppError("UNAUTHORIZED", "認証が必要です。")
    );

    const req = new NextRequest(
      makeRequest("POST", { body: "コメント" })
    );
    const res = await postComment(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("タスクが存在しない場合 404 を返す", async () => {
    container.commentUsecase.createComment.mockRejectedValue(
      new AppError("NOT_FOUND", "タスクが見つかりません。")
    );

    const req = new NextRequest(
      makeRequest("POST", { body: "コメント" })
    );
    const res = await postComment(req, makeParams("nonexistent"));
    expect((await parseResponse(res)).status).toBe(404);
  });

  it("正常なコメントで 201 を返す", async () => {
    container.commentUsecase.createComment.mockResolvedValue(mockComment);

    const req = new NextRequest(
      makeRequest("POST", { body: "テストコメント" })
    );
    const res = await postComment(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(201);
    expect(body.data.body).toBe("テストコメント");
  });

  it("body が空の場合 400 を返す", async () => {
    container.commentUsecase.createComment.mockRejectedValue(
      new AppError("BAD_REQUEST", "body は必須です。")
    );

    const req = new NextRequest(makeRequest("POST", { body: "" }));
    const res = await postComment(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("body が 2000 文字超の場合 400 を返す", async () => {
    container.commentUsecase.createComment.mockRejectedValue(
      new AppError(
        "BAD_REQUEST",
        "body は2000文字以内で指定してください。"
      )
    );

    const req = new NextRequest(
      makeRequest("POST", { body: "あ".repeat(2001) })
    );
    const res = await postComment(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("createComment が失敗した場合 500 を返す", async () => {
    container.commentUsecase.createComment.mockRejectedValue(
      new AppError("INTERNAL", "サーバーエラーが発生しました。")
    );

    const req = new NextRequest(
      makeRequest("POST", { body: "コメント" })
    );
    const res = await postComment(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(500);
  });
});
