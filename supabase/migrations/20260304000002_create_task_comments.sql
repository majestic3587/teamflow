-- =============================================
-- task_comments テーブル
-- =============================================

create table public.task_comments (
  id         uuid        primary key default gen_random_uuid(),
  task_id    uuid        not null references public.tasks (id) on delete cascade,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  body       text        not null,
  created_at timestamptz not null default now()
);

alter table public.task_comments enable row level security;

-- SELECT: タスクが属するプロジェクトのメンバーのみ
create policy "task_comments: select for project members"
  on public.task_comments for select
  using (
    exists (
      select 1
        from public.tasks t
        join public.projects p on p.id = t.project_id
        join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where t.id = task_comments.task_id
        and wm.user_id = auth.uid()
    )
  );

-- INSERT: タスクが属するプロジェクトのメンバーのみ
create policy "task_comments: insert for project members"
  on public.task_comments for insert
  with check (
    exists (
      select 1
        from public.tasks t
        join public.projects p on p.id = t.project_id
        join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where t.id = task_comments.task_id
        and wm.user_id = auth.uid()
    )
  );

-- UPDATE: 自分が投稿したコメントのみ編集可能
create policy "task_comments: update own"
  on public.task_comments for update
  using (auth.uid() = task_comments.user_id)
  with check (auth.uid() = task_comments.user_id);

-- DELETE: 自分が投稿したコメントのみ削除可能
create policy "task_comments: delete own"
  on public.task_comments for delete
  using (auth.uid() = task_comments.user_id);
