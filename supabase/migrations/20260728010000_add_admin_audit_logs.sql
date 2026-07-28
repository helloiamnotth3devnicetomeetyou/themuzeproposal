begin;

-- The legacy admin workspace still reads and updates audition submissions, but
-- the table was missing from the production baseline. Keep submissions closed
-- to the public until a public application flow is restored.
create table if not exists public.audition_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth text,
  gender text,
  contact text,
  email text,
  category text,
  intro text,
  link text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewing', 'accepted', 'rejected')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists audition_submissions_created_at_index
  on public.audition_submissions (created_at desc);

drop trigger if exists audition_submissions_set_updated_at on public.audition_submissions;
create trigger audition_submissions_set_updated_at
  before update on public.audition_submissions
  for each row execute function public.set_updated_at();

alter table public.audition_submissions enable row level security;

drop policy if exists "admins read audition submissions" on public.audition_submissions;
create policy "admins read audition submissions"
  on public.audition_submissions
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins update audition submissions" on public.audition_submissions;
create policy "admins update audition submissions"
  on public.audition_submissions
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.audition_submissions from public, anon, authenticated;
grant select, update on table public.audition_submissions to authenticated;
grant select, update on table public.audition_submissions to service_role;

create table public.admin_audit_logs (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default clock_timestamp(),
  actor_id uuid,
  actor_email text,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  table_name text not null,
  record_id text not null,
  record_label text not null,
  changed_fields text[] not null default array[]::text[],
  before_values jsonb,
  after_values jsonb,
  transaction_id bigint not null default txid_current()
);

comment on table public.admin_audit_logs is
  'Append-only administrator data-change audit trail. No automatic retention policy.';
comment on column public.admin_audit_logs.before_values is
  'Changed values only for updates; safe row snapshot for deletes.';
comment on column public.admin_audit_logs.after_values is
  'Changed values only for updates; row snapshot for inserts.';

create index admin_audit_logs_occurred_at_index
  on public.admin_audit_logs (occurred_at desc, id desc);
create index admin_audit_logs_actor_index
  on public.admin_audit_logs (actor_id, occurred_at desc);
create index admin_audit_logs_target_index
  on public.admin_audit_logs (table_name, record_id, occurred_at desc);
create index admin_audit_logs_operation_index
  on public.admin_audit_logs (operation, occurred_at desc);

alter table public.admin_audit_logs enable row level security;

create policy "admins read audit logs"
  on public.admin_audit_logs
  for select
  to authenticated
  using (public.is_admin());

revoke all on table public.admin_audit_logs from public, anon, authenticated, service_role;
grant select on table public.admin_audit_logs to authenticated, service_role;

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
  if tg_op <> 'INSERT' then
    v_old := to_jsonb(old) - array['created_at', 'updated_at'];
  end if;

  if tg_op <> 'DELETE' then
    v_new := to_jsonb(new) - array['created_at', 'updated_at'];
  end if;

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
    else coalesce(
      nullif(v_row ->> 'name_ko', ''),
      nullif(v_row ->> 'name', ''),
      nullif(v_row ->> 'title_ko', ''),
      nullif(v_row ->> 'title', ''),
      nullif(v_row ->> 'key', ''),
      nullif(v_row ->> 'slug', ''),
      v_record_id
    )
  end;

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(entry.key order by entry.key), array[]::text[])
      into v_changed_fields
    from jsonb_each(v_old) as entry
    where (v_new -> entry.key) is distinct from entry.value;

    if cardinality(v_changed_fields) = 0 then
      return new;
    end if;

    if v_mode = 'sensitive' then
      v_safe_fields := case tg_table_name
        when 'contact_inquiries' then array['status', 'admin_note']
        when 'protect_reports' then array['status', 'admin_note']
        when 'audition_submissions' then array['status', 'notes']
        else array[]::text[]
      end;
    else
      v_safe_fields := v_changed_fields;
    end if;

    select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
      into v_before
    from jsonb_each(v_old) as entry
    where entry.key = any(v_changed_fields)
      and entry.key = any(v_safe_fields);

    select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
      into v_after
    from jsonb_each(v_new) as entry
    where entry.key = any(v_changed_fields)
      and entry.key = any(v_safe_fields);
  elsif tg_op = 'INSERT' then
    v_after := v_new;
    select coalesce(array_agg(entry.key order by entry.key), array[]::text[])
      into v_changed_fields
    from jsonb_each(v_new) as entry;
  else
    if v_mode = 'sensitive' then
      v_safe_fields := case tg_table_name
        when 'contact_inquiries' then array['id', 'category', 'inquiry_type', 'status', 'admin_note']
        when 'protect_reports' then array['id', 'report_type', 'status', 'admin_note']
        when 'audition_submissions' then array['id', 'category', 'status', 'notes']
        else array['id']
      end;

      select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
        into v_before
      from jsonb_each(v_old) as entry
      where entry.key = any(v_safe_fields);
    else
      v_before := v_old;
    end if;

    select coalesce(array_agg(entry.key order by entry.key), array[]::text[])
      into v_changed_fields
    from jsonb_each(v_before) as entry;
  end if;

  begin
    v_actor_email := nullif(auth.jwt() ->> 'email', '');
  exception when others then
    v_actor_email := null;
  end;

  if v_actor_email is null and v_actor_id is not null then
    select profile.email
      into v_actor_email
    from public.profiles as profile
    where profile.id = v_actor_id;
  end if;

  insert into public.admin_audit_logs (
    actor_id,
    actor_email,
    operation,
    table_name,
    record_id,
    record_label,
    changed_fields,
    before_values,
    after_values,
    transaction_id
  ) values (
    v_actor_id,
    v_actor_email,
    tg_op,
    tg_table_name,
    v_record_id,
    v_record_label,
    v_changed_fields,
    v_before,
    v_after,
    txid_current()
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.capture_admin_audit() from public, anon, authenticated, service_role;

drop trigger if exists albums_admin_audit on public.albums;
create trigger albums_admin_audit after insert or update or delete on public.albums
  for each row execute function public.capture_admin_audit('id', 'standard');

drop trigger if exists artist_gallery_admin_audit on public.artist_gallery;
create trigger artist_gallery_admin_audit after insert or update or delete on public.artist_gallery
  for each row execute function public.capture_admin_audit('id', 'standard');

drop trigger if exists artist_members_admin_audit on public.artist_members;
create trigger artist_members_admin_audit after insert or update or delete on public.artist_members
  for each row execute function public.capture_admin_audit('id', 'standard');

drop trigger if exists artist_scene_members_admin_audit on public.artist_scene_members;
create trigger artist_scene_members_admin_audit after insert or update or delete on public.artist_scene_members
  for each row execute function public.capture_admin_audit('id', 'standard');

drop trigger if exists artist_scenes_admin_audit on public.artist_scenes;
create trigger artist_scenes_admin_audit after insert or update or delete on public.artist_scenes
  for each row execute function public.capture_admin_audit('id', 'standard');

drop trigger if exists artist_schedules_admin_audit on public.artist_schedules;
create trigger artist_schedules_admin_audit after insert or update or delete on public.artist_schedules
  for each row execute function public.capture_admin_audit('id', 'standard');

drop trigger if exists artists_admin_audit on public.artists;
create trigger artists_admin_audit after insert or update or delete on public.artists
  for each row execute function public.capture_admin_audit('id', 'standard');

drop trigger if exists home_hero_slides_admin_audit on public.home_hero_slides;
create trigger home_hero_slides_admin_audit after insert or update or delete on public.home_hero_slides
  for each row execute function public.capture_admin_audit('id', 'standard');

drop trigger if exists notices_admin_audit on public.notices;
create trigger notices_admin_audit after insert or update or delete on public.notices
  for each row execute function public.capture_admin_audit('id', 'standard');

drop trigger if exists site_settings_admin_audit on public.site_settings;
create trigger site_settings_admin_audit after insert or update or delete on public.site_settings
  for each row execute function public.capture_admin_audit('key', 'standard');

drop trigger if exists tracks_admin_audit on public.tracks;
create trigger tracks_admin_audit after insert or update or delete on public.tracks
  for each row execute function public.capture_admin_audit('id', 'standard');

drop trigger if exists contact_inquiries_admin_audit on public.contact_inquiries;
create trigger contact_inquiries_admin_audit after update or delete on public.contact_inquiries
  for each row execute function public.capture_admin_audit('id', 'sensitive');

drop trigger if exists protect_reports_admin_audit on public.protect_reports;
create trigger protect_reports_admin_audit after update or delete on public.protect_reports
  for each row execute function public.capture_admin_audit('id', 'sensitive');

drop trigger if exists audition_submissions_admin_audit on public.audition_submissions;
create trigger audition_submissions_admin_audit after update or delete on public.audition_submissions
  for each row execute function public.capture_admin_audit('id', 'sensitive');

drop trigger if exists profiles_admin_role_audit on public.profiles;
create trigger profiles_admin_role_audit
  after update of is_admin on public.profiles
  for each row
  when (old.is_admin is distinct from new.is_admin)
  execute function public.capture_admin_audit('id', 'standard');

commit;
