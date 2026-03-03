-- =============================================
-- set_updated_at ヘルパー関数（存在しなければ作成）
-- =============================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================
-- projects テーブル
-- =============================================

create table public.projects (
  id           uuid        primary key default gen_random_uuid(),
  workspace_id uuid        not null references public.workspaces (id) on delete cascade,
  name         text        not null,
  description  text,
  created_by   uuid        not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.projects enable row level security;

-- SELECT: ワークスペースメンバーのみ
create policy "projects: select for workspace members"
  on public.projects for select
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = projects.workspace_id
        and wm.user_id = auth.uid()
    )
  );

-- INSERT: ワークスペースメンバーのみ
create policy "projects: insert for workspace members"
  on public.projects for insert
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = projects.workspace_id
        and wm.user_id = auth.uid()
    )
  );

-- UPDATE: manager / owner のみ
create policy "projects: update for manager or owner"
  on public.projects for update
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = projects.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'manager')
    )
  )
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = projects.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'manager')
    )
  );

-- DELETE: manager / owner のみ
create policy "projects: delete for manager or owner"
  on public.projects for delete
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = projects.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'manager')
    )
  );

-- updated_at 自動更新
create trigger projects_set_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();
