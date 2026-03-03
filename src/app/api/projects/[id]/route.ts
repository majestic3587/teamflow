import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  getProjectById,
  updateProject,
  deleteProject,
} from "@/lib/db/projects";
import {
  ok,
  unauthorized,
  notFound,
  forbidden,
  badRequest,
  serverError,
} from "@/lib/api-response";
import { UpdateProjectInput } from "@/types/project";

type Params = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────
// GET /api/projects/[id]
// プロジェクト詳細（所属必須・RLS）
// ─────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const project = await getProjectById(supabase, id);
  if (!project) return notFound();

  return ok(project);
}

// ─────────────────────────────────────────
// PATCH /api/projects/[id]
// プロジェクト更新（Manager 以上・RLS）
// ─────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const existing = await getProjectById(supabase, id);
  if (!existing) return notFound();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("リクエストボディが不正です。");
  }

  const input = body as Record<string, unknown>;
  const patch: UpdateProjectInput = {};

  if ("name" in input) {
    const name = input.name;
    if (typeof name !== "string" || name.trim().length === 0) {
      return badRequest("name は1文字以上の文字列で入力してください。");
    }
    if (name.trim().length > 100) {
      return badRequest("name は100文字以内で入力してください。");
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

  const updated = await updateProject(supabase, id, patch);
  if (!updated) return forbidden();

  return ok(updated);
}

// ─────────────────────────────────────────
// DELETE /api/projects/[id]
// プロジェクト削除（Manager 以上・RLS）
// ─────────────────────────────────────────
export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const existing = await getProjectById(supabase, id);
  if (!existing) return notFound();

  const success = await deleteProject(supabase, id);
  if (!success) return serverError();

  return ok({ id });
}
