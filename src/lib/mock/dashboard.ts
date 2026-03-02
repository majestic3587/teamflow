export type TaskStatus = "pending_approval" | "approved" | "in_progress" | "done" | "rejected";
export type UserRole = "owner" | "manager" | "member";

export type Task = {
  id: string;
  title: string;
  project: string;
  status: TaskStatus;
  dueDate: string;
  assignee: string;
  requester?: string;
};

export const MOCK_MY_TASKS: Task[] = [
  {
    id: "t1",
    title: "LP デザインの最終確認",
    project: "TeamFlow リリース",
    status: "in_progress",
    dueDate: "2026-03-05",
    assignee: "山田 太郎",
  },
  {
    id: "t2",
    title: "ダッシュボード API 実装",
    project: "TeamFlow リリース",
    status: "approved",
    dueDate: "2026-03-08",
    assignee: "山田 太郎",
  },
  {
    id: "t3",
    title: "ユーザーインタビュー資料作成",
    project: "マーケティング Q1",
    status: "pending_approval",
    dueDate: "2026-03-10",
    assignee: "山田 太郎",
  },
  {
    id: "t4",
    title: "競合調査レポート",
    project: "マーケティング Q1",
    status: "done",
    dueDate: "2026-02-28",
    assignee: "山田 太郎",
  },
  {
    id: "t5",
    title: "請求書フロー設計",
    project: "バックオフィス改善",
    status: "rejected",
    dueDate: "2026-03-12",
    assignee: "山田 太郎",
  },
];

export const MOCK_APPROVAL_QUEUE: Task[] = [
  {
    id: "a1",
    title: "新規顧客向け提案書作成",
    project: "営業 PJ",
    status: "pending_approval",
    dueDate: "2026-03-06",
    assignee: "鈴木 花子",
    requester: "鈴木 花子",
  },
  {
    id: "a2",
    title: "SNS 広告クリエイティブ制作",
    project: "マーケティング Q1",
    status: "pending_approval",
    dueDate: "2026-03-07",
    assignee: "田中 一郎",
    requester: "田中 一郎",
  },
  {
    id: "a3",
    title: "サーバーコスト見直し調査",
    project: "インフラ最適化",
    status: "pending_approval",
    dueDate: "2026-03-15",
    assignee: "佐藤 次郎",
    requester: "佐藤 次郎",
  },
];

export const MOCK_STATS = {
  totalTasks: 12,
  pendingApproval: 3,
  inProgress: 4,
  overdue: 1,
};
