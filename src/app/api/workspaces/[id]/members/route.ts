import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getWorkspaceMembers } from "@/lib/db/workspaces";
import { ok, unauthorized, forbidden } from "@/lib/api-response";

type Params = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────
// GET /api/workspaces/[id]/members
// ワークスペースのメンバー一覧を取得（所属必須）
// ─────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  const members = await getWorkspaceMembers(supabase, id);

  if (members.length === 0) {
    return forbidden();
  }

  return ok(members);
}
