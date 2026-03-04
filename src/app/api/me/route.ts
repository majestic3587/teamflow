import { NextRequest } from "next/server";
import { createContainer } from "@/infrastructure/supabase/container";
import { ok, handleError } from "@/lib/api-handler";

export async function GET() {
  try {
    const { profileUsecase } = await createContainer();
    const result = await profileUsecase.getMyProfile();
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { profileUsecase } = await createContainer();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const result = await profileUsecase.updateMyProfile(
      body as Record<string, unknown>,
    );
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
