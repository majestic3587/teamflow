import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "ログイン | TeamFlow",
  description: "TeamFlowにログインしてチームのタスク管理を始めましょう。",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900">TeamFlow</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-10">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">ログイン</h1>
              <p className="text-sm text-gray-500">
                アカウントにサインインしてください。
              </p>
            </div>

            <LoginForm />
          </div>

          {/* Signup link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            アカウントをお持ちでない方は{" "}
            <Link href="/signup" className="text-indigo-600 font-medium hover:underline">
              新規登録
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-5 text-center">
        <p className="text-xs text-gray-400">© 2026 TeamFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}
