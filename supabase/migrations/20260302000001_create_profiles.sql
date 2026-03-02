-- =============================================
-- profiles テーブル
-- auth.users と 1:1 で紐づくアプリ側ユーザー情報
-- =============================================

create type public.user_role as enum ('owner', 'manager', 'member');

create table public.profiles (
  id            uuid        primary key references auth.users (id) on delete cascade,
  display_name  text        not null,
  role          user_role   not null default 'member',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- RLS を有効化
alter table public.profiles enable row level security;

-- 自分自身のプロフィールのみ参照可能
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

-- 自分自身のプロフィールのみ更新可能
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- =============================================
-- auth.users insert 時に profiles へ自動 insert する Trigger
-- =============================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- =============================================
-- updated_at を自動更新する Trigger
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

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();
