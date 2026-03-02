"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/profile";

type Props = {
  profile: Profile;
};

const ROLE_LABEL: Record<Profile["role"], string> = {
  owner:   "Owner",
  manager: "Manager",
  member:  "Member",
};

const ROLE_BADGE: Record<Profile["role"], string> = {
  owner:   "bg-yellow-100 text-yellow-700",
  manager: "bg-indigo-100 text-indigo-700",
  member:  "bg-gray-100 text-gray-600",
};

export function ProfileForm({ profile }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isDirty = displayName.trim() !== profile.display_name;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty) return;

    setStatus("saving");
    setErrorMsg("");

    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: displayName.trim() }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setErrorMsg(json.error ?? "更新に失敗しました。");
      setStatus("error");
      return;
    }

    setStatus("success");
    router.refresh();

    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* アバター */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-bold text-indigo-600">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{profile.display_name}</p>
          <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mt-1 ${ROLE_BADGE[profile.role]}`}>
            {ROLE_LABEL[profile.role]}
          </span>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* 表示名 */}
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1.5">
          表示名
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
        <p className="text-xs text-gray-400 mt-1.5">{displayName.length} / 50</p>
      </div>

      {/* ロール（読み取り専用） */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          ロール
        </label>
        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
          {ROLE_LABEL[profile.role]}
          <span className="text-xs text-gray-400 ml-2">（変更は管理者が行います）</span>
        </div>
      </div>

      {/* 登録日 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          登録日
        </label>
        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
          {new Date(profile.created_at).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* エラー */}
      {status === "error" && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {errorMsg}
        </div>
      )}

      {/* 保存ボタン */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!isDirty || status === "saving"}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "saving" ? "保存中..." : "変更を保存"}
        </button>

        {status === "success" && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            保存しました
          </span>
        )}
      </div>
    </form>
  );
}
