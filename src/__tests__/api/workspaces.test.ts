import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/workspaces/route";
import { AppError } from "@/application/errors";
import {
  createMockContainer,
  makeRequest,
  mockWorkspace,
  parseResponse,
} from "../helpers/mock-supabase";

vi.mock("@/infrastructure/supabase/container");

import { createContainer } from "@/infrastructure/supabase/container";
const mockedCreateContainer = vi.mocked(createContainer);

// ─── GET /api/workspaces ────────────────────────────────────────

describe("GET /api/workspaces", () => {
  let container: ReturnType<typeof createMockContainer>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createMockContainer();
    mockedCreateContainer.mockResolvedValue(container as never);
  });

  it("未認証の場合 401 を返す", async () => {
    container.workspaceUsecase.getWorkspaces.mockRejectedValue(
      new AppError("UNAUTHORIZED", "認証が必要です。")
    );

    const res = await GET();
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("ワークスペース一覧を 200 で返す", async () => {
    container.workspaceUsecase.getWorkspaces.mockResolvedValue([mockWorkspace]);

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("テストワークスペース");
  });

  it("ワークスペースが 0 件でも 200 を返す", async () => {
    container.workspaceUsecase.getWorkspaces.mockResolvedValue([]);

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data).toHaveLength(0);
  });
});

// ─── POST /api/workspaces ───────────────────────────────────────

describe("POST /api/workspaces", () => {
  let container: ReturnType<typeof createMockContainer>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createMockContainer();
    mockedCreateContainer.mockResolvedValue(container as never);
  });

  it("未認証の場合 401 を返す", async () => {
    container.workspaceUsecase.createWorkspace.mockRejectedValue(
      new AppError("UNAUTHORIZED", "認証が必要です。")
    );

    const req = new NextRequest(makeRequest("POST", { name: "新WS" }));
    const res = await POST(req);
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("正常なリクエストで 201 を返す", async () => {
    container.workspaceUsecase.createWorkspace.mockResolvedValue(mockWorkspace);

    const req = new NextRequest(
      makeRequest("POST", { name: "新WS", description: "説明" })
    );
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(201);
    expect(body.data.name).toBe("テストワークスペース");
  });

  it("name が空の場合 400 を返す", async () => {
    container.workspaceUsecase.createWorkspace.mockRejectedValue(
      new AppError("BAD_REQUEST", "name は必須です。")
    );

    const req = new NextRequest(makeRequest("POST", { name: "" }));
    const res = await POST(req);
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("name が 50 文字超の場合 400 を返す", async () => {
    container.workspaceUsecase.createWorkspace.mockRejectedValue(
      new AppError("BAD_REQUEST", "name は50文字以内で指定してください。")
    );

    const req = new NextRequest(
      makeRequest("POST", { name: "あ".repeat(51) })
    );
    const res = await POST(req);
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("description が数値の場合 400 を返す", async () => {
    container.workspaceUsecase.createWorkspace.mockRejectedValue(
      new AppError("BAD_REQUEST", "description は文字列で指定してください。")
    );

    const req = new NextRequest(
      makeRequest("POST", { name: "WS", description: 123 })
    );
    const res = await POST(req);
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("createWorkspace が失敗した場合 500 を返す", async () => {
    container.workspaceUsecase.createWorkspace.mockRejectedValue(
      new AppError("INTERNAL", "サーバーエラーが発生しました。")
    );

    const req = new NextRequest(makeRequest("POST", { name: "失敗WS" }));
    const res = await POST(req);
    expect((await parseResponse(res)).status).toBe(500);
  });
});
