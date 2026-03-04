import { SupabaseClient, User } from "@supabase/supabase-js";
import type { IProfileRepository } from "@/application/ports";
import type { Profile, UpdateProfileInput } from "@/types/profile";

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

export class ProfileRepository implements IProfileRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("id, display_name, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (error || !data) return null;
    return data as Profile;
  }

  async update(userId: string, input: UpdateProfileInput): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .update(input)
      .eq("id", userId)
      .select("id, display_name, created_at, updated_at")
      .single();

    if (error || !data) return null;

    if (input.display_name) {
      await this.supabase.auth.updateUser({
        data: { display_name: input.display_name },
      });
    }

    return data as Profile;
  }
}
