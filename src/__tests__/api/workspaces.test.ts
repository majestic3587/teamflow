import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/workspaces/route";
import {
  createMockSupabase,
  makeRequest,
  parseResponse,
  OWNER_ID,
} from "../helpers/mock-supabase";

vi.mock("@/utils/supabase/server");
vi.mock("@/lib/db/workspaces");

import { createClient } from "@/utils/supabase/server";
import { getWorkspacesByUserId, createWorkspace } from "@/lib/db/workspaces";

const mockedCreateClient = vi.mocked(createClient);
const mockedGetWorkspacesByUserId = vi.mocked(getWorkspacesByUserId);
const mockedCreateWorkspace = vi.mocked(createWorkspace);

const mockWorkspace = {
  id: "ws-1",
  name: "テストワークスペース",
  description: "説明文",
  owner_id: OWNER_ID,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// ─── GET /api/workspaces ────────────────────────────────────────

describe("GET /api/workspaces", () => {
  beforeEach(() => vi.clearAllMocks());

  it("未認証の場合 401 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(null) as never);

    const res = await GET();
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });

  it("ワークスペース一覧を 200 で返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetWorkspacesByUserId.mockResolvedValue([mockWorkspace]);

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("テストワークスペース");
  });

  it("ワークスペースが 0 件でも 200 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetWorkspacesByUserId.mockResolvedValue([]);

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data).toHaveLength(0);
  });
});

// ─── POST /api/workspaces ───────────────────────────────────────

describe("POST /api/workspaces", () => {
  beforeEach(() => vi.clearAllMocks());

  it("未認証の場合 401 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(null) as never);
    const req = new NextRequest(makeRequest("POST", { name: "新WS" }));

    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });

  it("正常なリクエストで 201 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedCreateWorkspace.mockResolvedValue(mockWorkspace);

    const req = new NextRequest(
      makeRequest("POST", { name: "新WS", description: "説明" })
    );
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(201);
    expect(body.data.name).toBe("テストワークスペース");
  });

  it("name が空の場合 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    const req = new NextRequest(makeRequest("POST", { name: "" }));

    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("name が 50 文字超の場合 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    const req = new NextRequest(makeRequest("POST", { name: "あ".repeat(51) }));

    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("description が数値の場合 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    const req = new NextRequest(makeRequest("POST", { name: "WS", description: 123 }));

    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("createWorkspace が null の場合 500 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedCreateWorkspace.mockResolvedValue(null);

    const req = new NextRequest(makeRequest("POST", { name: "失敗WS" }));
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(500);
  });
});
