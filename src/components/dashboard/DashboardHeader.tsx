import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { LogoutButton } from "./LogoutButton";

export async function DashboardHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const displayName = user?.user_metadata?.display_name ?? user?.email ?? "";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900">TeamFlow</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-indigo-600">
            ダッシュボード
          </Link>
          <Link href="/dashboard/tasks" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            タスク
          </Link>
          <Link href="/dashboard/projects" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            プロジェクト
          </Link>
        </nav>

        {/* User */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-indigo-600">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="hidden md:block text-sm text-gray-700">{displayName}</span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
