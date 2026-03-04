import { NextRequest } from "next/server";
import { createContainer } from "@/infrastructure/supabase/container";
import { ok, created, handleError } from "@/lib/api-handler";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { taskUsecase } = await createContainer();
    const result = await taskUsecase.getTasksByProject(id);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { taskUsecase } = await createContainer();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const result = await taskUsecase.createTask(
      id,
      body as Record<string, unknown>,
    );
    return created(result);
  } catch (e) {
    return handleError(e);
  }
}
