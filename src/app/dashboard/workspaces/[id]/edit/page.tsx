import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getWorkspaceById } from "@/lib/db/workspaces";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WorkspaceForm } from "@/components/workspace/WorkspaceForm";

export const metadata = {
  title: "ワークスペース編集 | TeamFlow",
};

type Props = { params: Promise<{ id: string }> };

export default async function WorkspaceEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceById(supabase, id, user.id);
  if (!workspace) notFound();

  const isOwner = workspace.owner_id === user.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        {/* パンくず */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/dashboard" className="hover:text-gray-600 transition-colors">
            ダッシュボード
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/dashboard/workspaces" className="hover:text-gray-600 transition-colors">
            ワークスペース
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600 truncate max-w-[160px]">{workspace.name}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600">編集</span>
        </nav>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-8">
          <h1 className="text-xl font-bold text-gray-900 mb-6">ワークスペースを編集</h1>
          <WorkspaceForm mode="edit" workspace={workspace} isOwner={isOwner} />
        </div>
      </main>
    </div>
  );
}
