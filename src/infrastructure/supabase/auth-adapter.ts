import { SupabaseClient } from "@supabase/supabase-js";
import type { IAuthPort, AuthUser } from "@/application/ports";

export class SupabaseAuthAdapter implements IAuthPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async getUser(): Promise<AuthUser | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    if (!user) return null;

    return {
      id: user.id,
      email: user.email ?? "",
      user_metadata: user.user_metadata ?? {},
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  async updateUserMetadata(data: Record<string, unknown>): Promise<AuthUser | null> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.updateUser({ data });

    if (error || !user) return null;

    return {
      id: user.id,
      email: user.email ?? "",
      user_metadata: user.user_metadata ?? {},
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}
