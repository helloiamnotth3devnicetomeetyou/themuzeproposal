begin;

-- Scheduled retention purge previously gated on created_at alone, so an item
-- moved to the trash sat there until 30 days after it was originally
-- submitted, not 30 days after it was trashed. Auto-purge now only ever
-- applies to trashed records (deleted_at set), 30 days after deleted_at.
-- A record an admin never moved to the trash is never auto-deleted.
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
  v_deleted_at timestamptz;
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
    select 1 from public.profiles where id = p_actor_id and role in ('super_admin', 'editor')
  ) then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('retention' || chr(31) || p_kind || chr(31) || p_id::text, 0));

  if p_kind = 'contact_inquiry' then
    select inquiry.created_at, inquiry.deleted_at,
      case when inquiry.attachment_path is null then '[]'::jsonb
        else jsonb_build_array(jsonb_build_object('bucket', 'contact-attachments', 'path', inquiry.attachment_path)) end
    into v_created_at, v_deleted_at, v_paths
    from public.contact_inquiries as inquiry
    where inquiry.id = p_id;
  else
    select report.created_at, report.deleted_at,
      coalesce((select jsonb_agg(jsonb_build_object('bucket', 'protect-evidence', 'path', attachment.file_path) order by attachment.file_path)
        from public.protect_report_attachments as attachment where attachment.report_id = report.id), '[]'::jsonb)
    into v_created_at, v_deleted_at, v_paths
    from public.protect_reports as report
    where report.id = p_id;
  end if;
  if v_created_at is null then
    raise exception 'retention record not found' using errcode = 'P0002';
  end if;
  if v_deleted_at is null or v_deleted_at > now() - interval '30 days' then
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

-- The listing/UI "expires" date should match the cutoff enforced above:
-- only trashed records (deleted_at set) are candidates, 30 days after deleted_at.
create or replace function public.get_retention_candidates(p_limit integer default 100)
returns table (
  kind text,
  id uuid,
  created_at timestamptz,
  expires_at timestamptz,
  attachment_count integer,
  status text,
  retryable boolean,
  deleted_at timestamptz
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
      inquiry.deleted_at + interval '30 days' as expires_at,
      case when inquiry.attachment_path is null then 0 else 1 end::integer as attachment_count,
      inquiry.deleted_at
    from public.contact_inquiries as inquiry
    where inquiry.deleted_at is not null
    union all
    select
      'protect_report'::text,
      report.id,
      report.created_at,
      report.deleted_at + interval '30 days',
      (select count(*)::integer from public.protect_report_attachments as attachment where attachment.report_id = report.id),
      report.deleted_at
    from public.protect_reports as report
    where report.deleted_at is not null
  )
  select
    candidate.kind,
    candidate.id,
    candidate.created_at,
    candidate.expires_at,
    coalesce(jsonb_array_length(job.object_paths), candidate.attachment_count),
    case when job.status in ('failed', 'objects_deleted') then 'retryable' else job.status end,
    job.status in ('failed', 'objects_deleted'),
    candidate.deleted_at
  from candidates as candidate
  left join public.retention_deletion_jobs as job
    on job.kind = candidate.kind
   and job.record_id = candidate.id
   and job.status <> 'completed'
  order by candidate.deleted_at desc nulls last, candidate.created_at asc, candidate.id asc
  limit v_limit;
end;
$$;

notify pgrst, 'reload schema';
commit;
