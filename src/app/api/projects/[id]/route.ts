import { NextRequest } from "next/server";
import { createContainer } from "@/infrastructure/supabase/container";
import { ok, handleError } from "@/lib/api-handler";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { projectUsecase } = await createContainer();
    const result = await projectUsecase.getProject(id);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { projectUsecase } = await createContainer();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const result = await projectUsecase.updateProject(
      id,
      body as Record<string, unknown>,
    );
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { projectUsecase } = await createContainer();
    const result = await projectUsecase.deleteProject(id);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
