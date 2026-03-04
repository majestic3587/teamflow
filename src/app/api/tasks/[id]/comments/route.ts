import { NextRequest } from "next/server";
import { createContainer } from "@/infrastructure/supabase/container";
import { ok, created, handleError } from "@/lib/api-handler";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { commentUsecase } = await createContainer();
    const { id } = await params;
    const comments = await commentUsecase.getComments(id);
    return ok(comments);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { commentUsecase } = await createContainer();
    const { id } = await params;
    let body: unknown;
    try { body = await request.json(); } catch { body = {}; }
    const comment = await commentUsecase.createComment(id, body as Record<string, unknown>);
    return created(comment);
  } catch (e) {
    return handleError(e);
  }
}
