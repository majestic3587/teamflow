import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "@/app/api/me/route";
import { AppError } from "@/application/errors";
import {
  createMockContainer,
  makeRequest,
  mockProfile,
  parseResponse,
  OWNER_ID,
} from "../helpers/mock-supabase";

vi.mock("@/infrastructure/supabase/container");

import { createContainer } from "@/infrastructure/supabase/container";
const mockedCreateContainer = vi.mocked(createContainer);

// ─── GET /api/me ───────────────────────────────────────────────

describe("GET /api/me", () => {
  let container: ReturnType<typeof createMockContainer>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createMockContainer();
    mockedCreateContainer.mockResolvedValue(container as never);
  });

  it("未認証の場合 401 を返す", async () => {
    container.profileUsecase.getMyProfile.mockRejectedValue(
      new AppError("UNAUTHORIZED", "認証が必要です。")
    );

    const res = await GET();
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("プロフィールを 200 で返す", async () => {
    const profile = mockProfile(OWNER_ID);
    container.profileUsecase.getMyProfile.mockResolvedValue(profile);

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.id).toBe(OWNER_ID);
    expect(body.data.display_name).toBe(profile.display_name);
  });
});

// ─── PATCH /api/me ─────────────────────────────────────────────

describe("PATCH /api/me", () => {
  let container: ReturnType<typeof createMockContainer>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createMockContainer();
    mockedCreateContainer.mockResolvedValue(container as never);
  });

  it("未認証の場合 401 を返す", async () => {
    container.profileUsecase.updateMyProfile.mockRejectedValue(
      new AppError("UNAUTHORIZED", "認証が必要です。")
    );

    const req = new NextRequest(
      makeRequest("PATCH", { display_name: "新しい名前" })
    );
    const res = await PATCH(req);
    expect((await parseResponse(res)).status).toBe(401);
  });

  it("正常な display_name で 200 を返す", async () => {
    const updated = mockProfile(OWNER_ID);
    updated.display_name = "新しい名前";
    container.profileUsecase.updateMyProfile.mockResolvedValue(updated);

    const req = new NextRequest(
      makeRequest("PATCH", { display_name: "新しい名前" })
    );
    const res = await PATCH(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.display_name).toBe("新しい名前");
  });

  it("display_name が空文字の場合 400 を返す", async () => {
    container.profileUsecase.updateMyProfile.mockRejectedValue(
      new AppError(
        "BAD_REQUEST",
        "display_name は1文字以上の文字列で指定してください。"
      )
    );

    const req = new NextRequest(makeRequest("PATCH", { display_name: "  " }));
    const res = await PATCH(req);
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("display_name が 50 文字超の場合 400 を返す", async () => {
    container.profileUsecase.updateMyProfile.mockRejectedValue(
      new AppError(
        "BAD_REQUEST",
        "display_name は50文字以内で指定してください。"
      )
    );

    const req = new NextRequest(
      makeRequest("PATCH", { display_name: "あ".repeat(51) })
    );
    const res = await PATCH(req);
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("更新フィールドが空の場合 400 を返す", async () => {
    container.profileUsecase.updateMyProfile.mockRejectedValue(
      new AppError("BAD_REQUEST", "更新するフィールドを指定してください。")
    );

    const req = new NextRequest(makeRequest("PATCH", {}));
    const res = await PATCH(req);
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("不正な JSON の場合 400 を返す", async () => {
    container.profileUsecase.updateMyProfile.mockRejectedValue(
      new AppError("BAD_REQUEST", "更新するフィールドを指定してください。")
    );

    const req = new NextRequest(
      new Request("http://localhost/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      })
    );
    const res = await PATCH(req);
    expect((await parseResponse(res)).status).toBe(400);
  });

  it("フォールバックで返す場合も 200 を返す", async () => {
    const fallback = mockProfile(OWNER_ID);
    fallback.display_name = "フォールバック名";
    container.profileUsecase.updateMyProfile.mockResolvedValue(fallback);

    const req = new NextRequest(
      makeRequest("PATCH", { display_name: "フォールバック名" })
    );
    const res = await PATCH(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.display_name).toBe("フォールバック名");
  });
});
