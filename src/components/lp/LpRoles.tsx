type RoleItem = {
  role: string;
  color: string;
  badgeColor: string;
  iconColor: string;
  desc: string;
  permissions: string[];
};

const ROLES: RoleItem[] = [
  {
    role: "Owner",
    color: "border-yellow-200 bg-yellow-50",
    badgeColor: "bg-yellow-100 text-yellow-700",
    iconColor: "text-yellow-600",
    desc: "組織全体の管理者",
    permissions: [
      "全タスクの閲覧・編集",
      "メンバー招待・権限変更",
      "全プロジェクトの承認",
      "組織設定の変更",
      "請求・プラン管理",
    ],
  },
  {
    role: "Manager",
    color: "border-indigo-200 bg-indigo-50",
    badgeColor: "bg-indigo-100 text-indigo-700",
    iconColor: "text-indigo-600",
    desc: "チームの承認者",
    permissions: [
      "担当プロジェクトの承認・却下",
      "メンバーへのタスクアサイン",
      "期限変更の承認",
      "チーム進捗の閲覧",
      "レポート出力",
    ],
  },
  {
    role: "Member",
    color: "border-gray-200 bg-gray-50",
    badgeColor: "bg-gray-100 text-gray-700",
    iconColor: "text-gray-600",
    desc: "タスクの実行者",
    permissions: [
      "タスクの作成・申請",
      "自タスクのステータス更新",
      "期限変更申請（理由必須）",
      "コメント・添付ファイル",
      "自タスクの履歴閲覧",
    ],
  },
];

export function LpRoles() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">3つのロールで組織を管理</h2>
          <p className="text-gray-500">Owner / Manager / Member — 組織の階層をそのままシステムに反映</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {ROLES.map((item) => (
            <div key={item.role} className={`rounded-2xl p-6 border ${item.color}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${item.badgeColor}`}>
                  {item.role}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{item.desc}</p>
              <ul className="space-y-2">
                {item.permissions.map((permission) => (
                  <li key={permission} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg
                      className={`w-4 h-4 flex-shrink-0 ${item.iconColor}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
