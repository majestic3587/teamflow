import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getWorkspaceById, getWorkspaceMembers } from "@/lib/db/workspaces";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MemberCard } from "@/components/workspace/MemberCard";

export const metadata = {
  title: "メンバー一覧 | TeamFlow",
};

type Props = { params: Promise<{ id: string }> };

export default async function WorkspaceMembersPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [workspace, members] = await Promise.all([
    getWorkspaceById(supabase, id, user.id),
    getWorkspaceMembers(supabase, id),
  ]);

  if (!workspace) notFound();

  const roleCount = {
    owner: members.filter((m) => m.role === "owner").length,
    manager: members.filter((m) => m.role === "manager").length,
    member: members.filter((m) => m.role === "member").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        {/* パンくず */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link
            href="/dashboard"
            className="hover:text-gray-600 transition-colors"
          >
            ダッシュボード
          </Link>
          <ChevronIcon />
          <Link
            href="/dashboard/workspaces"
            className="hover:text-gray-600 transition-colors"
          >
            ワークスペース
          </Link>
          <ChevronIcon />
          <span className="text-gray-600 truncate max-w-[160px]">
            {workspace.name}
          </span>
          <ChevronIcon />
          <span className="text-gray-600">メンバー</span>
        </nav>

        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">メンバー一覧</h1>
            <p className="text-sm text-gray-500 mt-1">
              {members.length} 人のメンバー
              <span className="ml-2 text-xs text-gray-400">
                ( Owner {roleCount.owner} / Manager {roleCount.manager} / Member{" "}
                {roleCount.member} )
              </span>
            </p>
          </div>
        </div>

        {/* メンバー一覧 */}
        {members.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            メンバーが見つかりません
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isCurrentUser={member.user_id === user.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="w-4 h-4 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
