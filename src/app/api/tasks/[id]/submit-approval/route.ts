import { NextRequest } from "next/server";
import { createContainer } from "@/infrastructure/supabase/container";
import { ok, handleError } from "@/lib/api-handler";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { taskUsecase } = await createContainer();
    const { id } = await params;
    const result = await taskUsecase.submitApproval(id);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
