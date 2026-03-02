import Link from "next/link";

type PricingPlan = {
  name: string;
  price: string;
  unit: string;
  desc: string;
  highlight: boolean;
  features: string[];
  cta: string;
};

const PLANS: PricingPlan[] = [
  {
    name: "Starter",
    price: "¥3,980",
    unit: "/ チーム / 月",
    desc: "小規模チームの導入に",
    highlight: false,
    features: [
      "最大10名",
      "プロジェクト数 無制限",
      "承認フロー",
      "期限変更履歴（90日）",
      "メールサポート",
    ],
    cta: "無料で試す",
  },
  {
    name: "Business",
    price: "¥9,800",
    unit: "/ チーム / 月",
    desc: "成長するチームに",
    highlight: true,
    features: [
      "最大30名",
      "プロジェクト数 無制限",
      "承認フロー（多段階対応）",
      "期限変更履歴（無制限）",
      "Slack通知連携",
      "優先サポート",
      "監査ログ出力",
    ],
    cta: "無料で試す",
  },
];

export function LpPricing() {
  return (
    <section id="pricing" className="py-24 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">シンプルな料金プラン</h2>
          <p className="text-gray-500">チームの規模に合わせて選べる2プラン</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 border ${
                plan.highlight
                  ? "border-indigo-300 bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="mb-6">
                <h3 className={`text-lg font-semibold mb-1 ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlight ? "text-indigo-200" : "text-gray-500"}`}>{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlight ? "text-indigo-200" : "text-gray-500"}`}>{plan.unit}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-center gap-2 text-sm ${plan.highlight ? "text-indigo-100" : "text-gray-600"}`}
                  >
                    <svg
                      className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-indigo-300" : "text-indigo-500"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.highlight
                    ? "bg-white text-indigo-600 hover:bg-indigo-50"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">すべてのプランに14日間の無料トライアルが含まれます</p>
      </div>
    </section>
  );
}
