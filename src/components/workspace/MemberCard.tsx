"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkspaceMemberWithUser } from "@/types/workspace";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  member: "Member",
};

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-yellow-100 text-yellow-700",
  manager: "bg-indigo-100 text-indigo-700",
  member: "bg-gray-100 text-gray-600",
};

const ROLE_OPTIONS = ["owner", "manager", "member"] as const;

type Props = {
  member: WorkspaceMemberWithUser;
  workspaceId: string;
  isCurrentUser: boolean;
  canChangeRole: boolean;
  callerRole: string;
};

export function MemberCard({
  member,
  workspaceId,
  isCurrentUser,
  canChangeRole,
  callerRole,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const initial = (member.display_name ?? member.email).charAt(0).toUpperCase();

  const showSelector = canChangeRole && !isCurrentUser;

  // manager は owner の変更不可、owner への昇格も不可
  function isOptionDisabled(option: string) {
    if (callerRole === "manager") {
      if (option === "owner") return true;
      if (member.role === "owner") return true;
    }
    return false;
  }

  async function handleRoleChange(newRole: string) {
    if (newRole === member.role) return;
    setSaving(true);
    setError("");

    const res = await fetch(
      `/api/workspaces/${workspaceId}/members/${member.user_id}/role`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      }
    );

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "変更に失敗しました。");
      setSaving(false);
      return;
    }

    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4 bg-white border border-gray-100 rounded-xl">
      {/* アバター */}
      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-indigo-600">{initial}</span>
      </div>

      {/* ユーザー情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {member.display_name}
          </p>
          {isCurrentUser && (
            <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              あなた
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{member.email}</p>
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>

      {/* ロール: 変更可能なら select、そうでなければバッジ */}
      {showSelector ? (
        <select
          value={member.role}
          onChange={(e) => handleRoleChange(e.target.value)}
          disabled={saving || (callerRole === "manager" && member.role === "owner")}
          className="flex-shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt} value={opt} disabled={isOptionDisabled(opt)}>
              {ROLE_LABEL[opt]}
            </option>
          ))}
        </select>
      ) : (
        <span
          className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_BADGE[member.role] ?? ROLE_BADGE.member}`}
        >
          {ROLE_LABEL[member.role] ?? member.role}
        </span>
      )}

      {/* 参加日 */}
      <span className="hidden sm:block flex-shrink-0 text-xs text-gray-400 w-24 text-right">
        {new Date(member.created_at).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </span>
    </div>
  );
}
