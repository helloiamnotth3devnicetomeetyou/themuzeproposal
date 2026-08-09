begin;

-- Validated server uploads append audit rows; browser roles remain read-only.
grant insert on table public.admin_audit_logs to service_role;
grant usage, select on sequence public.admin_audit_logs_id_seq to service_role;

-- Business assets are written only through the byte-validating server route.
drop policy if exists "admins manage business assets" on storage.objects;
drop policy if exists "public read business assets" on storage.objects;
create policy "public read business assets" on storage.objects for select
using (
  bucket_id = 'business-assets'
  and (
    name in ('press-kit.zip', 'profile.pdf')
    or name ~ '^press-kit/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.zip$'
    or name ~ '^profile/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$'
  )
);

-- Reviewers may change workflow state, never submitted identity/body fields.
revoke all on table public.contact_inquiries from authenticated;
grant select on table public.contact_inquiries to authenticated;
grant update (status, admin_note, answered_at, answered_by)
  on table public.contact_inquiries to authenticated;
drop policy if exists "admins delete contact inquiries" on public.contact_inquiries;

revoke all on table public.protect_reports from authenticated;
grant select on table public.protect_reports to authenticated;
grant update (status, admin_note) on table public.protect_reports to authenticated;
drop policy if exists "admins delete protect reports" on public.protect_reports;

revoke all on table public.protect_report_attachments from authenticated;
grant select on table public.protect_report_attachments to authenticated;

-- Profile role changes are serialized and enforced at the final mutation boundary.
revoke all on table public.profiles from authenticated;
grant select, insert on table public.profiles to authenticated;
grant update (name, avatar_asset_id, updated_at) on table public.profiles to authenticated;

create or replace function public.set_admin_role(p_target_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_target_role text;
begin
  if p_role is not null and p_role not in ('super_admin', 'editor') then
    raise exception 'INVALID_ROLE' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('admin-role-transition'));

  select role into v_actor_role from public.profiles where id = v_actor_id;
  if v_actor_role is distinct from 'super_admin' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_actor_id = p_target_id then
    raise exception 'CANNOT_CHANGE_OWN_ROLE' using errcode = 'P0001';
  end if;

  select role into v_target_role from public.profiles where id = p_target_id;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_target_role = 'super_admin' and p_role is distinct from 'super_admin'
    and (select count(*) from public.profiles where role = 'super_admin') <= 1 then
    raise exception 'LAST_SUPER_ADMIN' using errcode = 'P0001';
  end if;

  update public.profiles
  set role = p_role, updated_at = now()
  where id = p_target_id;
end;
$$;

revoke all on function public.set_admin_role(uuid, text) from public, anon;
grant execute on function public.set_admin_role(uuid, text) to authenticated;

-- Separate pre-parse request budgets from successful-submission quotas.
alter table private.submission_rate_limits
  drop constraint if exists submission_rate_limits_scope_check;
alter table private.submission_rate_limits
  add constraint submission_rate_limits_scope_check check (scope in (
    'contact_inquiry', 'protect_report', 'audition_submission',
    'contact_inquiry_attempt', 'protect_report_attempt', 'audition_submission_attempt'
  ));

notify pgrst, 'reload schema';
commit;
