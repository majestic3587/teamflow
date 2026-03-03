import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getWorkspacesByUserId, createWorkspace } from "@/lib/db/workspaces";
import {
  ok,
  created,
  unauthorized,
  badRequest,
  serverError,
} from "@/lib/api-response";
import { CreateWorkspaceInput } from "@/types/workspace";

// ─────────────────────────────────────────
// GET /api/workspaces
// 自分が所属するワークスペース一覧を取得
// ─────────────────────────────────────────
export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const workspaces = await getWorkspacesByUserId(supabase, user.id);
  return ok(workspaces);
}

// ─────────────────────────────────────────
// POST /api/workspaces
// ワークスペースを新規作成
// ─────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("リクエストボディが不正です。");
  }

  const input = body as Record<string, unknown>;

  const name = input.name;
  if (typeof name !== "string" || name.trim().length === 0) {
    return badRequest("name は必須です。");
  }
  if (name.trim().length > 50) {
    return badRequest("name は50文字以内で入力してください。");
  }

  const description = input.description;
  if (description !== undefined && typeof description !== "string") {
    return badRequest("description は文字列で入力してください。");
  }

  const payload: CreateWorkspaceInput = {
    name: name.trim(),
    description: typeof description === "string" ? description.trim() : undefined,
  };

  const workspace = await createWorkspace(supabase, user.id, payload);
  if (!workspace) return serverError();

  return created(workspace);
}
