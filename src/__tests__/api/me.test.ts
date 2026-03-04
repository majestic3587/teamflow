import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "@/app/api/me/route";
import {
  createMockSupabase,
  makeRequest,
  mockProfile,
  mockUser,
  parseResponse,
  OWNER_ID,
} from "../helpers/mock-supabase";

vi.mock("@/utils/supabase/server");
vi.mock("@/lib/db/profiles");

import { createClient } from "@/utils/supabase/server";
import { getProfileById, updateProfile, profileFromUser } from "@/lib/db/profiles";

const mockedCreateClient = vi.mocked(createClient);
const mockedGetProfileById = vi.mocked(getProfileById);
const mockedUpdateProfile = vi.mocked(updateProfile);
const mockedProfileFromUser = vi.mocked(profileFromUser);

// ─── GET /api/me ───────────────────────────────────────────────

describe("GET /api/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未認証の場合 401 を返す", async () => {
    mockedCreateClient.mockResolvedValue(
      createMockSupabase(null) as never
    );

    const res = await GET();
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });

  it("profiles テーブルから取得できた場合 200 とプロフィールを返す", async () => {
    mockedCreateClient.mockResolvedValue(
      createMockSupabase(OWNER_ID) as never
    );
    const profile = mockProfile(OWNER_ID);
    mockedGetProfileById.mockResolvedValue(profile);

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.id).toBe(OWNER_ID);
    expect(body.data.display_name).toBe(profile.display_name);
  });

  it("profiles が null の場合は auth.users からフォールバックして返す", async () => {
    mockedCreateClient.mockResolvedValue(
      createMockSupabase(OWNER_ID) as never
    );
    mockedGetProfileById.mockResolvedValue(null);
    const fallback = mockProfile(OWNER_ID);
    mockedProfileFromUser.mockReturnValue(fallback);

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.id).toBe(OWNER_ID);
    expect(mockedProfileFromUser).toHaveBeenCalledWith(mockUser(OWNER_ID));
  });
});

// ─── PATCH /api/me ─────────────────────────────────────────────

describe("PATCH /api/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未認証の場合 401 を返す", async () => {
    mockedCreateClient.mockResolvedValue(
      createMockSupabase(null) as never
    );
    const req = new NextRequest(makeRequest("PATCH", { display_name: "新しい名前" }));

    const res = await PATCH(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });

  it("正常な display_name で 200 を返す", async () => {
    mockedCreateClient.mockResolvedValue(
      createMockSupabase(OWNER_ID) as never
    );
    const updated = mockProfile(OWNER_ID);
    updated.display_name = "新しい名前";
    mockedUpdateProfile.mockResolvedValue(updated);

    const req = new NextRequest(makeRequest("PATCH", { display_name: "新しい名前" }));
    const res = await PATCH(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.display_name).toBe("新しい名前");
  });

  it("display_name が空文字の場合 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(
      createMockSupabase(OWNER_ID) as never
    );
    const req = new NextRequest(makeRequest("PATCH", { display_name: "  " }));

    const res = await PATCH(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("display_name が 50 文字超の場合 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(
      createMockSupabase(OWNER_ID) as never
    );
    const req = new NextRequest(
      makeRequest("PATCH", { display_name: "あ".repeat(51) })
    );

    const res = await PATCH(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("更新フィールドが空の場合 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(
      createMockSupabase(OWNER_ID) as never
    );
    const req = new NextRequest(makeRequest("PATCH", {}));

    const res = await PATCH(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("不正な JSON の場合 400 を返す", async () => {
    mockedCreateClient.mockResolvedValue(
      createMockSupabase(OWNER_ID) as never
    );
    const req = new NextRequest(
      new Request("http://localhost/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      })
    );

    const res = await PATCH(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("updateProfile が null の場合 auth.users にフォールバックして 200 を返す", async () => {
    const mockSupabase = createMockSupabase(OWNER_ID);
    mockedCreateClient.mockResolvedValue(mockSupabase as never);
    mockedUpdateProfile.mockResolvedValue(null);
    const fallback = mockProfile(OWNER_ID);
    fallback.display_name = "フォールバック名";
    mockedProfileFromUser.mockReturnValue(fallback);

    const req = new NextRequest(makeRequest("PATCH", { display_name: "フォールバック名" }));
    const res = await PATCH(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.display_name).toBe("フォールバック名");
  });
});
