begin;

-- Require the admin UI to acknowledge the version it reviewed before changing
-- workflow state. The row lock plus timestamp predicate makes two reviewers
-- fail closed instead of silently overwriting each other's note/status.
drop function if exists public.update_contact_inquiry_workflow(uuid, text, text);

create function public.update_contact_inquiry_workflow(
  p_inquiry_id uuid,
  p_status text,
  p_admin_note text,
  p_expected_updated_at timestamptz
)
returns table (
  id uuid,
  status text,
  admin_note text,
  answered_by uuid,
  answered_at timestamptz,
  updated_at timestamptz
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
  if p_expected_updated_at is null then
    raise exception 'EXPECTED_UPDATED_AT_REQUIRED' using errcode = '22023';
  end if;

  select * into v_current
  from public.contact_inquiries as inquiry
  where inquiry.id = p_inquiry_id
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_current.updated_at is distinct from p_expected_updated_at then
    raise exception 'STALE_WRITE' using errcode = 'P0003';
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

  return query select
    v_saved.id,
    v_saved.status,
    v_saved.admin_note,
    v_saved.answered_by,
    v_saved.answered_at,
    v_saved.updated_at;
end;
$$;

revoke all on function public.update_contact_inquiry_workflow(uuid, text, text, timestamptz)
  from public, anon;
grant execute on function public.update_contact_inquiry_workflow(uuid, text, text, timestamptz)
  to authenticated;

notify pgrst, 'reload schema';
commit;
