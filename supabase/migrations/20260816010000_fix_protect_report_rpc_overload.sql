begin;

-- Recreate the overloads because CREATE OR REPLACE cannot remove defaults.
drop function public.get_admin_protect_reports(text, text);
drop function public.get_admin_protect_reports(text, text, text);

create function public.get_admin_protect_reports(
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

notify pgrst, 'reload schema';
commit;
