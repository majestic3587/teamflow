import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getWorkspaceById } from "@/lib/db/workspaces";
import { getProjectsByWorkspaceId } from "@/lib/db/projects";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectCard } from "@/components/project/ProjectCard";

export const metadata = {
  title: "プロジェクト一覧 | TeamFlow",
};

type Props = { params: Promise<{ id: string }> };

export default async function WorkspaceProjectsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [workspace, projects] = await Promise.all([
    getWorkspaceById(supabase, id, user.id),
    getProjectsByWorkspaceId(supabase, id),
  ]);

  if (!workspace) notFound();

  // Manager 以上かチェック（編集ボタン表示用）
  const { data: memberRow } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", id)
    .eq("user_id", user.id)
    .single();

  const canManage =
    memberRow?.role === "owner" || memberRow?.role === "manager";

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">
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
          <span className="text-gray-600">プロジェクト</span>
        </nav>

        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">プロジェクト</h1>
            <p className="text-sm text-gray-500 mt-1">
              {projects.length} 件のプロジェクト
            </p>
          </div>
          <Link
            href={`/dashboard/workspaces/${id}/projects/new`}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            新規作成
          </Link>
        </div>

        {/* プロジェクト一覧 */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              まだプロジェクトがありません
            </p>
            <Link
              href={`/dashboard/workspaces/${id}/projects/new`}
              className="text-indigo-600 text-sm font-medium hover:text-indigo-700"
            >
              最初のプロジェクトを作成する →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                canManage={canManage}
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
