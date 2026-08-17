begin;

-- Manual inbox deletion is now a two-step flow: admins move a submission to the
-- trash (deleted_at), and only the retention screen erases the row and its
-- files. The scheduled 30-day purge is unchanged.
alter table public.contact_inquiries add column if not exists deleted_at timestamptz;
alter table public.protect_reports add column if not exists deleted_at timestamptz;

create index if not exists contact_inquiries_deleted_at_idx
  on public.contact_inquiries (deleted_at) where deleted_at is not null;
create index if not exists protect_reports_deleted_at_idx
  on public.protect_reports (deleted_at) where deleted_at is not null;

create or replace function public.set_submission_trash(
  p_kind text,
  p_ids uuid[],
  p_actor_id uuid,
  p_trashed boolean
)
returns setof uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_kind not in ('contact_inquiry', 'protect_report')
    or p_ids is null
    or cardinality(p_ids) < 1
    or cardinality(p_ids) > 50
    or p_trashed is null then
    raise exception 'invalid submission trash request' using errcode = '22023';
  end if;
  if p_actor_id is null or not exists (
    select 1 from public.profiles
    where id = p_actor_id and role in ('super_admin', 'editor')
  ) then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  if p_kind = 'contact_inquiry' then
    return query
    with updated as (
      update public.contact_inquiries
      set deleted_at = case when p_trashed then now() else null end
      where id = any(p_ids) and (deleted_at is null) = p_trashed
      returning id
    )
    select id from updated;
  else
    return query
    with updated as (
      update public.protect_reports
      set deleted_at = case when p_trashed then now() else null end
      where id = any(p_ids) and (deleted_at is null) = p_trashed
      returning id
    )
    select id from updated;
  end if;
end;
$$;

revoke all on function public.set_submission_trash(text, uuid[], uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.set_submission_trash(text, uuid[], uuid, boolean)
  to service_role;

-- Trashed submissions leave the admin inbox immediately.
create or replace function public.get_admin_protect_reports(
  p_status text,
  p_search text,
  p_severity text
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
  where report.deleted_at is null
    and (p_status is null or report.status = p_status)
    and (p_severity is null or report.severity = p_severity)
    and (
      v_search is null
      or position(lower(v_search) in lower(coalesce(report.title, ''))) > 0
      or position(lower(v_search) in lower(coalesce(report.reporter_email, ''))) > 0
      or position(lower(v_search) in lower(coalesce(report.author_name, ''))) > 0
      or position(lower(v_search) in lower(coalesce(report.platform, ''))) > 0
      or position(lower(v_search) in lower(coalesce(report.content, ''))) > 0
    )
  order by report.created_at desc, report.id desc;
end;
$$;

-- The retention screen doubles as the trash: it lists anything past the 30-day
-- policy plus anything an admin moved to the trash, whatever its age.
-- The added deleted_at column changes the result type, so replace is not enough.
drop function if exists public.get_retention_candidates(integer);
create function public.get_retention_candidates(p_limit integer default 100)
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
      inquiry.created_at + interval '30 days' as expires_at,
      case when inquiry.attachment_path is null then 0 else 1 end::integer as attachment_count,
      inquiry.deleted_at
    from public.contact_inquiries as inquiry
    where inquiry.created_at <= now() - interval '30 days'
       or inquiry.deleted_at is not null
    union all
    select
      'protect_report'::text,
      report.id,
      report.created_at,
      report.created_at + interval '30 days',
      (select count(*)::integer from public.protect_report_attachments as attachment where attachment.report_id = report.id),
      report.deleted_at
    from public.protect_reports as report
    where report.created_at <= now() - interval '30 days'
       or report.deleted_at is not null
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

revoke all on function public.get_retention_candidates(integer)
  from public, anon, authenticated;
grant execute on function public.get_retention_candidates(integer) to service_role;

notify pgrst, 'reload schema';
commit;
