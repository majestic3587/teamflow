import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  getProjectsByWorkspaceId,
  createProject,
} from "@/lib/db/projects";
import {
  ok,
  created,
  unauthorized,
  badRequest,
  serverError,
} from "@/lib/api-response";

type Params = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────
// GET /api/workspaces/[id]/projects
// ワークスペース配下のプロジェクト一覧（所属必須・RLS）
// ─────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id: workspaceId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const projects = await getProjectsByWorkspaceId(supabase, workspaceId);
  return ok(projects);
}

// ─────────────────────────────────────────
// POST /api/workspaces/[id]/projects
// プロジェクト新規作成（所属必須・RLS）
// ─────────────────────────────────────────
export async function POST(request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id: workspaceId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
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
  if (name.trim().length > 100) {
    return badRequest("name は100文字以内で入力してください。");
  }

  const description = input.description;
  if (description !== undefined && typeof description !== "string") {
    return badRequest("description は文字列で入力してください。");
  }

  const project = await createProject(supabase, workspaceId, user.id, {
    name: name.trim(),
    description: typeof description === "string" ? description.trim() : undefined,
  });
  if (!project) return serverError();

  return created(project);
}
