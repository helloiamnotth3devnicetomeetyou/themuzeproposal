begin;

create or replace function public.audition_submission_has_attachment(p_path text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.audition_submissions submission
    where submission.answers @? format('$.* ? (@.path == %s)', to_json(p_path))::jsonpath
  );
$$;

revoke all on function public.audition_submission_has_attachment(text) from public, anon, authenticated;
grant execute on function public.audition_submission_has_attachment(text) to service_role;

notify pgrst, 'reload schema';
commit;
