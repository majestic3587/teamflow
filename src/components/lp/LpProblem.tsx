type ProblemItem = {
  icon: string;
  title: string;
  desc: string;
};

const PROBLEMS: ProblemItem[] = [
  {
    icon: "⚠️",
    title: "承認前に作業が進んでしまう",
    desc: "上長の承認を待たずに着手し、後から方針変更で全部やり直し。手戻りコストが膨大になる。",
  },
  {
    icon: "📅",
    title: "期限変更の経緯が残らない",
    desc: "「なぜ期限が延びたのか」が誰にもわからない。責任の所在も曖昧になる。",
  },
  {
    icon: "👤",
    title: "タスクの責任者が曖昧",
    desc: "「誰がやるのか」が不明確なまま放置され、気づいたら誰もやっていなかった。",
  },
  {
    icon: "📋",
    title: "業務ルールが守られない",
    desc: "ルールはあるが運用依存。新メンバーが加わるたびにルール破りが発生する。",
  },
];

export function LpProblem() {
  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">こんな問題、抱えていませんか？</h2>
          <p className="text-gray-500">BtoB組織で繰り返される、タスク管理の失敗パターン</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {PROBLEMS.map((item) => (
            <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
