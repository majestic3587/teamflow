import type { IAuthPort, IProfileRepository } from "@/application/ports";
import { unauthorized, badRequest, internal } from "@/application/errors";
import type { Profile } from "@/types/profile";

export class ProfileUsecase {
  constructor(
    private auth: IAuthPort,
    private profileRepo: IProfileRepository
  ) {}

  async getMyProfile(): Promise<Profile> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    const profile = await this.profileRepo.findById(user.id);
    if (profile) return profile;

    return {
      id: user.id,
      display_name:
        (user.user_metadata?.display_name as string) ??
        user.email?.split("@")[0] ??
        "",
      created_at: user.created_at,
      updated_at: user.updated_at ?? user.created_at,
    };
  }

  async updateMyProfile(input: { display_name?: unknown }): Promise<Profile> {
    const user = await this.auth.getUser();
    if (!user) throw unauthorized();

    if (input.display_name !== undefined) {
      if (
        typeof input.display_name !== "string" ||
        input.display_name.trim().length === 0
      ) {
        throw badRequest(
          "display_name は1文字以上の文字列で指定してください。"
        );
      }
      if (input.display_name.trim().length > 50) {
        throw badRequest("display_name は50文字以内で指定してください。");
      }
    }

    const patch: { display_name?: string } = {};
    if (typeof input.display_name === "string") {
      patch.display_name = input.display_name.trim();
    }
    if (Object.keys(patch).length === 0) {
      throw badRequest("更新するフィールドを指定してください。");
    }

    const updated = await this.profileRepo.update(user.id, patch);
    if (updated) return updated;

    const updatedUser = await this.auth.updateUserMetadata({
      display_name: patch.display_name,
    });
    if (!updatedUser) throw internal();

    return {
      id: updatedUser.id,
      display_name:
        (updatedUser.user_metadata?.display_name as string) ?? "",
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at ?? updatedUser.created_at,
    };
  }
}
