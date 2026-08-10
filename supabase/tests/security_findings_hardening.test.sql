begin;

select plan(1);

do $$
begin
  if has_column_privilege('authenticated', 'public.contact_inquiries', 'message', 'update')
    or has_column_privilege('authenticated', 'public.protect_reports', 'content', 'update') then
    raise exception 'authenticated reviewers can still rewrite submitted content';
  end if;
  if has_column_privilege('authenticated', 'public.contact_inquiries', 'status', 'update')
    or has_column_privilege('authenticated', 'public.contact_inquiries', 'answered_by', 'update')
    or has_column_privilege('authenticated', 'public.audition_submissions', 'reviewed_by', 'update') then
    raise exception 'browser roles can still write workflow attribution columns';
  end if;
  if not has_column_privilege('authenticated', 'public.protect_reports', 'status', 'update')
    or not has_function_privilege('authenticated', 'public.update_contact_inquiry_workflow(uuid,text,text)', 'execute')
    or not has_function_privilege('authenticated', 'public.review_audition_submission(uuid,text,text)', 'execute') then
    raise exception 'review workflow boundary functions are unavailable';
  end if;
  if has_table_privilege('authenticated', 'public.contact_inquiries', 'delete')
    or has_table_privilege('authenticated', 'public.protect_reports', 'delete')
    or has_column_privilege('authenticated', 'public.profiles', 'role', 'update') then
    raise exception 'a browser role retains a destructive or privileged mutation grant';
  end if;
  if not has_function_privilege('authenticated', 'public.set_admin_role(uuid,text)', 'execute') then
    raise exception 'transactional role transition function is unavailable';
  end if;
  if not has_table_privilege('service_role', 'public.admin_audit_logs', 'insert') then
    raise exception 'validated server uploads cannot append audit rows';
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'admins manage business assets'
  ) then
    raise exception 'browser business-asset mutation policy still exists';
  end if;

  insert into private.submission_rate_limits (scope, key_hash, attempt_count)
  values ('contact_inquiry_attempt', repeat('a', 64), 1);
end;
$$;

select pass('reported security boundaries are enforced');

rollback;
