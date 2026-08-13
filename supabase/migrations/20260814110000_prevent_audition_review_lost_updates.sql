begin;

drop function if exists public.review_audition_submission(uuid, text, text);

create function public.review_audition_submission(
  p_submission_id uuid,
  p_status text,
  p_reviewer_notes text,
  p_expected_updated_at timestamptz
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
  v_current public.audition_submissions%rowtype;
  v_saved public.audition_submissions%rowtype;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if p_status is null or p_status not in ('pending', 'reviewing', 'accepted', 'rejected') then raise exception 'INVALID_STATUS' using errcode = '22023'; end if;
  if p_reviewer_notes is not null and char_length(p_reviewer_notes) > 10000 then raise exception 'REVIEWER_NOTES_TOO_LONG' using errcode = '22023'; end if;
  if p_expected_updated_at is null then raise exception 'EXPECTED_UPDATED_AT_REQUIRED' using errcode = '22023'; end if;

  select * into v_current from public.audition_submissions as submission
  where submission.id = p_submission_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_current.updated_at is distinct from p_expected_updated_at then raise exception 'STALE_WRITE' using errcode = 'P0003'; end if;

  update public.audition_submissions as submission
  set status = p_status,
      reviewer_notes = nullif(btrim(coalesce(p_reviewer_notes, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = clock_timestamp()
  where submission.id = p_submission_id
  returning submission.* into v_saved;

  return query select v_saved.id, v_saved.status, v_saved.reviewer_notes,
    v_saved.reviewed_by, v_saved.reviewed_at, v_saved.updated_at;
end;
$$;

revoke all on function public.review_audition_submission(uuid, text, text, timestamptz) from public, anon;
grant execute on function public.review_audition_submission(uuid, text, text, timestamptz) to authenticated;

notify pgrst, 'reload schema';
commit;
