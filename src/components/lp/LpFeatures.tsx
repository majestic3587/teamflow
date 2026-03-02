import { ReactNode } from "react";

type FeatureItem = {
  icon: ReactNode;
  title: string;
  desc: string;
  badge: string;
};

const FEATURES: FeatureItem[] = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    title: "上長承認フロー",
    desc: "タスクは承認されるまで着手不可。承認・却下・差し戻しをワンクリックで管理。手戻りを構造的に防ぎます。",
    badge: "コア機能",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: "期限変更履歴",
    desc: "期限を変更するたびに理由と変更者が自動記録。「なぜ延びたのか」が永久に追跡可能。",
    badge: "コア機能",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    title: "RBAC権限管理",
    desc: "Owner / Manager / Member の3ロールで操作権限を厳密に制御。組織の階層構造をそのまま反映。",
    badge: "セキュリティ",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
    title: "タスク責任者の明確化",
    desc: "タスクには必ず担当者をアサイン。誰が何に責任を持つかが一目でわかるダッシュボード。",
    badge: "管理",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
    title: "承認通知",
    desc: "承認依頼・承認完了・差し戻しをリアルタイム通知。承認待ちのタスクを見逃しません。",
    badge: "通知",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    title: "プロジェクト進捗管理",
    desc: "タスクのステータスを一覧で可視化。承認待ち・進行中・完了を横断的に把握できます。",
    badge: "可視化",
  },
];

export function LpFeatures() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">TeamFlowの主要機能</h2>
          <p className="text-gray-500">業務ルールをシステムに組み込み、組織の再現性を高める</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                {feature.icon}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base font-semibold text-gray-900">{feature.title}</h3>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{feature.badge}</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
