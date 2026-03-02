type Step = {
  step: string;
  title: string;
  desc: string;
};

const STEPS: Step[] = [
  {
    step: "01",
    title: "タスクを作成・申請",
    desc: "Memberがタスクを作成し、上長（Manager / Owner）に承認申請を送ります。",
  },
  {
    step: "02",
    title: "上長が承認・却下",
    desc: "Managerがタスク内容を確認し、承認・却下・差し戻しを選択。コメントを添えて返答できます。",
  },
  {
    step: "03",
    title: "承認後に着手解禁",
    desc: "承認されたタスクのみ「進行中」に変更可能。未承認タスクへの着手はシステムがブロックします。",
  },
  {
    step: "04",
    title: "期限変更は理由必須",
    desc: "期限を変更する際は理由の入力が必須。変更者・変更日時・理由が自動的に履歴として記録されます。",
  },
];

export function LpHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">承認フローの仕組み</h2>
          <p className="text-gray-500">シンプルな4ステップで、手戻りゼロを実現</p>
        </div>

        <div className="space-y-4">
          {STEPS.map((item) => (
            <div key={item.step} className="flex gap-6 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                {item.step}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
