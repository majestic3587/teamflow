import { SupabaseClient, User } from "@supabase/supabase-js";
import { Profile, UpdateProfileInput } from "@/types/profile";

/**
 * auth.users の User オブジェクトから Profile 形式に変換する。
 * profiles テーブルが未作成の場合のフォールバックとしても使用する。
 */
export function profileFromUser(user: User): Profile {
  return {
    id: user.id,
    display_name:
      user.user_metadata?.display_name ??
      user.email?.split("@")[0] ??
      "",
    created_at: user.created_at,
    updated_at: user.updated_at ?? user.created_at,
  };
}

/**
 * profiles テーブルからプロフィールを取得する。
 * テーブルが存在しない・行が見つからない場合は null を返す。
 */
export async function getProfileById(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

/**
 * profiles テーブルを更新する。
 * 同時に auth.users.raw_user_meta_data も同期させる。
 */
export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  input: UpdateProfileInput
): Promise<Profile | null> {
  // profiles テーブルを更新
  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", userId)
    .select("id, display_name, created_at, updated_at")
    .single();

  if (error || !data) return null;

  // auth.users.raw_user_meta_data にも同期（display_name）
  if (input.display_name) {
    await supabase.auth.updateUser({
      data: { display_name: input.display_name },
    });
  }

  return data as Profile;
}
