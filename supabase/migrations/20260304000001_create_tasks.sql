-- =============================================
-- task_approval_status / task_work_status enum
-- =============================================

create type public.task_approval_status as enum (
  'DRAFT',
  'PENDING',
  'APPROVED',
  'REJECTED'
);

create type public.task_work_status as enum (
  'NOT_STARTED',
  'IN_PROGRESS',
  'DONE'
);

-- =============================================
-- tasks テーブル
-- =============================================

create table public.tasks (
  id                 uuid                        primary key default gen_random_uuid(),
  workspace_id       uuid                        not null references public.workspaces (id) on delete cascade,
  project_id         uuid                        not null references public.projects (id) on delete cascade,
  created_by         uuid                        not null references auth.users (id) on delete cascade,
  assignee_id        uuid                        references auth.users (id) on delete set null,
  title              text                        not null,
  due_date           timestamptz,
  definition_of_done text,
  approval_status    public.task_approval_status not null default 'DRAFT',
  work_status        public.task_work_status     not null default 'NOT_STARTED',
  created_at         timestamptz                 not null default now()
);

alter table public.tasks enable row level security;

-- SELECT: 自分が所属する Project のタスクのみ取得可能
create policy "tasks: select for project members"
  on public.tasks for select
  using (
    exists (
      select 1
        from public.projects p
        join public.workspace_members wm
          on wm.workspace_id = p.workspace_id
      where p.id = tasks.project_id
        and wm.user_id = auth.uid()
    )
  );

-- INSERT: 自分が所属する Project にタスクを追加可能
create policy "tasks: insert for project members"
  on public.tasks for insert
  with check (
    exists (
      select 1
        from public.projects p
        join public.workspace_members wm
          on wm.workspace_id = p.workspace_id
      where p.id = tasks.project_id
        and wm.user_id = auth.uid()
    )
  );

-- UPDATE: 自分が所属する Project のタスクを変更可能
create policy "tasks: update for project members"
  on public.tasks for update
  using (
    exists (
      select 1
        from public.projects p
        join public.workspace_members wm
          on wm.workspace_id = p.workspace_id
      where p.id = tasks.project_id
        and wm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
        from public.projects p
        join public.workspace_members wm
          on wm.workspace_id = p.workspace_id
      where p.id = tasks.project_id
        and wm.user_id = auth.uid()
    )
  );

-- DELETE: 自分が所属する Project のタスクを削除可能
create policy "tasks: delete for project members"
  on public.tasks for delete
  using (
    exists (
      select 1
        from public.projects p
        join public.workspace_members wm
          on wm.workspace_id = p.workspace_id
      where p.id = tasks.project_id
        and wm.user_id = auth.uid()
    )
  );
