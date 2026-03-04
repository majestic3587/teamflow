import { NextRequest } from "next/server";
import { createContainer } from "@/infrastructure/supabase/container";
import { ok, created, handleError } from "@/lib/api-handler";

export async function GET() {
  try {
    const { workspaceUsecase } = await createContainer();
    const result = await workspaceUsecase.getWorkspaces();
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspaceUsecase } = await createContainer();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const result = await workspaceUsecase.createWorkspace(
      body as Record<string, unknown>,
    );
    return created(result);
  } catch (e) {
    return handleError(e);
  }
}
