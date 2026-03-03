-- =============================================
-- workspaces テーブル
-- =============================================

create table public.workspaces (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  owner_id    uuid        not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.workspaces enable row level security;

-- 自分が所属する workspace のみ参照可能（ログイン必須）
create policy "workspaces: select for members"
  on public.workspaces for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.workspace_members
      where workspace_id = workspaces.id
        and user_id = auth.uid()
    )
  );

-- ログイン済みユーザーのみ作成可能・作成者が owner_id になること
create policy "workspaces: insert for authenticated"
  on public.workspaces for insert
  with check (
    auth.uid() is not null
    and auth.uid() = owner_id
  );

-- owner のみ更新可能（ログイン必須）
create policy "workspaces: update for owner"
  on public.workspaces for update
  using  (auth.uid() is not null and owner_id = auth.uid())
  with check (auth.uid() is not null and owner_id = auth.uid());

-- owner のみ削除可能（ログイン必須）
create policy "workspaces: delete for owner"
  on public.workspaces for delete
  using (auth.uid() is not null and owner_id = auth.uid());

-- =============================================
-- workspace_members テーブル
-- =============================================

create type public.workspace_role as enum ('owner', 'manager', 'member');

create table public.workspace_members (
  id           uuid           primary key default gen_random_uuid(),
  workspace_id uuid           not null references public.workspaces (id) on delete cascade,
  user_id      uuid           not null references auth.users (id) on delete cascade,
  role         workspace_role not null default 'member',
  created_at   timestamptz    not null default now(),
  unique (workspace_id, user_id)
);

alter table public.workspace_members enable row level security;

-- 自分のメンバーシップ行のみ参照可能（自己参照を避ける）
create policy "workspace_members: select for members"
  on public.workspace_members for select
  using (auth.uid() = user_id);

-- owner/manager のみ追加可能（ログイン必須）
create policy "workspace_members: insert for owner or manager"
  on public.workspace_members for insert
  with check (
    auth.uid() is not null
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'manager')
    )
  );

-- owner のみ削除可能（ログイン必須）
create policy "workspace_members: delete for owner"
  on public.workspace_members for delete
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
        and wm.role = 'owner'
    )
  );

-- =============================================
-- workspace 作成時に owner を workspace_members へ自動追加する Trigger
-- security definer で RLS をバイパスして insert する
-- =============================================

create or replace function public.handle_new_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_workspace_created
  after insert on public.workspaces
  for each row
  execute function public.handle_new_workspace();

-- =============================================
-- updated_at 自動更新 Trigger
-- =============================================

create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row
  execute function public.set_updated_at();

-- =============================================
-- ワークスペースメンバー一覧取得 RPC
-- auth.users と JOIN するため security definer で実行
-- =============================================

create or replace function public.get_workspace_members(p_workspace_id uuid)
returns table (
  id uuid,
  workspace_id uuid,
  user_id uuid,
  role text,
  created_at timestamptz,
  display_name text,
  email text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
  ) then
    raise exception 'Not a member of this workspace'
      using errcode = '42501';
  end if;

  return query
    select
      wm.id,
      wm.workspace_id,
      wm.user_id,
      wm.role::text,
      wm.created_at,
      coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email::text, '@', 1))::text as display_name,
      u.email::text
    from public.workspace_members wm
    join auth.users u on u.id = wm.user_id
    where wm.workspace_id = p_workspace_id
    order by
      case wm.role
        when 'owner' then 1
        when 'manager' then 2
        else 3
      end,
      wm.created_at asc;
end;
$$;
