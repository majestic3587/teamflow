import { NextRequest } from "next/server";
import { createContainer } from "@/infrastructure/supabase/container";
import { ok, handleError } from "@/lib/api-handler";

type Params = { params: Promise<{ id: string; userId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id, userId } = await params;
    const { workspaceUsecase } = await createContainer();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const result = await workspaceUsecase.updateMemberRole(
      id,
      userId,
      body as Record<string, unknown>,
    );
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
