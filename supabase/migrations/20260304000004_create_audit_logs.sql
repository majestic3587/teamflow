-- =============================================
-- entity_type / event_type enum
-- (既存 DB では entity_type / event_type として定義済み)
-- =============================================

create type public.entity_type as enum (
  'task',
  'project',
  'workspace',
  'comment'
);

create type public.event_type as enum (
  'CREATED',
  'UPDATED',
  'APPROVED',
  'REJECTED',
  'DELETED',
  'DUE_DATE_CHANGED'
);

-- =============================================
-- audit_logs テーブル
-- =============================================

create table public.audit_logs (
  id           uuid               primary key default gen_random_uuid(),
  workspace_id uuid               not null references public.workspaces (id) on delete cascade,
  entity_type  public.entity_type not null,
  entity_id    uuid               not null,
  event_type   public.event_type  not null,
  actor_id     uuid               references auth.users (id) on delete set null,
  metadata     jsonb,
  created_at   timestamptz        not null default now()
);

create index audit_logs_workspace_id_idx on public.audit_logs (workspace_id, created_at desc);

alter table public.audit_logs enable row level security;

-- SELECT: ワークスペースメンバーのみ
create policy "audit_logs: select for workspace members"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = audit_logs.workspace_id
        and wm.user_id = auth.uid()
    )
  );

-- =============================================
-- 内部ヘルパー (SECURITY DEFINER で RLS をバイパス)
-- metadata には entity_name など任意の情報を格納する
-- =============================================

create or replace function public.insert_audit_log(
  p_workspace_id uuid,
  p_entity_type  public.entity_type,
  p_entity_id    uuid,
  p_event_type   public.event_type,
  p_metadata     jsonb default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (workspace_id, entity_type, entity_id, event_type, actor_id, metadata)
  values (p_workspace_id, p_entity_type, p_entity_id, p_event_type, auth.uid(), p_metadata);
end;
$$;

-- =============================================
-- tasks トリガー
-- =============================================

create or replace function public.handle_task_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    perform public.insert_audit_log(
      NEW.workspace_id, 'task'::public.entity_type, NEW.id, 'CREATED'::public.event_type,
      jsonb_build_object('entity_name', NEW.title)
    );

  elsif TG_OP = 'DELETE' then
    perform public.insert_audit_log(
      OLD.workspace_id, 'task'::public.entity_type, OLD.id, 'DELETED'::public.event_type,
      jsonb_build_object('entity_name', OLD.title)
    );

  elsif TG_OP = 'UPDATE' then
    if OLD.approval_status is distinct from NEW.approval_status then
      if NEW.approval_status = 'APPROVED' then
        perform public.insert_audit_log(
          NEW.workspace_id, 'task'::public.entity_type, NEW.id, 'APPROVED'::public.event_type,
          jsonb_build_object('entity_name', NEW.title)
        );
      elsif NEW.approval_status = 'REJECTED' then
        perform public.insert_audit_log(
          NEW.workspace_id, 'task'::public.entity_type, NEW.id, 'REJECTED'::public.event_type,
          jsonb_build_object('entity_name', NEW.title)
        );
      end if;
    end if;

    if OLD.due_date is distinct from NEW.due_date then
      perform public.insert_audit_log(
        NEW.workspace_id, 'task'::public.entity_type, NEW.id, 'DUE_DATE_CHANGED'::public.event_type,
        jsonb_build_object('entity_name', NEW.title)
      );
    end if;

    if (OLD.title              is distinct from NEW.title
     or OLD.assignee_id        is distinct from NEW.assignee_id
     or OLD.work_status        is distinct from NEW.work_status
     or OLD.definition_of_done is distinct from NEW.definition_of_done)
    then
      perform public.insert_audit_log(
        NEW.workspace_id, 'task'::public.entity_type, NEW.id, 'UPDATED'::public.event_type,
        jsonb_build_object('entity_name', NEW.title)
      );
    end if;
  end if;

  return null;
end;
$$;

create trigger tasks_audit_trigger
  after insert or update or delete on public.tasks
  for each row execute function public.handle_task_audit();

-- =============================================
-- projects トリガー
-- =============================================

create or replace function public.handle_project_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    perform public.insert_audit_log(
      NEW.workspace_id, 'project'::public.entity_type, NEW.id, 'CREATED'::public.event_type,
      jsonb_build_object('entity_name', NEW.name)
    );
  elsif TG_OP = 'DELETE' then
    perform public.insert_audit_log(
      OLD.workspace_id, 'project'::public.entity_type, OLD.id, 'DELETED'::public.event_type,
      jsonb_build_object('entity_name', OLD.name)
    );
  elsif TG_OP = 'UPDATE' then
    perform public.insert_audit_log(
      NEW.workspace_id, 'project'::public.entity_type, NEW.id, 'UPDATED'::public.event_type,
      jsonb_build_object('entity_name', NEW.name)
    );
  end if;

  return null;
end;
$$;

create trigger projects_audit_trigger
  after insert or update or delete on public.projects
  for each row execute function public.handle_project_audit();

-- =============================================
-- workspaces トリガー
-- =============================================

create or replace function public.handle_workspace_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    perform public.insert_audit_log(
      NEW.id, 'workspace'::public.entity_type, NEW.id, 'CREATED'::public.event_type,
      jsonb_build_object('entity_name', NEW.name)
    );
  elsif TG_OP = 'DELETE' then
    perform public.insert_audit_log(
      OLD.id, 'workspace'::public.entity_type, OLD.id, 'DELETED'::public.event_type,
      jsonb_build_object('entity_name', OLD.name)
    );
  elsif TG_OP = 'UPDATE' then
    perform public.insert_audit_log(
      NEW.id, 'workspace'::public.entity_type, NEW.id, 'UPDATED'::public.event_type,
      jsonb_build_object('entity_name', NEW.name)
    );
  end if;

  return null;
end;
$$;

create trigger workspaces_audit_trigger
  after insert or update or delete on public.workspaces
  for each row execute function public.handle_workspace_audit();

-- =============================================
-- task_comments トリガー
-- =============================================

create or replace function public.handle_comment_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  if TG_OP = 'DELETE' then
    select t.workspace_id into v_workspace_id
      from public.tasks t where t.id = OLD.task_id;
    perform public.insert_audit_log(
      v_workspace_id, 'comment'::public.entity_type, OLD.id, 'DELETED'::public.event_type,
      jsonb_build_object('entity_name', left(OLD.body, 50))
    );
    return null;
  end if;

  select t.workspace_id into v_workspace_id
    from public.tasks t where t.id = NEW.task_id;

  if TG_OP = 'INSERT' then
    perform public.insert_audit_log(
      v_workspace_id, 'comment'::public.entity_type, NEW.id, 'CREATED'::public.event_type,
      jsonb_build_object('entity_name', left(NEW.body, 50))
    );
  elsif TG_OP = 'UPDATE' then
    perform public.insert_audit_log(
      v_workspace_id, 'comment'::public.entity_type, NEW.id, 'UPDATED'::public.event_type,
      jsonb_build_object('entity_name', left(NEW.body, 50))
    );
  end if;

  return null;
end;
$$;

create trigger task_comments_audit_trigger
  after insert or update or delete on public.task_comments
  for each row execute function public.handle_comment_audit();

-- =============================================
-- get_audit_logs RPC
-- auth.users と JOIN して actor_display_name を解決し metadata も返す
-- =============================================

create or replace function public.get_audit_logs(
  p_workspace_id uuid
)
returns table (
  id                 uuid,
  workspace_id       uuid,
  entity_type        public.entity_type,
  entity_id          uuid,
  event_type         public.event_type,
  actor_id           uuid,
  actor_display_name text,
  metadata           jsonb,
  created_at         timestamptz
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
    raise exception 'not a member of this workspace';
  end if;

  return query
    select
      al.id,
      al.workspace_id,
      al.entity_type,
      al.entity_id,
      al.event_type,
      al.actor_id,
      coalesce(
        u.raw_user_meta_data->>'display_name',
        u.email
      ) as actor_display_name,
      -- metadata に entity_name がない場合は entity_id から動的に解決する
      case
        when al.metadata is not null and al.metadata->>'entity_name' is not null
          then al.metadata
        when al.entity_type = 'task'
          then jsonb_build_object('entity_name', (select t.title     from public.tasks         t where t.id = al.entity_id))
        when al.entity_type = 'project'
          then jsonb_build_object('entity_name', (select p.name      from public.projects       p where p.id = al.entity_id))
        when al.entity_type = 'workspace'
          then jsonb_build_object('entity_name', (select w.name      from public.workspaces     w where w.id = al.entity_id))
        when al.entity_type = 'comment'
          then jsonb_build_object('entity_name', (select left(c.body, 50) from public.task_comments c where c.id = al.entity_id))
        else al.metadata
      end as metadata,
      al.created_at
    from public.audit_logs al
    left join auth.users u on u.id = al.actor_id
    where al.workspace_id = p_workspace_id
    order by al.created_at desc;
end;
$$;
