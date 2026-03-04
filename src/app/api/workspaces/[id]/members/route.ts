import { NextRequest } from "next/server";
import { createContainer } from "@/infrastructure/supabase/container";
import { ok, handleError } from "@/lib/api-handler";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { workspaceUsecase } = await createContainer();
    const result = await workspaceUsecase.getMembers(id);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
