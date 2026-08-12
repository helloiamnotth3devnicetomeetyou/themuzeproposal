begin;

-- Reporters get only the fields used by their self-service page. Admins use
-- the security-definer RPC below for the full report row.
revoke select on table public.protect_reports from authenticated;
grant select (
  id,
  artist_id,
  report_type,
  title,
  platform,
  status,
  created_at
) on table public.protect_reports to authenticated;

create or replace function public.get_admin_protect_reports(
  p_status text default null,
  p_search text default null
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

  return query
  select report.*
  from public.protect_reports as report
  where (p_status is null or report.status = p_status)
    and (
      v_search is null
      or position(lower(v_search) in lower(coalesce(report.title, ''))) > 0
      or position(lower(v_search) in lower(coalesce(report.reporter_email, ''))) > 0
      or position(lower(v_search) in lower(coalesce(report.author_name, ''))) > 0
      or position(lower(v_search) in lower(coalesce(report.platform, ''))) > 0
      or position(lower(v_search) in lower(coalesce(report.content, ''))) > 0
    )
  order by report.created_at desc;
end;
$$;

revoke all on function public.get_admin_protect_reports(text, text) from public, anon;
grant execute on function public.get_admin_protect_reports(text, text) to authenticated, service_role;

-- Uploads are server-only; signed URLs are issued by Storage only to admins
-- for the UUID-based paths created by the submission routes.
drop policy if exists "admins read contact attachments" on storage.objects;
create policy "admins read contact attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'contact-attachments'
  and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$'
  and public.is_admin()
);

drop policy if exists "admins read protect evidence" on storage.objects;
create policy "admins read protect evidence"
on storage.objects for select to authenticated
using (
  bucket_id = 'protect-evidence'
  and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp|gif|pdf)$'
  and public.is_admin()
);

notify pgrst, 'reload schema';
commit;
