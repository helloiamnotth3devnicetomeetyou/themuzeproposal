begin;

-- 20260810120000 was already applied remotely before its PL/pgSQL table
-- aliases were corrected. Replace the same signatures without changing grants.
create or replace function public.save_audition_submission(
  p_submission_id uuid,
  p_campaign_id uuid,
  p_user_id uuid,
  p_name text,
  p_answers jsonb,
  p_form_snapshot jsonb,
  p_applicant_email_hash text
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

  if not found then
    raise exception 'CAMPAIGN_CLOSED' using errcode = 'P0001';
  end if;
  if not v_campaign.is_active
    or (v_campaign.starts_at is not null and v_campaign.starts_at > v_now)
    or (v_campaign.ends_at is not null and v_campaign.ends_at < v_now) then
    raise exception 'CAMPAIGN_CLOSED' using errcode = 'P0001';
  end if;

  select * into v_existing
  from public.audition_submissions as submission
  where submission.id = p_submission_id
  for update;

  if found then
    if v_existing.user_id is distinct from p_user_id
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

create or replace function public.update_contact_inquiry_workflow(
  p_inquiry_id uuid,
  p_status text,
  p_admin_note text
)
returns table (
  id uuid,
  status text,
  admin_note text,
  answered_by uuid,
  answered_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_current public.contact_inquiries%rowtype;
  v_saved public.contact_inquiries%rowtype;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('pending', 'reviewing', 'answered', 'closed') then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;
  if p_admin_note is not null and char_length(p_admin_note) > 10000 then
    raise exception 'ADMIN_NOTE_TOO_LONG' using errcode = '22023';
  end if;

  select * into v_current
  from public.contact_inquiries as inquiry
  where inquiry.id = p_inquiry_id
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  update public.contact_inquiries as inquiry
  set status = p_status,
      admin_note = nullif(btrim(coalesce(p_admin_note, '')), ''),
      answered_by = case
        when p_status = 'answered' and (
          v_current.status <> 'answered'
          or v_current.answered_by is null
          or v_current.answered_at is null
        ) then auth.uid()
        when p_status = 'answered' then v_current.answered_by
        else null
      end,
      answered_at = case
        when p_status = 'answered' and (
          v_current.status <> 'answered'
          or v_current.answered_by is null
          or v_current.answered_at is null
        ) then clock_timestamp()
        when p_status = 'answered' then v_current.answered_at
        else null
      end
  where inquiry.id = p_inquiry_id
  returning inquiry.* into v_saved;

  return query select v_saved.id, v_saved.status, v_saved.admin_note, v_saved.answered_by, v_saved.answered_at;
end;
$$;

create or replace function public.review_audition_submission(
  p_submission_id uuid,
  p_status text,
  p_reviewer_notes text
)
returns table (
  id uuid,
  status text,
  reviewer_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_saved public.audition_submissions%rowtype;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('pending', 'reviewing', 'accepted', 'rejected') then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;
  if p_reviewer_notes is not null and char_length(p_reviewer_notes) > 10000 then
    raise exception 'REVIEWER_NOTES_TOO_LONG' using errcode = '22023';
  end if;

  update public.audition_submissions as submission
  set status = p_status,
      reviewer_notes = nullif(btrim(coalesce(p_reviewer_notes, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = clock_timestamp()
  where submission.id = p_submission_id
  returning submission.* into v_saved;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  return query select v_saved.id, v_saved.status, v_saved.reviewer_notes,
    v_saved.reviewed_by, v_saved.reviewed_at, v_saved.updated_at;
end;
$$;

notify pgrst, 'reload schema';
commit;
