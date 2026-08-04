begin;

create or replace function public.get_my_audition_submissions()
returns table (
  id uuid,
  campaign_id uuid,
  user_id uuid,
  answers jsonb,
  form_snapshot jsonb,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  return query
  select
    submission.id,
    submission.campaign_id,
    submission.user_id,
    submission.answers,
    submission.form_snapshot,
    submission.status,
    submission.created_at,
    submission.updated_at
  from public.audition_submissions submission
  where submission.user_id = auth.uid()
  order by submission.created_at desc;
end;
$$;

revoke all on function public.get_my_audition_submissions() from public, anon;
grant execute on function public.get_my_audition_submissions() to authenticated;

notify pgrst, 'reload schema';
commit;
