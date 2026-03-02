import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getProfileById, updateProfile, profileFromUser } from "@/lib/db/profiles";
import {
  ok,
  unauthorized,
  badRequest,
  serverError,
} from "@/lib/api-response";
import { UpdateProfileInput } from "@/types/profile";

// ─────────────────────────────────────────
// GET /api/me
// 自分のプロフィールを取得する（ログイン必須）
//
// 取得優先順位:
//   1. public.profiles テーブル
//   2. auth.users.raw_user_meta_data（フォールバック）
// ─────────────────────────────────────────
export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  // profiles テーブルから取得を試みる
  const profile = await getProfileById(supabase, user.id);

  // テーブルが未作成 or 行が存在しない場合は auth.users から生成して返す
  return ok(profile ?? profileFromUser(user));
}

// ─────────────────────────────────────────
// PATCH /api/me
// 自分のプロフィールを更新する（ログイン必須）
// 更新可能フィールド: display_name
//
// profiles テーブルと auth.users.raw_user_meta_data を同期する
// ─────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("リクエストボディが不正です。");
  }

  const input = body as Record<string, unknown>;

  // 更新可能フィールドのみ抽出・バリデーション
  const patch: UpdateProfileInput = {};

  if ("display_name" in input) {
    const name = input.display_name;
    if (typeof name !== "string" || name.trim().length === 0) {
      return badRequest("display_name は1文字以上の文字列で指定してください。");
    }
    if (name.trim().length > 50) {
      return badRequest("display_name は50文字以内で指定してください。");
    }
    patch.display_name = name.trim();
  }

  if (Object.keys(patch).length === 0) {
    return badRequest("更新するフィールドを指定してください。");
  }

  // profiles テーブルへの更新を試みる
  const updated = await updateProfile(supabase, user.id, patch);

  if (!updated) {
    // profiles テーブルが未作成の場合は auth.users のみ更新して返す
    const { data: { user: updatedUser }, error } = await supabase.auth.updateUser({
      data: { display_name: patch.display_name },
    });
    if (error || !updatedUser) return serverError();
    return ok(profileFromUser(updatedUser));
  }

  return ok(updated);
}
