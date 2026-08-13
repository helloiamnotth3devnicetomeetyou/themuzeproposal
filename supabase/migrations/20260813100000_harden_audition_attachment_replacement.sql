begin;

-- Reject stale edits before the route removes any replaced private files.
drop function if exists public.save_audition_submission(uuid, uuid, uuid, text, jsonb, jsonb, text);
create function public.save_audition_submission(
  p_submission_id uuid,
  p_campaign_id uuid,
  p_user_id uuid,
  p_name text,
  p_answers jsonb,
  p_form_snapshot jsonb,
  p_applicant_email_hash text,
  p_expected_updated_at timestamptz default null
)
returns table (id uuid, created_at timestamptz, updated_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_campaign public.audition_campaigns%rowtype;
  v_existing public.audition_submissions%rowtype;
  v_saved public.audition_submissions%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if p_submission_id is null or p_campaign_id is null or p_user_id is null
    or p_applicant_email_hash is null
    or p_applicant_email_hash !~ '^[0-9a-f]{64}$'
    or p_answers is null or jsonb_typeof(p_answers) <> 'object'
    or p_form_snapshot is null or jsonb_typeof(p_form_snapshot) <> 'array' then
    raise exception 'INVALID_SUBMISSION' using errcode = '22023';
  end if;

  select * into v_campaign
  from public.audition_campaigns as campaign
  where campaign.id = p_campaign_id
  for update;
  if not found or not v_campaign.is_active
    or (v_campaign.starts_at is not null and v_campaign.starts_at > v_now)
    or (v_campaign.ends_at is not null and v_campaign.ends_at < v_now) then
    raise exception 'CAMPAIGN_CLOSED' using errcode = 'P0001';
  end if;

  select * into v_existing
  from public.audition_submissions as submission
  where submission.id = p_submission_id
  for update;
  if found then
    if p_expected_updated_at is null
      or v_existing.updated_at is distinct from p_expected_updated_at
      or v_existing.user_id is distinct from p_user_id
      or v_existing.campaign_id is distinct from p_campaign_id
      or v_existing.status is distinct from 'pending'
      or v_existing.reviewer_notes is not null
      or v_existing.reviewed_by is not null
      or v_existing.reviewed_at is not null then
      raise exception 'SUBMISSION_CONFLICT' using errcode = 'P0001';
    end if;

    update public.audition_submissions as submission
    set name = p_name,
        answers = p_answers,
        form_snapshot = p_form_snapshot,
        applicant_email_hash = p_applicant_email_hash,
        status = 'pending'
    where submission.id = p_submission_id
    returning submission.* into v_saved;
  else
    insert into public.audition_submissions (
      id, campaign_id, user_id, name, answers, form_snapshot,
      applicant_email_hash, status
    ) values (
      p_submission_id, p_campaign_id, p_user_id, p_name, p_answers,
      p_form_snapshot, p_applicant_email_hash, 'pending'
    )
    returning * into v_saved;
  end if;

  return query select v_saved.id, v_saved.created_at, v_saved.updated_at;
end;
$$;

revoke all on function public.save_audition_submission(uuid, uuid, uuid, text, jsonb, jsonb, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.save_audition_submission(uuid, uuid, uuid, text, jsonb, jsonb, text, timestamptz)
  to service_role;

notify pgrst, 'reload schema';
commit;
