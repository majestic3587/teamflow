import { NextRequest } from "next/server";
import { createContainer } from "@/infrastructure/supabase/container";
import { ok, handleError } from "@/lib/api-handler";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { workspaceUsecase } = await createContainer();
    const result = await workspaceUsecase.getWorkspace(id);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { workspaceUsecase } = await createContainer();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const result = await workspaceUsecase.updateWorkspace(
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
    const { workspaceUsecase } = await createContainer();
    const result = await workspaceUsecase.deleteWorkspace(id);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
