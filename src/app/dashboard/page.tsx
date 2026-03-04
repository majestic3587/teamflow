import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { MyTaskList } from "@/components/dashboard/MyTaskList";
import { ApprovalQueue } from "@/components/dashboard/ApprovalQueue";
import {
  getDashboardStats,
  getMyTasks,
  getApprovalQueue,
} from "@/lib/db/dashboard";

export const metadata = {
  title: "ダッシュボード | TeamFlow",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [stats, myTasks, approvalQueue] = await Promise.all([
    getDashboardStats(supabase),
    getMyTasks(supabase, user.id),
    getApprovalQueue(supabase, user.id),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-sm text-gray-500 mt-1">チームのタスク状況を確認しましょう。</p>
        </div>

        <section className="mb-8">
          <StatsCards stats={stats} />
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <MyTaskList tasks={myTasks} />
          <ApprovalQueue tasks={approvalQueue} />
        </section>
      </main>
    </div>
  );
}
