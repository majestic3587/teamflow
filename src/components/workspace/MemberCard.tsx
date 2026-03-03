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

type Props = {
  member: WorkspaceMemberWithUser;
  isCurrentUser: boolean;
};

export function MemberCard({ member, isCurrentUser }: Props) {
  const initial = (member.display_name ?? member.email).charAt(0).toUpperCase();

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
      </div>

      {/* ロールバッジ */}
      <span
        className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_BADGE[member.role] ?? ROLE_BADGE.member}`}
      >
        {ROLE_LABEL[member.role] ?? member.role}
      </span>

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
