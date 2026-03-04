import { NextRequest } from "next/server";
import { createContainer } from "@/infrastructure/supabase/container";
import { ok, handleError } from "@/lib/api-handler";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { taskUsecase } = await createContainer();
    const { id } = await params;
    let body: unknown;
    try { body = await request.json(); } catch { body = {}; }
    const result = await taskUsecase.updateWorkStatus(id, body as Record<string, unknown>);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
