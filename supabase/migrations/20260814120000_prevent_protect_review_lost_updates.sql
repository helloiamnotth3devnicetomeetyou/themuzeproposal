begin;

-- Require the admin UI to acknowledge the version it reviewed before changing
-- a protect report. The row lock plus timestamp check prevents silent
-- overwrites when two reviewers edit the same report.
drop function if exists public.review_protect_report(uuid, text, text);

create function public.review_protect_report(
  p_report_id uuid,
  p_status text,
  p_admin_note text,
  p_expected_updated_at timestamptz
)
returns table (
  id uuid,
  status text,
  admin_note text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_current public.protect_reports%rowtype;
  v_saved public.protect_reports%rowtype;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('pending', 'reviewing', 'resolved', 'rejected') then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;
  if p_admin_note is not null and char_length(p_admin_note) > 10000 then
    raise exception 'ADMIN_NOTE_TOO_LONG' using errcode = '22023';
  end if;
  if p_expected_updated_at is null then
    raise exception 'EXPECTED_UPDATED_AT_REQUIRED' using errcode = '22023';
  end if;

  select * into v_current
  from public.protect_reports as report
  where report.id = p_report_id
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_current.updated_at is distinct from p_expected_updated_at then
    raise exception 'STALE_WRITE' using errcode = 'P0003';
  end if;

  update public.protect_reports as report
  set status = p_status,
      admin_note = nullif(btrim(coalesce(p_admin_note, '')), '')
  where report.id = p_report_id
  returning report.* into v_saved;

  return query select v_saved.id, v_saved.status, v_saved.admin_note, v_saved.updated_at;
end;
$$;

revoke all on function public.review_protect_report(uuid, text, text, timestamptz)
  from public, anon;
grant execute on function public.review_protect_report(uuid, text, text, timestamptz)
  to authenticated;

revoke update (status, admin_note) on table public.protect_reports from authenticated;

notify pgrst, 'reload schema';
commit;
