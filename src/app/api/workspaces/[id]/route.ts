import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
} from "@/lib/db/workspaces";
import {
  ok,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  serverError,
} from "@/lib/api-response";
import { UpdateWorkspaceInput } from "@/types/workspace";

type Params = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────
// GET /api/workspaces/[id]
// ワークスペース詳細を取得（メンバーのみ）
// ─────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const workspace = await getWorkspaceById(supabase, id, user.id);
  if (!workspace) return notFound();

  return ok(workspace);
}

// ─────────────────────────────────────────
// PATCH /api/workspaces/[id]
// ワークスペースを更新（owner のみ）
// ─────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  // メンバーかどうか確認
  const workspace = await getWorkspaceById(supabase, id, user.id);
  if (!workspace) return notFound();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("リクエストボディが不正です。");
  }

  const input = body as Record<string, unknown>;
  const patch: UpdateWorkspaceInput = {};

  if ("name" in input) {
    const name = input.name;
    if (typeof name !== "string" || name.trim().length === 0) {
      return badRequest("name は1文字以上の文字列で入力してください。");
    }
    if (name.trim().length > 50) {
      return badRequest("name は50文字以内で入力してください。");
    }
    patch.name = name.trim();
  }

  if ("description" in input) {
    const desc = input.description;
    if (desc !== null && typeof desc !== "string") {
      return badRequest("description は文字列または null で入力してください。");
    }
    patch.description = typeof desc === "string" ? desc.trim() : undefined;
  }

  if (Object.keys(patch).length === 0) {
    return badRequest("更新するフィールドを指定してください。");
  }

  const updated = await updateWorkspace(supabase, id, patch);
  if (!updated) return forbidden();

  return ok(updated);
}

// ─────────────────────────────────────────
// DELETE /api/workspaces/[id]
// ワークスペースを削除（owner のみ）
// ─────────────────────────────────────────
export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const workspace = await getWorkspaceById(supabase, id, user.id);
  if (!workspace) return notFound();

  const success = await deleteWorkspace(supabase, id);
  if (!success) return serverError();

  return ok({ id });
}
