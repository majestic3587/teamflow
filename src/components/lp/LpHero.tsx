import Link from "next/link";

export function LpHero() {
  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
          BtoBチーム向けタスク管理SaaS
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          承認なしに
          <br />
          <span className="text-indigo-600">着手させない。</span>
          <br />
          変更は必ず<span className="text-indigo-600">履歴に残す。</span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          TeamFlowは、上長承認フローと期限変更履歴を中心に設計されたチームタスク管理ツールです。
          業務ルールをシステムで強制し、手戻りゼロの組織をつくります。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            無料トライアルを始める
          </Link>
          <a
            href="#how-it-works"
            className="border border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-base font-semibold hover:bg-gray-50 transition-colors"
          >
            使い方を見る
          </a>
        </div>

        <p className="text-sm text-gray-400 mt-5">クレジットカード不要 · 14日間無料</p>
      </div>
    </section>
  );
}
