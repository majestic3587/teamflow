-- =============================================
-- due_date_changes テーブル
-- タスクの期限変更履歴を記録する
-- =============================================

create table public.due_date_changes (
  id           uuid        primary key default gen_random_uuid(),
  task_id      uuid        not null references public.tasks(id) on delete cascade,
  changed_by   uuid        references auth.users(id) on delete set null,
  old_due_date date,
  new_due_date date,
  reason       text,
  created_at   timestamptz not null default now()
);

create index due_date_changes_task_id_idx
  on public.due_date_changes(task_id, created_at desc);

alter table public.due_date_changes enable row level security;

-- SELECT: ワークスペースメンバーのみ
create policy "due_date_changes: select for workspace members"
  on public.due_date_changes for select
  using (
    exists (
      select 1
      from public.tasks t
      join public.projects p on p.id = t.project_id
      join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where t.id = due_date_changes.task_id
        and wm.user_id = auth.uid()
    )
  );

-- INSERT: ワークスペースメンバーのみ（owner/manager チェックは API 層で実施）
create policy "due_date_changes: insert for workspace members"
  on public.due_date_changes for insert
  with check (
    exists (
      select 1
      from public.tasks t
      join public.projects p on p.id = t.project_id
      join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where t.id = due_date_changes.task_id
        and wm.user_id = auth.uid()
    )
  );
