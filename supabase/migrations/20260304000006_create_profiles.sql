-- =============================================
-- profiles テーブル
-- =============================================

create table public.profiles (
  id           uuid        primary key references auth.users (id) on delete cascade,
  display_name text        not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ログイン済みユーザーは全プロフィールを参照可能（担当者名表示のため）
create policy "profiles: select for authenticated"
  on public.profiles for select
  using (auth.uid() is not null);

-- 自分自身のプロフィールのみ更新可能
create policy "profiles: update own profile"
  on public.profiles for update
  using  (auth.uid() = id)
  with check (auth.uid() = id);

-- =============================================
-- 既存ユーザーを profiles へ一括投入
-- =============================================

insert into public.profiles (id, display_name, created_at, updated_at)
select
  id,
  coalesce(
    nullif(raw_user_meta_data->>'display_name', ''),
    split_part(email::text, '@', 1)
  ) as display_name,
  created_at,
  coalesce(updated_at, created_at)
from auth.users
on conflict (id) do nothing;

-- =============================================
-- 新規ユーザーサインアップ時に自動 INSERT するトリガー
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
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      split_part(new.email::text, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- =============================================
-- updated_at 自動更新トリガー
-- =============================================

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();
