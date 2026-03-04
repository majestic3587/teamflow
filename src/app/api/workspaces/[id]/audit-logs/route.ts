import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getWorkspaceById } from "@/lib/db/workspaces";
import { getAuditLogsByWorkspaceId } from "@/lib/db/audit-logs";
import { ok, unauthorized, notFound, badRequest } from "@/lib/api-response";

type Params = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────
// GET /api/workspaces/[id]/audit-logs
// 監査ログ一覧（所属必須・RLS）
// ─────────────────────────────────────────
export async function GET(request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id: workspaceId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const workspace = await getWorkspaceById(supabase, workspaceId, user.id);
  if (!workspace) return notFound();

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 100;

  if (isNaN(limit) || limit < 1 || limit > 500) {
    return badRequest("limit は 1〜500 の整数で指定してください。");
  }

  const logs = await getAuditLogsByWorkspaceId(supabase, workspaceId, limit);
  return ok(logs);
}
