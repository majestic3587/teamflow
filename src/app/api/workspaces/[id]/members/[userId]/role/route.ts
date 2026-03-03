import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { updateMemberRole } from "@/lib/db/workspaces";
import { ok, unauthorized, badRequest, forbidden } from "@/lib/api-response";

const VALID_ROLES = ["owner", "manager", "member"] as const;

type Params = { params: Promise<{ id: string; userId: string }> };

// ─────────────────────────────────────────
// PATCH /api/workspaces/[id]/members/[userId]/role
// メンバーのロールを変更（owner / manager のみ）
// ─────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id: workspaceId, userId: targetUserId } = await params;

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
  const role = input.role;

  if (typeof role !== "string" || !VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
    return badRequest("role は owner, manager, member のいずれかを指定してください。");
  }

  const result = await updateMemberRole(
    supabase,
    workspaceId,
    targetUserId,
    role as typeof VALID_ROLES[number]
  );

  if (!result.success) {
    return forbidden();
  }

  return ok({ workspace_id: workspaceId, user_id: targetUserId, role });
}
