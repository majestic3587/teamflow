import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as submitApproval } from "@/app/api/tasks/[id]/submit-approval/route";
import { POST as approve } from "@/app/api/tasks/[id]/approve/route";
import { POST as reject } from "@/app/api/tasks/[id]/reject/route";
import {
  createMockSupabase,
  makeRequest,
  makeParams,
  mockTask,
  mockWorkspaceMembers,
  parseResponse,
  OWNER_ID,
  MEMBER_ID,
  OTHER_ID,
} from "../../helpers/mock-supabase";

vi.mock("@/utils/supabase/server");
vi.mock("@/lib/db/tasks");
vi.mock("@/lib/db/workspaces");

import { createClient } from "@/utils/supabase/server";
import { getTaskById, updateTask } from "@/lib/db/tasks";
import { getWorkspaceMembers } from "@/lib/db/workspaces";

const mockedCreateClient = vi.mocked(createClient);
const mockedGetTaskById = vi.mocked(getTaskById);
const mockedUpdateTask = vi.mocked(updateTask);
const mockedGetWorkspaceMembers = vi.mocked(getWorkspaceMembers);

// ─── POST /api/tasks/[id]/submit-approval ──────────────────────

describe("POST /api/tasks/[id]/submit-approval", () => {
  beforeEach(() => vi.clearAllMocks());

  it("未認証の場合 401 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(null) as never);
    const req = new NextRequest(makeRequest("POST"));

    const res = await submitApproval(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("タスクが存在しない場合 404 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(null);

    const req = new NextRequest(makeRequest("POST"));
    const res = await submitApproval(req, makeParams("nonexistent"));
    expect((await parseResponse(res)).status).toBe(404);
  });

  it("DRAFT 以外のタスクに申請すると 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask({ approval_status: "PENDING" }));

    const req = new NextRequest(makeRequest("POST"));
    const res = await submitApproval(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("作成者が承認申請すると 200 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask({ created_by: OWNER_ID }));
    mockedUpdateTask.mockResolvedValue(mockTask({ approval_status: "PENDING" }));

    const req = new NextRequest(makeRequest("POST"));
    const res = await submitApproval(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.approval_status).toBe("PENDING");
  });

  it("担当者が承認申請すると 200 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(MEMBER_ID) as never);
    mockedGetTaskById.mockResolvedValue(
      mockTask({ created_by: OWNER_ID, assignee_id: MEMBER_ID })
    );
    mockedUpdateTask.mockResolvedValue(mockTask({ approval_status: "PENDING" }));

    const req = new NextRequest(makeRequest("POST"));
    const res = await submitApproval(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(200);
  });

  it("無関係なユーザーが申請すると 403 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OTHER_ID) as never);
    mockedGetTaskById.mockResolvedValue(
      mockTask({ created_by: OWNER_ID, assignee_id: MEMBER_ID })
    );
    mockedGetWorkspaceMembers.mockResolvedValue(
      mockWorkspaceMembers(OTHER_ID, "member") as never
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await submitApproval(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(403);
  });
});

// ─── POST /api/tasks/[id]/approve ──────────────────────────────

describe("POST /api/tasks/[id]/approve", () => {
  beforeEach(() => vi.clearAllMocks());

  it("未認証の場合 401 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(null) as never);
    const req = new NextRequest(makeRequest("POST"));

    const res = await approve(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("PENDING 以外のタスクを承認しようとすると 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask({ approval_status: "DRAFT" }));

    const req = new NextRequest(makeRequest("POST"));
    const res = await approve(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("owner が PENDING タスクを承認すると 200 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask({ approval_status: "PENDING" }));
    mockedGetWorkspaceMembers.mockResolvedValue(
      mockWorkspaceMembers(OWNER_ID, "owner") as never
    );
    mockedUpdateTask.mockResolvedValue(mockTask({ approval_status: "APPROVED" }));

    const req = new NextRequest(makeRequest("POST"));
    const res = await approve(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.approval_status).toBe("APPROVED");
  });

  it("manager が PENDING タスクを承認すると 200 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(MEMBER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask({ approval_status: "PENDING" }));
    mockedGetWorkspaceMembers.mockResolvedValue(
      mockWorkspaceMembers(MEMBER_ID, "manager") as never
    );
    mockedUpdateTask.mockResolvedValue(mockTask({ approval_status: "APPROVED" }));

    const req = new NextRequest(makeRequest("POST"));
    const res = await approve(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(200);
  });

  it("member ロールのユーザーが承認しようとすると 403 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OTHER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask({ approval_status: "PENDING" }));
    mockedGetWorkspaceMembers.mockResolvedValue(
      mockWorkspaceMembers(OTHER_ID, "member") as never
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await approve(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(403);
  });
});

// ─── POST /api/tasks/[id]/reject ───────────────────────────────

describe("POST /api/tasks/[id]/reject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("未認証の場合 401 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(null) as never);
    const req = new NextRequest(makeRequest("POST"));

    const res = await reject(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("PENDING 以外のタスクを差し戻そうとすると 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask({ approval_status: "APPROVED" }));

    const req = new NextRequest(makeRequest("POST"));
    const res = await reject(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("owner が PENDING タスクを差し戻すと 200 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OWNER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask({ approval_status: "PENDING" }));
    mockedGetWorkspaceMembers.mockResolvedValue(
      mockWorkspaceMembers(OWNER_ID, "owner") as never
    );
    mockedUpdateTask.mockResolvedValue(mockTask({ approval_status: "REJECTED" }));

    const req = new NextRequest(makeRequest("POST"));
    const res = await reject(req, makeParams("task-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.approval_status).toBe("REJECTED");
  });

  it("member ロールのユーザーが差し戻そうとすると 403 を返す", async () => {
    mockedCreateClient.mockResolvedValue(createMockSupabase(OTHER_ID) as never);
    mockedGetTaskById.mockResolvedValue(mockTask({ approval_status: "PENDING" }));
    mockedGetWorkspaceMembers.mockResolvedValue(
      mockWorkspaceMembers(OTHER_ID, "member") as never
    );

    const req = new NextRequest(makeRequest("POST"));
    const res = await reject(req, makeParams("task-1"));
    expect((await parseResponse(res)).status).toBe(403);
  });
});
