begin;

-- Applicants may read their own application, but never internal review data.
revoke select on public.audition_submissions from authenticated;
grant select (
  id,
  campaign_id,
  user_id,
  answers,
  form_snapshot,
  status,
  created_at,
  updated_at
) on public.audition_submissions to authenticated;

-- Admin review still needs the private columns, exposed only after a role check.
create or replace function public.get_admin_audition_submissions(p_campaign_id uuid)
returns table (
  id uuid,
  campaign_id uuid,
  answers jsonb,
  form_snapshot jsonb,
  status text,
  reviewer_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  return query
  select
    submission.id,
    submission.campaign_id,
    submission.answers,
    submission.form_snapshot,
    submission.status,
    submission.reviewer_notes,
    submission.reviewed_by,
    submission.reviewed_at,
    submission.created_at,
    submission.updated_at
  from public.audition_submissions submission
  where submission.campaign_id = p_campaign_id
  order by submission.created_at desc;
end;
$$;

revoke all on function public.get_admin_audition_submissions(uuid) from public, anon;
grant execute on function public.get_admin_audition_submissions(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
