This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## API 設計

すべてのエンドポイントは認証必須です。認証には Supabase Auth を使用します。

### ロール定義

| ロール | 説明 |
|--------|------|
| `owner` | ワークスペース所有者。全操作が可能 |
| `manager` | ワークスペース管理者。タスク承認・メンバー管理が可能 |
| `member` | 一般メンバー。タスクの作成・進捗更新が可能 |

---

### プロフィール

| メソッド | エンドポイント | 説明 | 権限 | リクエストボディ |
|----------|---------------|------|------|----------------|
| `GET` | `/api/me` | 自分のプロフィール取得 | ログインユーザー | - |
| `PATCH` | `/api/me` | 自分のプロフィール更新 | ログインユーザー | `display_name` (1〜50文字) |

---

### ワークスペース

| メソッド | エンドポイント | 説明 | 権限 | リクエストボディ |
|----------|---------------|------|------|----------------|
| `GET` | `/api/workspaces` | 所属ワークスペース一覧取得 | ログインユーザー | - |
| `POST` | `/api/workspaces` | ワークスペース作成 | ログインユーザー | `name` (必須, 1〜50文字), `description` (任意) |
| `GET` | `/api/workspaces/[id]` | ワークスペース詳細取得 | メンバー以上 | - |
| `PATCH` | `/api/workspaces/[id]` | ワークスペース情報更新 | owner のみ | `name` (任意, 1〜50文字), `description` (任意) |
| `DELETE` | `/api/workspaces/[id]` | ワークスペース削除 | owner のみ | - |

---

### ワークスペースメンバー

| メソッド | エンドポイント | 説明 | 権限 | リクエストボディ |
|----------|---------------|------|------|----------------|
| `GET` | `/api/workspaces/[id]/members` | メンバー一覧取得 | メンバー以上 | - |
| `PATCH` | `/api/workspaces/[id]/members/[userId]/role` | メンバーのロール変更 | owner / manager | `role` (`owner` \| `manager` \| `member`) |

---

### プロジェクト

| メソッド | エンドポイント | 説明 | 権限 | リクエストボディ |
|----------|---------------|------|------|----------------|
| `GET` | `/api/workspaces/[id]/projects` | プロジェクト一覧取得 | メンバー以上 | - |
| `POST` | `/api/workspaces/[id]/projects` | プロジェクト作成 | メンバー以上 | `name` (必須, 1〜100文字), `description` (任意) |
| `GET` | `/api/projects/[id]` | プロジェクト詳細取得 | メンバー以上 | - |
| `PATCH` | `/api/projects/[id]` | プロジェクト情報更新 | manager 以上 | `name` (任意, 1〜100文字), `description` (任意) |
| `DELETE` | `/api/projects/[id]` | プロジェクト削除 | manager 以上 | - |

---

### タスク

| メソッド | エンドポイント | 説明 | 権限 | リクエストボディ |
|----------|---------------|------|------|----------------|
| `GET` | `/api/projects/[id]/tasks` | タスク一覧取得 | メンバー以上 | - |
| `POST` | `/api/projects/[id]/tasks` | タスク作成 | メンバー以上 | `title` (必須, 1〜200文字), `assignee_id` (任意), `due_date` (任意, ISO 8601), `definition_of_done` (任意) |
| `GET` | `/api/tasks/[id]` | タスク詳細取得 | メンバー以上 | - |
| `PATCH` | `/api/tasks/[id]` | タスク情報更新 | 作成者 / manager 以上 | `title`, `assignee_id`, `due_date`, `definition_of_done`, `approval_status`, `work_status` (すべて任意) |
| `DELETE` | `/api/tasks/[id]` | タスク削除 | メンバー以上 | - |
| `PATCH` | `/api/tasks/[id]/status` | タスク進捗ステータス更新 | 担当者 / 作成者 / manager 以上 | `work_status` (`NOT_STARTED` \| `IN_PROGRESS` \| `DONE`) |
| `PATCH` | `/api/tasks/[id]/due-date` | タスク期限変更（履歴記録あり） | owner / manager | `new_due_date` (ISO 8601 \| null), `reason` (任意) |

---

### タスク承認フロー

| メソッド | エンドポイント | 説明 | 権限 | 遷移 |
|----------|---------------|------|------|------|
| `POST` | `/api/tasks/[id]/submit-approval` | 承認申請 | 作成者 / 担当者 / manager 以上 | `DRAFT` → `PENDING` |
| `POST` | `/api/tasks/[id]/approve` | タスク承認 | owner / manager | `PENDING` → `APPROVED` |
| `POST` | `/api/tasks/[id]/reject` | タスク差し戻し | owner / manager | `PENDING` → `REJECTED` |

#### 承認ステータス遷移

```
DRAFT ──submit-approval──▶ PENDING ──approve──▶ APPROVED
                                    └──reject──▶ REJECTED
```

> `work_status` を `IN_PROGRESS` または `DONE` に変更するには `approval_status` が `APPROVED` である必要があります。

---

### タスクコメント

| メソッド | エンドポイント | 説明 | 権限 | リクエストボディ |
|----------|---------------|------|------|----------------|
| `GET` | `/api/tasks/[id]/comments` | コメント一覧取得 | メンバー以上 | - |
| `POST` | `/api/tasks/[id]/comments` | コメント投稿 | メンバー以上 | `body` (必須, 1〜2000文字) |
| `PATCH` | `/api/tasks/[id]/comments/[commentId]` | コメント編集 | 投稿者本人のみ | `body` (必須, 1〜2000文字) |
| `DELETE` | `/api/tasks/[id]/comments/[commentId]` | コメント削除 | 投稿者本人のみ | - |

---

### 監査ログ

| メソッド | エンドポイント | 説明 | 権限 | クエリパラメータ |
|----------|---------------|------|------|----------------|
| `GET` | `/api/workspaces/[id]/audit-logs` | 監査ログ一覧取得 | メンバー以上 | `limit` (任意, 1〜500, デフォルト: 100) |

---

### 共通エラーレスポンス

| ステータス | 説明 |
|-----------|------|
| `400 Bad Request` | バリデーションエラー / 不正な状態遷移 |
| `401 Unauthorized` | 未認証 |
| `403 Forbidden` | 権限不足 |
| `404 Not Found` | リソースが存在しない |
| `500 Internal Server Error` | サーバーエラー |
