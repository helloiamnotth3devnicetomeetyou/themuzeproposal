begin;

-- AI triage is advisory metadata. Keep the original workflow columns and
-- timestamps independent from classifier/read-state updates.
alter table public.contact_inquiries
  add column if not exists urgency text not null default 'normal',
  add column if not exists is_likely_spam boolean not null default false,
  add column if not exists ai_reasoning text,
  add column if not exists ai_classified_at timestamptz,
  add column if not exists read_at timestamptz,
  add column if not exists read_by uuid;

alter table public.contact_inquiries
  add column if not exists urgency_rank smallint generated always as (
    case urgency
      when 'urgent' then 4
      when 'high' then 3
      when 'normal' then 2
      when 'low' then 1
      else 0
    end::smallint
  ) stored;

alter table public.contact_inquiries
  drop constraint if exists contact_inquiries_urgency_check;
alter table public.contact_inquiries
  add constraint contact_inquiries_urgency_check
  check (urgency in ('low', 'normal', 'high', 'urgent'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.contact_inquiries'::regclass
      and conname = 'contact_inquiries_read_by_fkey'
  ) then
    alter table public.contact_inquiries
      add constraint contact_inquiries_read_by_fkey
      foreign key (read_by) references auth.users(id) on delete set null;
  end if;
end;
$$;

alter table public.protect_reports
  add column if not exists severity text not null default 'normal',
  add column if not exists ai_reasoning text,
  add column if not exists ai_classified_at timestamptz,
  add column if not exists read_at timestamptz,
  add column if not exists read_by uuid;

alter table public.protect_reports
  add column if not exists severity_rank smallint generated always as (
    case severity
      when 'critical' then 4
      when 'high' then 3
      when 'normal' then 2
      when 'low' then 1
      else 0
    end::smallint
  ) stored;

alter table public.protect_reports
  drop constraint if exists protect_reports_severity_check;
alter table public.protect_reports
  add constraint protect_reports_severity_check
  check (severity in ('low', 'normal', 'high', 'critical'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.protect_reports'::regclass
      and conname = 'protect_reports_read_by_fkey'
  ) then
    alter table public.protect_reports
      add constraint protect_reports_read_by_fkey
      foreign key (read_by) references auth.users(id) on delete set null;
  end if;
end;
$$;

create index if not exists contact_inquiries_urgency_rank_created_at_id_idx
  on public.contact_inquiries (urgency_rank desc, created_at desc, id desc);
create index if not exists contact_inquiries_ai_unclassified_idx
  on public.contact_inquiries (created_at asc, id asc)
  where ai_classified_at is null;

create index if not exists protect_reports_severity_rank_created_at_id_idx
  on public.protect_reports (severity_rank desc, created_at desc, id desc);
create index if not exists protect_reports_ai_unclassified_idx
  on public.protect_reports (created_at asc, id asc)
  where ai_classified_at is null;

-- Record operational classification/read metadata, never model reasoning or
-- submitted identity/body data. Keep this definition explicit so migration
-- behavior does not depend on pg_get_functiondef formatting.
create or replace function public.capture_admin_audit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_mode text := coalesce(tg_argv[1], 'standard');
  v_primary_key text := coalesce(tg_argv[0], 'id');
  v_row jsonb;
  v_old jsonb := '{}'::jsonb;
  v_new jsonb := '{}'::jsonb;
  v_before jsonb;
  v_after jsonb;
  v_changed_fields text[] := array[]::text[];
  v_safe_fields text[];
  v_actor_id uuid := auth.uid();
  v_actor_email text;
  v_record_id text;
  v_record_label text;
begin
  if tg_op <> 'INSERT' then v_old := to_jsonb(old) - array['created_at', 'updated_at']; end if;
  if tg_op <> 'DELETE' then v_new := to_jsonb(new) - array['created_at', 'updated_at']; end if;
  v_row := case when tg_op = 'DELETE' then v_old else v_new end;
  v_record_id := coalesce(v_row ->> v_primary_key, '');
  if v_record_id = '' then
    raise exception 'Audit target on %.% has no primary key value', tg_table_schema, tg_table_name;
  end if;
  v_record_label := case tg_table_name
    when 'contact_inquiries' then '문의 #' || upper(left(v_record_id, 8))
    when 'protect_reports' then '신고 #' || upper(left(v_record_id, 8))
    when 'audition_submissions' then '오디션 #' || upper(left(v_record_id, 8))
    when 'profiles' then '관리자 권한 #' || upper(left(v_record_id, 8))
    else coalesce(nullif(v_row ->> 'name_ko', ''), nullif(v_row ->> 'name', ''), nullif(v_row ->> 'title_ko', ''), nullif(v_row ->> 'title', ''), nullif(v_row ->> 'key', ''), nullif(v_row ->> 'slug', ''), v_record_id)
  end;

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(entry.key order by entry.key), array[]::text[]) into v_changed_fields
    from jsonb_each(v_old) as entry where (v_new -> entry.key) is distinct from entry.value;
    if cardinality(v_changed_fields) = 0 then return new; end if;
    if v_mode = 'sensitive' then
      v_safe_fields := case tg_table_name
        when 'contact_inquiries' then array['status', 'admin_note', 'answered_at', 'answered_by', 'urgency', 'is_likely_spam', 'ai_classified_at', 'read_at', 'read_by']
        when 'protect_reports' then array['status', 'admin_note', 'severity', 'ai_classified_at', 'read_at', 'read_by']
        when 'audition_submissions' then array['status', 'reviewer_notes']
        else array[]::text[]
      end;
      select coalesce(array_agg(field order by field), array[]::text[]) into v_changed_fields
      from unnest(v_changed_fields) as changed(field) where field = any(v_safe_fields);
      if cardinality(v_changed_fields) = 0 then return new; end if;
    else
      v_safe_fields := v_changed_fields;
    end if;
    select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb) into v_before
    from jsonb_each(v_old) as entry where entry.key = any(v_changed_fields) and entry.key = any(v_safe_fields);
    select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb) into v_after
    from jsonb_each(v_new) as entry where entry.key = any(v_changed_fields) and entry.key = any(v_safe_fields);
  elsif tg_op = 'INSERT' then
    v_after := v_new;
    select coalesce(array_agg(entry.key order by entry.key), array[]::text[]) into v_changed_fields from jsonb_each(v_new) as entry;
  else
    if v_mode = 'sensitive' then
      v_safe_fields := case tg_table_name
        when 'contact_inquiries' then array['id', 'category', 'inquiry_type', 'status', 'admin_note', 'answered_at', 'answered_by', 'urgency', 'is_likely_spam', 'ai_classified_at', 'read_at', 'read_by']
        when 'protect_reports' then array['id', 'report_type', 'status', 'admin_note', 'severity', 'ai_classified_at', 'read_at', 'read_by']
        when 'audition_submissions' then array['id', 'category', 'status', 'reviewer_notes']
        else array['id']
      end;
      select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb) into v_before
      from jsonb_each(v_old) as entry where entry.key = any(v_safe_fields);
    else
      v_before := v_old;
    end if;
    select coalesce(array_agg(entry.key order by entry.key), array[]::text[]) into v_changed_fields from jsonb_each(v_before) as entry;
  end if;

  begin v_actor_email := nullif(auth.jwt() ->> 'email', ''); exception when others then v_actor_email := null; end;
  if v_actor_email is null and v_actor_id is not null then
    select profile.email into v_actor_email from public.profiles as profile where profile.id = v_actor_id;
  end if;
  insert into public.admin_audit_logs (
    actor_id, actor_email, operation, table_name, record_id, record_label,
    changed_fields, before_values, after_values, transaction_id
  ) values (
    v_actor_id, v_actor_email, tg_op, tg_table_name, v_record_id, v_record_label,
    v_changed_fields, v_before, v_after, txid_current()
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.capture_admin_audit() from public, anon, authenticated, service_role;

-- Only workflow transitions advance updated_at. AI and read metadata writes do
-- not invalidate the optimistic-lock version used by review workflows.
drop trigger if exists contact_inquiries_set_updated_at on public.contact_inquiries;
create trigger contact_inquiries_set_updated_at
  before update of status, admin_note, answered_at, answered_by
  on public.contact_inquiries
  for each row execute function public.set_updated_at();

drop trigger if exists protect_reports_set_updated_at on public.protect_reports;
create trigger protect_reports_set_updated_at
  before update of status, admin_note
  on public.protect_reports
  for each row execute function public.set_updated_at();

-- Keep the old two-argument read path for existing clients while exposing the
-- severity filter to the updated admin UI.
drop function if exists public.get_admin_protect_reports(text, text, text);
create function public.get_admin_protect_reports(
  p_status text default null,
  p_search text default null,
  p_severity text default null
) returns setof public.protect_reports
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_search text := nullif(btrim(p_search), '');
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  if p_status is not null and p_status not in ('pending', 'reviewing', 'resolved', 'rejected') then
    raise exception 'invalid report status' using errcode = '22023';
  end if;
  if p_severity is not null and p_severity not in ('low', 'normal', 'high', 'critical') then
    raise exception 'invalid report severity' using errcode = '22023';
  end if;

  return query
  select report.*
  from public.protect_reports as report
  where (p_status is null or report.status = p_status)
    and (p_severity is null or report.severity = p_severity)
    and (
      v_search is null
      or position(lower(v_search) in lower(coalesce(report.title, ''))) > 0
      or position(lower(v_search) in lower(coalesce(report.reporter_email, ''))) > 0
      or position(lower(v_search) in lower(coalesce(report.author_name, ''))) > 0
      or position(lower(v_search) in lower(coalesce(report.platform, ''))) > 0
      or position(lower(v_search) in lower(coalesce(report.content, ''))) > 0
    )
  order by report.severity_rank desc, report.created_at desc, report.id desc;
end;
$$;

drop function if exists public.get_admin_protect_reports(text, text);
create function public.get_admin_protect_reports(
  p_status text default null,
  p_search text default null
) returns setof public.protect_reports
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  return query
  select * from public.get_admin_protect_reports(p_status, p_search, null);
end;
$$;

revoke all on function public.get_admin_protect_reports(text, text, text) from public, anon;
revoke all on function public.get_admin_protect_reports(text, text) from public, anon;
grant execute on function public.get_admin_protect_reports(text, text, text) to authenticated, service_role;
grant execute on function public.get_admin_protect_reports(text, text) to authenticated, service_role;

-- Marking a row read is deliberately idempotent: the first administrator wins,
-- and later opens do not rewrite the original reader or timestamp.
create or replace function public.mark_contact_inquiry_read(p_inquiry_id uuid)
returns table (id uuid, read_at timestamptz, read_by uuid)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_read_at timestamptz;
  v_read_by uuid;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select inquiry.read_at, inquiry.read_by
    into v_read_at, v_read_by
  from public.contact_inquiries as inquiry
  where inquiry.id = p_inquiry_id
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_read_at is null then
    update public.contact_inquiries as inquiry
    set read_at = clock_timestamp(), read_by = auth.uid()
    where inquiry.id = p_inquiry_id
    returning inquiry.read_at, inquiry.read_by into v_read_at, v_read_by;
  end if;

  return query select p_inquiry_id, v_read_at, v_read_by;
end;
$$;

create or replace function public.mark_protect_report_read(p_report_id uuid)
returns table (id uuid, read_at timestamptz, read_by uuid)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_read_at timestamptz;
  v_read_by uuid;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select report.read_at, report.read_by
    into v_read_at, v_read_by
  from public.protect_reports as report
  where report.id = p_report_id
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_read_at is null then
    update public.protect_reports as report
    set read_at = clock_timestamp(), read_by = auth.uid()
    where report.id = p_report_id
    returning report.read_at, report.read_by into v_read_at, v_read_by;
  end if;

  return query select p_report_id, v_read_at, v_read_by;
end;
$$;

revoke all on function public.mark_contact_inquiry_read(uuid) from public, anon, service_role;
revoke all on function public.mark_protect_report_read(uuid) from public, anon, service_role;
grant execute on function public.mark_contact_inquiry_read(uuid) to authenticated;
grant execute on function public.mark_protect_report_read(uuid) to authenticated;

create or replace function public.get_admin_unclassified_counts()
returns table (contact_count bigint, protect_count bigint)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from public.contact_inquiries where ai_classified_at is null),
    (select count(*) from public.protect_reports where ai_classified_at is null);
end;
$$;

revoke all on function public.get_admin_unclassified_counts() from public, anon, service_role;
grant execute on function public.get_admin_unclassified_counts() to authenticated;

-- Browser roles may review only through the existing workflow RPCs and may not
-- forge classifier/read state. Service-role retains its existing server grant.
revoke update (
  urgency, is_likely_spam, ai_reasoning, ai_classified_at, read_at, read_by
) on public.contact_inquiries from public, anon, authenticated;
revoke update (
  severity, ai_reasoning, ai_classified_at, read_at, read_by
) on public.protect_reports from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;
