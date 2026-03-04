import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as submitApproval } from "@/app/api/tasks/[id]/submit-approval/route";
import { POST as approve } from "@/app/api/tasks/[id]/approve/route";
import { POST as reject } from "@/app/api/tasks/[id]/reject/route";
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

// ─── POST /api/tasks/[id]/submit-approval ──────────────────────

describe("POST /api/tasks/[id]/submit-approval", () => {
  let container: ReturnType<typeof createMockContainer>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createMockContainer();
    mockedCreateContainer.mockResolvedValue(container as never);
  });

  it("未認証の場合 401 を返す", async () => {
    container.taskUsecase.submitApproval.mockRejectedValue(
      new AppError("UNAUTHORIZED", "認証が必要です。")
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await submitApproval(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("タスクが存在しない場合 404 を返す", async () => {
    container.taskUsecase.submitApproval.mockRejectedValue(
      new AppError("NOT_FOUND", "タスクが見つかりません。")
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await submitApproval(req, makeParams("nonexistent"));
    expect((await parseResponse(res)).status).toBe(404);
  });

  it("DRAFT 以外のタスクに申請すると 400 を返す", async () => {
    container.taskUsecase.submitApproval.mockRejectedValue(
      new AppError(
        "BAD_REQUEST",
        "承認申請は DRAFT 状態のタスクのみ可能です。"
      )
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await submitApproval(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("作成者が承認申請すると 200 を返す", async () => {
    container.taskUsecase.submitApproval.mockResolvedValue(
      mockTask({ approval_status: "PENDING" })
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await submitApproval(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.approval_status).toBe("PENDING");
  });

  it("担当者が承認申請すると 200 を返す", async () => {
    container.taskUsecase.submitApproval.mockResolvedValue(
      mockTask({ approval_status: "PENDING" })
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await submitApproval(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(200);
  });

  it("無関係なユーザーが申請すると 403 を返す", async () => {
    container.taskUsecase.submitApproval.mockRejectedValue(
      new AppError("FORBIDDEN", "承認申請の権限がありません。")
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await submitApproval(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(403);
  });
});

// ─── POST /api/tasks/[id]/approve ──────────────────────────────

describe("POST /api/tasks/[id]/approve", () => {
  let container: ReturnType<typeof createMockContainer>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createMockContainer();
    mockedCreateContainer.mockResolvedValue(container as never);
  });

  it("未認証の場合 401 を返す", async () => {
    container.taskUsecase.approveTask.mockRejectedValue(
      new AppError("UNAUTHORIZED", "認証が必要です。")
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await approve(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("PENDING 以外のタスクを承認しようとすると 400 を返す", async () => {
    container.taskUsecase.approveTask.mockRejectedValue(
      new AppError(
        "BAD_REQUEST",
        "承認は PENDING 状態のタスクのみ可能です。"
      )
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await approve(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("owner が PENDING タスクを承認すると 200 を返す", async () => {
    container.taskUsecase.approveTask.mockResolvedValue(
      mockTask({ approval_status: "APPROVED" })
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await approve(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.approval_status).toBe("APPROVED");
  });

  it("manager が PENDING タスクを承認すると 200 を返す", async () => {
    container.taskUsecase.approveTask.mockResolvedValue(
      mockTask({ approval_status: "APPROVED" })
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await approve(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(200);
  });

  it("member ロールのユーザーが承認しようとすると 403 を返す", async () => {
    container.taskUsecase.approveTask.mockRejectedValue(
      new AppError("FORBIDDEN", "承認権限がありません。")
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await approve(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(403);
  });
});

// ─── POST /api/tasks/[id]/reject ───────────────────────────────

describe("POST /api/tasks/[id]/reject", () => {
  let container: ReturnType<typeof createMockContainer>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createMockContainer();
    mockedCreateContainer.mockResolvedValue(container as never);
  });

  it("未認証の場合 401 を返す", async () => {
    container.taskUsecase.rejectTask.mockRejectedValue(
      new AppError("UNAUTHORIZED", "認証が必要です。")
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await reject(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("PENDING 以外のタスクを差し戻そうとすると 400 を返す", async () => {
    container.taskUsecase.rejectTask.mockRejectedValue(
      new AppError(
        "BAD_REQUEST",
        "却下は PENDING 状態のタスクのみ可能です。"
      )
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await reject(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("owner が PENDING タスクを差し戻すと 200 を返す", async () => {
    container.taskUsecase.rejectTask.mockResolvedValue(
      mockTask({ approval_status: "REJECTED" })
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await reject(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.approval_status).toBe("REJECTED");
  });

  it("member ロールのユーザーが差し戻そうとすると 403 を返す", async () => {
    container.taskUsecase.rejectTask.mockRejectedValue(
      new AppError("FORBIDDEN", "却下権限がありません。")
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await reject(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(403);
  });
});
