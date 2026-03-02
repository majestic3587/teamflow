export function LpFooter() {
  return (
    <footer className="border-t border-gray-100 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900">TeamFlow</span>
        </div>

        <p className="text-sm text-gray-400">© 2026 TeamFlow. All rights reserved.</p>

        <div className="flex gap-6">
          <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            プライバシーポリシー
          </a>
          <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            利用規約
          </a>
          <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            お問い合わせ
          </a>
        </div>
      </div>
    </footer>
  );
}
