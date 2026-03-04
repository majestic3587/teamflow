import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getWorkspaceById } from "@/lib/db/workspaces";
import { getAuditLogsByWorkspaceId } from "@/lib/db/audit-logs";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import type { EntityType, EventType, AuditLogWithActor } from "@/types/audit-log";

export const metadata = {
  title: "監査ログ | TeamFlow",
};

type Props = { params: Promise<{ id: string }> };

// ─── ラベル / スタイル定義 ───────────────────────────

const EVENT_LABELS: Record<EventType, string> = {
  CREATED: "作成",
  UPDATED: "更新",
  APPROVED: "承認",
  REJECTED: "却下",
  DELETED: "削除",
  DUE_DATE_CHANGED: "期日変更",
};

const EVENT_STYLES: Record<EventType, string> = {
  CREATED: "bg-emerald-100 text-emerald-700",
  UPDATED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-teal-100 text-teal-700",
  REJECTED: "bg-red-100 text-red-600",
  DELETED: "bg-gray-100 text-gray-500",
  DUE_DATE_CHANGED: "bg-amber-100 text-amber-700",
};

const ENTITY_LABELS: Record<EntityType, string> = {
  task: "タスク",
  project: "プロジェクト",
  workspace: "ワークスペース",
  comment: "コメント",
};

const ENTITY_ICONS: Record<EntityType, React.ReactNode> = {
  task: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  project: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  workspace: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  comment: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
};

// ─── ページ ────────────────────────────────────────

export default async function AuditLogsPage({ params }: Props) {
  const { id: workspaceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceById(supabase, workspaceId, user.id);
  if (!workspace) notFound();

  const logs = await getAuditLogsByWorkspaceId(supabase, workspaceId);

  // 日付でグルーピング
  const grouped = groupByDate(logs);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        {/* パンくず */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
          <Link href="/dashboard" className="hover:text-gray-600 transition-colors">
            ダッシュボード
          </Link>
          <ChevronIcon />
          <Link href="/dashboard/workspaces" className="hover:text-gray-600 transition-colors">
            ワークスペース
          </Link>
          <ChevronIcon />
          <span className="text-gray-600 truncate max-w-[160px]">{workspace.name}</span>
          <ChevronIcon />
          <span className="text-gray-600">監査ログ</span>
        </nav>

        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">監査ログ</h1>
          <p className="text-sm text-gray-500 mt-1">
            直近 {logs.length} 件のアクティビティ
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">まだアクティビティがありません</p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(({ dateLabel, entries }) => (
              <section key={dateLabel}>
                {/* 日付ヘッダー */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* ログリスト */}
                <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                  {entries.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                      {/* アクターアバター */}
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-xs flex-shrink-0 mt-0.5">
                        {(log.actor_display_name ?? "?").charAt(0).toUpperCase()}
                      </div>

                      {/* 本文 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {log.actor_display_name ?? "不明なユーザー"}
                          </span>
                          {/* イベントバッジ */}
                          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${EVENT_STYLES[log.event_type]}`}>
                            {EVENT_LABELS[log.event_type]}
                          </span>
                          {/* エンティティタイプ */}
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {ENTITY_ICONS[log.entity_type]}
                            {ENTITY_LABELS[log.entity_type]}
                          </span>
                        </div>
                        {/* エンティティ名 */}
                        {log.metadata?.entity_name && (
                          <p className="text-sm text-gray-700 mt-0.5 truncate">
                            「{log.metadata.entity_name}」
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(log.created_at).toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── ユーティリティ ──────────────────────────────────

function groupByDate(logs: AuditLogWithActor[]) {
  const map = new Map<string, AuditLogWithActor[]>();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const log of logs) {
    const d = new Date(log.created_at);
    let label: string;

    if (isSameDay(d, today)) {
      label = "今日";
    } else if (isSameDay(d, yesterday)) {
      label = "昨日";
    } else {
      label = d.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(log);
  }

  return Array.from(map.entries()).map(([dateLabel, entries]) => ({
    dateLabel,
    entries,
  }));
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function ChevronIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
