import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getWorkspaceById } from "@/lib/db/workspaces";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectForm } from "@/components/project/ProjectForm";

export const metadata = {
  title: "プロジェクト作成 | TeamFlow",
};

type Props = { params: Promise<{ id: string }> };

export default async function NewProjectPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceById(supabase, id, user.id);
  if (!workspace) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-2xl mx-auto px-6 pt-24 pb-16">
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
          <Link
            href={`/dashboard/workspaces/${id}/projects`}
            className="hover:text-gray-600 transition-colors truncate max-w-[160px]"
          >
            {workspace.name}
          </Link>
          <ChevronIcon />
          <span className="text-gray-600">新規プロジェクト</span>
        </nav>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-8">
          <h1 className="text-xl font-bold text-gray-900 mb-6">
            プロジェクトを作成
          </h1>
          <ProjectForm mode="create" workspaceId={id} />
        </div>
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
