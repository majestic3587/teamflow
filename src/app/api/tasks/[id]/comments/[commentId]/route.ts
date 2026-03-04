import { NextRequest } from "next/server";
import { createContainer } from "@/infrastructure/supabase/container";
import { ok, handleError } from "@/lib/api-handler";

type Params = { params: Promise<{ id: string; commentId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { commentUsecase } = await createContainer();
    const { commentId } = await params;
    let body: unknown;
    try { body = await request.json(); } catch { body = {}; }
    const comment = await commentUsecase.updateComment(commentId, body as Record<string, unknown>);
    return ok(comment);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { commentUsecase } = await createContainer();
    const { commentId } = await params;
    const result = await commentUsecase.deleteComment(commentId);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
