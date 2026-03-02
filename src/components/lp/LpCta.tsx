import Link from "next/link";

export function LpCta() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          チームの手戻りを、
          <br />
          今日から終わらせよう。
        </h2>
        <p className="text-lg text-gray-500 mb-10">
          14日間無料で全機能をお試しいただけます。
          <br />
          クレジットカードの登録は不要です。
        </p>
        <Link
          href="/signup"
          className="inline-block bg-indigo-600 text-white px-10 py-4 rounded-xl text-base font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          無料トライアルを始める
        </Link>
      </div>
    </section>
  );
}
