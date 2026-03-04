import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectCard } from "@/components/project/ProjectCard";
import type { Project } from "@/types/project";

export const metadata = {
  title: "プロジェクト | TeamFlow",
};

type WorkspaceSection = {
  workspaceId: string;
  workspaceName: string;
  canManage: boolean;
  projects: Project[];
};

export default async function MyProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 所属ワークスペースとロールを取得
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(id, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const workspaceRoleMap = new Map<string, { name: string; canManage: boolean }>();
  (memberships ?? []).forEach((m) => {
    const ws = Array.isArray(m.workspaces) ? m.workspaces[0] : m.workspaces;
    if (ws) {
      workspaceRoleMap.set(ws.id as string, {
        name: ws.name as string,
        canManage: m.role === "owner" || m.role === "manager",
      });
    }
  });

  // 所属ワークスペースのプロジェクトを一括取得（RLS で自動フィルタリング）
  const { data: projectsRaw } = await supabase
    .from("projects")
    .select(
      "id, workspace_id, name, description, created_by, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  const projects = (projectsRaw ?? []) as Project[];

  // ワークスペースごとにグループ化
  const sectionsMap = new Map<string, WorkspaceSection>();
  projects.forEach((project) => {
    const wsInfo = workspaceRoleMap.get(project.workspace_id);
    if (!wsInfo) return;

    if (!sectionsMap.has(project.workspace_id)) {
      sectionsMap.set(project.workspace_id, {
        workspaceId: project.workspace_id,
        workspaceName: wsInfo.name,
        canManage: wsInfo.canManage,
        projects: [],
      });
    }
    sectionsMap.get(project.workspace_id)!.projects.push(project);
  });

  const sections = Array.from(sectionsMap.values());

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        {/* パンくず */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/dashboard" className="hover:text-gray-600 transition-colors">
            ダッシュボード
          </Link>
          <ChevronIcon />
          <span className="text-gray-600">プロジェクト</span>
        </nav>

        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">プロジェクト</h1>
          <p className="text-sm text-gray-500 mt-1">
            所属しているワークスペースのプロジェクト一覧です。
          </p>
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
            <p className="text-gray-500 text-sm mb-2">プロジェクトがありません</p>
            <Link
              href="/dashboard/workspaces"
              className="text-indigo-600 text-sm font-medium hover:text-indigo-700"
            >
              ワークスペースを確認する →
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.workspaceId}>
                {/* ワークスペース見出し */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center">
                      <svg
                        className="w-3.5 h-3.5 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <h2 className="text-sm font-semibold text-gray-700">
                      {section.workspaceName}
                    </h2>
                    <span className="text-xs text-gray-400">
                      {section.projects.length} 件
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/workspaces/${section.workspaceId}/projects`}
                    className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                  >
                    すべて見る →
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {section.projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      canManage={section.canManage}
                    />
                  ))}
                </div>
              </div>
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
