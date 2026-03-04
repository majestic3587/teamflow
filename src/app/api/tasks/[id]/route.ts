import { NextRequest } from "next/server";
import { createContainer } from "@/infrastructure/supabase/container";
import { ok, handleError } from "@/lib/api-handler";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { taskUsecase } = await createContainer();
    const { id } = await params;
    const task = await taskUsecase.getTask(id);
    return ok(task);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { taskUsecase } = await createContainer();
    const { id } = await params;
    let body: unknown;
    try { body = await request.json(); } catch { body = {}; }
    const task = await taskUsecase.updateTask(id, body as Record<string, unknown>);
    return ok(task);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { taskUsecase } = await createContainer();
    const { id } = await params;
    const result = await taskUsecase.deleteTask(id);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
