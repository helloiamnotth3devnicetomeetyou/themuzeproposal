begin;

-- Retention deletes are deliberately two-phase. The server reserves every
-- referenced object, deletes those objects from R2, then calls the finalizer.
-- Keeping this row after an R2 failure makes the operation retryable without
-- exposing submitted body/evidence to the admin UI.
create table if not exists public.retention_deletion_jobs (
  kind text not null,
  record_id uuid not null,
  record_created_at timestamptz not null,
  reservation_id uuid not null,
  actor_id uuid,
  status text not null default 'reserved',
  object_paths jsonb not null default '[]'::jsonb,
  attempts integer not null default 1,
  last_error_code text,
  reserved_at timestamptz not null default now(),
  objects_deleted_at timestamptz,
  completed_at timestamptz,
  constraint retention_deletion_jobs_pkey primary key (kind, record_id),
  constraint retention_deletion_jobs_kind_check
    check (kind in ('contact_inquiry', 'protect_report')),
  constraint retention_deletion_jobs_status_check
    check (status in ('reserved', 'failed', 'objects_deleted', 'completed')),
  constraint retention_deletion_jobs_paths_check
    check (jsonb_typeof(object_paths) = 'array'),
  constraint retention_deletion_jobs_attempts_check check (attempts > 0),
  constraint retention_deletion_jobs_error_check
    check (last_error_code is null or last_error_code ~ '^[a-z0-9_:-]{1,80}$')
);

create unique index if not exists retention_deletion_jobs_reservation_id_idx
  on public.retention_deletion_jobs (reservation_id);
create index if not exists retention_deletion_jobs_status_idx
  on public.retention_deletion_jobs (status, reserved_at);

alter table public.retention_deletion_jobs enable row level security;
revoke all on table public.retention_deletion_jobs from public, anon, authenticated;
grant all on table public.retention_deletion_jobs to service_role;

comment on table public.retention_deletion_jobs is
  'Two-phase 30-day retention deletion state; object_paths contain private storage paths only.';

-- Do not allow a review/save request to replace a record or its evidence while
-- its retention job is recoverable. The finalizer opts into the narrow
-- transaction-local setting below.
create or replace function public.reject_reserved_retention_update()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_record_id uuid;
begin
  if current_setting('app.retention_purge', true) = 'true' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_table_name = 'protect_report_attachments' then
    v_record_id := new.report_id;
    if exists (
      select 1 from public.retention_deletion_jobs as job
      where job.kind = 'protect_report'
        and job.record_id = v_record_id
        and job.status in ('reserved', 'failed', 'objects_deleted')
    ) then
      raise exception 'record is reserved for retention deletion' using errcode = '55P03';
    end if;
  elsif exists (
    select 1 from public.retention_deletion_jobs as job
    where job.kind = case tg_table_name
      when 'contact_inquiries' then 'contact_inquiry'
      when 'protect_reports' then 'protect_report'
    end
      and job.record_id = new.id
      and job.status in ('reserved', 'failed', 'objects_deleted')
  ) then
    raise exception 'record is reserved for retention deletion' using errcode = '55P03';
  end if;

  return new;
end;
$$;

create or replace function public.retry_retention_deletion(
  p_kind text,
  p_id uuid,
  p_actor_id uuid,
  p_reservation_id uuid,
  p_objects_deleted boolean
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_job public.retention_deletion_jobs%rowtype;
begin
  if p_kind not in ('contact_inquiry', 'protect_report')
    or p_id is null or p_reservation_id is null then
    raise exception 'invalid retention retry request' using errcode = '22023';
  end if;
  if p_actor_id is not null and not exists (select 1 from public.profiles where id = p_actor_id and role = 'super_admin') then
    raise exception 'super administrator access required' using errcode = '42501';
  end if;
  select * into v_job from public.retention_deletion_jobs
  where kind = p_kind and record_id = p_id for update;
  if not found or v_job.reservation_id <> p_reservation_id then
    raise exception 'retention deletion reservation not found' using errcode = '55P03';
  end if;
  if v_job.status = 'completed' then return; end if;
  if p_objects_deleted then
    update public.retention_deletion_jobs
    set status = 'objects_deleted',
        objects_deleted_at = coalesce(objects_deleted_at, now()),
        last_error_code = null
    where kind = p_kind and record_id = p_id;
  else
    update public.retention_deletion_jobs
    set status = 'failed', last_error_code = 'r2_delete_failed'
    where kind = p_kind and record_id = p_id;
  end if;
end;
$$;

create or replace function public.finalize_retention_deletion(
  p_kind text,
  p_id uuid,
  p_actor_id uuid,
  p_reservation_id uuid,
  p_objects_deleted boolean
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_job public.retention_deletion_jobs%rowtype;
  v_table_name text;
begin
  if p_kind not in ('contact_inquiry', 'protect_report')
    or p_id is null or p_reservation_id is null
    or not p_objects_deleted then
    raise exception 'invalid retention finalization request' using errcode = '22023';
  end if;
  if p_actor_id is not null and not exists (select 1 from public.profiles where id = p_actor_id and role = 'super_admin') then
    raise exception 'super administrator access required' using errcode = '42501';
  end if;
  select * into v_job from public.retention_deletion_jobs
  where kind = p_kind and record_id = p_id for update;
  if not found or v_job.reservation_id <> p_reservation_id then
    raise exception 'retention deletion reservation not found' using errcode = '55P03';
  end if;
  if v_job.status = 'completed' then return; end if;
  if v_job.status <> 'objects_deleted' then
    raise exception 'R2 deletion has not been confirmed' using errcode = '55P03';
  end if;

  v_table_name := case p_kind when 'contact_inquiry' then 'contact_inquiries' else 'protect_reports' end;
  -- Existing sensitive audit triggers omit submitted payloads. The
  -- explicit row below is the retention audit contract: only metadata.
  perform set_config('app.retention_purge', 'true', true);
  if p_kind = 'contact_inquiry' then
    delete from public.contact_inquiries where id = p_id;
  else
    delete from public.protect_reports where id = p_id;
  end if;

  insert into public.admin_audit_logs (
    actor_id, actor_email, operation, table_name, record_id, record_label,
    changed_fields, before_values, after_values, transaction_id
  ) values (
    p_actor_id, null, 'DELETE', v_table_name, p_id::text, 'retention deletion',
    array['retention_days', 'record_created_at', 'object_count', 'actor_id'],
    jsonb_build_object(
      'retention_days', 30,
      'record_created_at', v_job.record_created_at,
      'object_count', jsonb_array_length(v_job.object_paths),
      'actor_id', p_actor_id
    ), null, txid_current()
  );

  delete from public.asset_registry where reservation_id = p_reservation_id;
  update public.retention_deletion_jobs
  set status = 'completed', completed_at = now(), last_error_code = null
  where kind = p_kind and record_id = p_id;
end;
$$;

-- This is intentionally service-only. A scheduler can retry both an R2
-- failure and a DB-finalization failure; objects_deleted never asks the caller
-- to download/read an object again.
create or replace function public.get_retention_recovery_jobs(p_limit integer default 100)
returns setof public.retention_deletion_jobs
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select job.*
  from public.retention_deletion_jobs as job
  where job.status in ('reserved', 'failed', 'objects_deleted')
  order by job.reserved_at asc, job.kind, job.record_id
  limit least(greatest(coalesce(p_limit, 100), 1), 200);
$$;

create or replace function public.get_retention_orphan_assets(p_limit integer default 100)
returns table (reservation_id uuid, bucket text, path text, reserved_at timestamptz)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select asset.reservation_id, asset.bucket, asset.path, asset.reserved_at
  from public.asset_registry as asset
  where asset.bucket in ('contact-attachments', 'protect-evidence')
    and asset.reservation_id is not null
    and not exists (
      select 1 from public.retention_deletion_jobs as job
      where job.reservation_id = asset.reservation_id
    )
  order by asset.reserved_at asc, asset.bucket, asset.path
  limit least(greatest(coalesce(p_limit, 100), 1), 200);
$$;

create or replace function public.release_retention_orphan_assets(
  p_reservation_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_count integer;
begin
  if p_reservation_ids is null or cardinality(p_reservation_ids) < 1 or cardinality(p_reservation_ids) > 100 then
    raise exception 'invalid orphan reservation request' using errcode = '22023';
  end if;
  delete from public.asset_registry
  where reservation_id = any(p_reservation_ids)
    and bucket in ('contact-attachments', 'protect-evidence');
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Reserve one record at a time because the storage operation is performed by
-- the server between these RPCs. A null actor is reserved for trusted
-- service-role scheduler/orphan-recovery calls; browser callers cannot execute
-- any retention RPC.
create or replace function public.reserve_retention_deletion(
  p_kind text,
  p_id uuid,
  p_actor_id uuid,
  p_reservation_id uuid
)
returns table (bucket text, path text)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_job public.retention_deletion_jobs%rowtype;
  v_created_at timestamptz;
  v_paths jsonb;
  v_object jsonb;
  v_bucket text;
  v_path text;
begin
  if p_kind not in ('contact_inquiry', 'protect_report')
    or p_id is null or p_reservation_id is null then
    raise exception 'invalid retention deletion request' using errcode = '22023';
  end if;
  if p_actor_id is not null and not exists (
    select 1 from public.profiles where id = p_actor_id and role = 'super_admin'
  ) then
    raise exception 'super administrator access required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('retention' || chr(31) || p_kind || chr(31) || p_id::text, 0));

  if p_kind = 'contact_inquiry' then
    select inquiry.created_at,
      case when inquiry.attachment_path is null then '[]'::jsonb
        else jsonb_build_array(jsonb_build_object('bucket', 'contact-attachments', 'path', inquiry.attachment_path)) end
    into v_created_at, v_paths
    from public.contact_inquiries as inquiry
    where inquiry.id = p_id;
  else
    select report.created_at,
      coalesce((select jsonb_agg(jsonb_build_object('bucket', 'protect-evidence', 'path', attachment.file_path) order by attachment.file_path)
        from public.protect_report_attachments as attachment where attachment.report_id = report.id), '[]'::jsonb)
    into v_created_at, v_paths
    from public.protect_reports as report
    where report.id = p_id;
  end if;
  if v_created_at is null then
    raise exception 'retention record not found' using errcode = 'P0002';
  end if;
  if v_created_at > now() - interval '30 days' then
    raise exception 'record is not past its 30-day retention period' using errcode = '22023';
  end if;

  select * into v_job
  from public.retention_deletion_jobs as job
  where job.kind = p_kind and job.record_id = p_id
  for update;

  if found then
    if v_job.status = 'completed' then
      raise exception 'retention record is already deleted' using errcode = 'P0002';
    end if;
    if v_job.status = 'objects_deleted' then
      update public.retention_deletion_jobs
      set reservation_id = p_reservation_id,
          actor_id = coalesce(p_actor_id, actor_id),
          reserved_at = now(),
          last_error_code = null
      where kind = p_kind and record_id = p_id;
      update public.asset_registry
      set reservation_id = p_reservation_id,
          reserved_by = p_actor_id,
          reserved_at = now(),
          expires_at = 'infinity'::timestamptz
      where reservation_id = v_job.reservation_id;
      return;
    end if;
    v_paths := v_job.object_paths;
    update public.retention_deletion_jobs
    set reservation_id = p_reservation_id,
        actor_id = coalesce(p_actor_id, actor_id),
        status = 'reserved',
        reserved_at = now(),
        attempts = attempts + 1,
        last_error_code = null
    where kind = p_kind and record_id = p_id;
    update public.asset_registry
    set reservation_id = p_reservation_id,
        reserved_by = p_actor_id,
        reserved_at = now(),
        expires_at = 'infinity'::timestamptz
    where reservation_id = v_job.reservation_id;
  else
    insert into public.retention_deletion_jobs (
      kind, record_id, record_created_at, reservation_id, actor_id,
      status, object_paths
    ) values (
      p_kind, p_id, v_created_at, p_reservation_id, p_actor_id,
      'reserved', v_paths
    );
  end if;

  for v_object in
    select value from jsonb_array_elements(v_paths) as entry(value)
  loop
    v_bucket := v_object ->> 'bucket';
    v_path := v_object ->> 'path';
    if v_bucket not in ('contact-attachments', 'protect-evidence')
      or v_path is null
      or v_path !~ '^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.[a-zA-Z0-9]+$' then
      raise exception 'invalid retention asset path' using errcode = '22023';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(v_bucket || chr(31) || v_path, 0));
    if exists (
      select 1 from public.asset_registry as asset
      where asset.bucket = v_bucket and asset.path = v_path
        and asset.reservation_id is distinct from p_reservation_id
    ) then
      raise exception 'asset deletion already reserved' using errcode = '55P03';
    end if;
    insert into public.asset_registry (
      bucket, path, status, reserved_by, reservation_id, reserved_at, expires_at
    ) values (
      v_bucket, v_path, 'deleting', p_actor_id, p_reservation_id, now(), 'infinity'::timestamptz
    ) on conflict (bucket, path) do update
      set reserved_by = excluded.reserved_by,
          reservation_id = excluded.reservation_id,
          reserved_at = excluded.reserved_at,
          expires_at = excluded.expires_at;
  end loop;

  return query
  select value ->> 'bucket', value ->> 'path'
  from jsonb_array_elements(v_paths) as entry(value);
end;
$$;


drop trigger if exists reject_reserved_retention_update on public.contact_inquiries;
create trigger reject_reserved_retention_update
  before insert or update on public.contact_inquiries
  for each row execute function public.reject_reserved_retention_update();
drop trigger if exists reject_reserved_retention_update on public.protect_reports;
create trigger reject_reserved_retention_update
  before insert or update on public.protect_reports
  for each row execute function public.reject_reserved_retention_update();
drop trigger if exists reject_reserved_retention_update on public.protect_report_attachments;
create trigger reject_reserved_retention_update
  before insert or update on public.protect_report_attachments
  for each row execute function public.reject_reserved_retention_update();

-- Suppress the normal sensitive row snapshot only during the finalizer. This
-- keeps the retention audit limited to the explicit metadata row below while
-- preserving ordinary review audit behavior.
drop trigger if exists contact_inquiries_admin_audit on public.contact_inquiries;
create trigger contact_inquiries_admin_audit
  after delete or update on public.contact_inquiries
  for each row
  when (current_setting('app.retention_purge', true) is distinct from 'true')
  execute function public.capture_admin_audit('id', 'sensitive');

drop trigger if exists protect_reports_admin_audit on public.protect_reports;
create trigger protect_reports_admin_audit
  after delete or update on public.protect_reports
  for each row
  when (current_setting('app.retention_purge', true) is distinct from 'true')
  execute function public.capture_admin_audit('id', 'sensitive');

revoke all on function public.reject_reserved_retention_update() from public, anon, authenticated, service_role;

create or replace function public.get_retention_candidates(p_limit integer default 100)
returns table (
  kind text,
  id uuid,
  created_at timestamptz,
  expires_at timestamptz,
  attachment_count integer,
  status text,
  retryable boolean
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 100), 1), 200);
begin
  return query
  with candidates as (
    select
      'contact_inquiry'::text as kind,
      inquiry.id,
      inquiry.created_at,
      inquiry.created_at + interval '30 days' as expires_at,
      case when inquiry.attachment_path is null then 0 else 1 end::integer as attachment_count
    from public.contact_inquiries as inquiry
    where inquiry.created_at <= now() - interval '30 days'
    union all
    select
      'protect_report'::text,
      report.id,
      report.created_at,
      report.created_at + interval '30 days',
      (select count(*)::integer from public.protect_report_attachments as attachment where attachment.report_id = report.id)
    from public.protect_reports as report
    where report.created_at <= now() - interval '30 days'
  )
  select
    candidate.kind,
    candidate.id,
    candidate.created_at,
    candidate.expires_at,
    coalesce(jsonb_array_length(job.object_paths), candidate.attachment_count),
    case when job.status in ('failed', 'objects_deleted') then 'retryable' else job.status end,
    job.status in ('failed', 'objects_deleted')
  from candidates as candidate
  left join public.retention_deletion_jobs as job
    on job.kind = candidate.kind
   and job.record_id = candidate.id
   and job.status <> 'completed'
  order by candidate.created_at asc, candidate.id asc
  limit v_limit;
end;
$$;

do $$
declare
  v_signature text;
begin
  for v_signature in select unnest(array[
    'get_retention_candidates(integer)',
    'reserve_retention_deletion(text,uuid,uuid,uuid)',
    'retry_retention_deletion(text,uuid,uuid,uuid,boolean)',
    'finalize_retention_deletion(text,uuid,uuid,uuid,boolean)',
    'get_retention_recovery_jobs(integer)',
    'get_retention_orphan_assets(integer)',
    'release_retention_orphan_assets(uuid[])'
  ]) loop
    execute format('revoke all on function public.%s from public, anon, authenticated', v_signature);
    execute format('grant execute on function public.%s to service_role', v_signature);
  end loop;
end;
$$;

notify pgrst, 'reload schema';
commit;
