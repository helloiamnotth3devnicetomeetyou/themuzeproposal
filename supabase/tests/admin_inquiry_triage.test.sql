begin;

select plan(1);

do $$
declare
  v_contact_id constant uuid := '00000000-0000-0000-0000-000000001501';
  v_low_contact_id constant uuid := '00000000-0000-0000-0000-000000001502';
  v_protect_id constant uuid := '00000000-0000-0000-0000-000000001503';
  v_low_protect_id constant uuid := '00000000-0000-0000-0000-000000001504';
  v_admin_id constant uuid := '00000000-0000-0000-0000-000000001505';
  v_user_id constant uuid := '00000000-0000-0000-0000-000000001506';
  v_created_at timestamptz;
  v_read_at timestamptz;
  v_read_by uuid;
  v_first_id uuid;
  v_audit public.admin_audit_logs%rowtype;
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'contact_inquiries'
      and column_name in (
        'urgency', 'urgency_rank', 'is_likely_spam', 'ai_reasoning',
        'ai_classified_at', 'read_at', 'read_by'
      )
    group by table_schema, table_name
    having count(*) = 7
  ) then
    raise exception 'contact triage columns are incomplete';
  end if;
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'protect_reports'
      and column_name in (
        'severity', 'severity_rank', 'ai_reasoning', 'ai_classified_at',
        'read_at', 'read_by'
      )
    group by table_schema, table_name
    having count(*) = 6
  ) then
    raise exception 'protect triage columns are incomplete';
  end if;

  if has_column_privilege('authenticated', 'public.contact_inquiries', 'urgency', 'update')
    or has_column_privilege('authenticated', 'public.contact_inquiries', 'read_at', 'update')
    or has_column_privilege('authenticated', 'public.protect_reports', 'severity', 'update')
    or has_column_privilege('authenticated', 'public.protect_reports', 'read_at', 'update') then
    raise exception 'authenticated can forge triage or read metadata';
  end if;
  if not has_function_privilege('authenticated', 'public.mark_contact_inquiry_read(uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.mark_protect_report_read(uuid)', 'execute')
    or has_function_privilege('anon', 'public.mark_contact_inquiry_read(uuid)', 'execute')
    or has_function_privilege('anon', 'public.mark_protect_report_read(uuid)', 'execute') then
    raise exception 'read RPC privileges are not restricted to authenticated';
  end if;
  if not has_function_privilege('authenticated', 'public.get_admin_unclassified_counts()', 'execute')
    or has_function_privilege('anon', 'public.get_admin_unclassified_counts()', 'execute') then
    raise exception 'unclassified count RPC privileges are not restricted';
  end if;

  insert into auth.users (
    id, email, encrypted_password, aud, role,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (v_admin_id, 'triage-admin@example.com', '', 'authenticated', 'authenticated', '{}', '{}', now(), now()),
    (v_user_id, 'triage-user@example.com', '', 'authenticated', 'authenticated', '{}', '{}', now(), now());
  update public.profiles set role = 'super_admin' where id = v_admin_id;

  insert into public.artists (id, slug, name)
  values ('00000000-0000-0000-0000-000000001507', 'triage-test-artist', 'Triage test artist');

  insert into public.contact_inquiries (
    id, category, inquiry_type, contact_name, email, message, privacy_consent,
    urgency, ai_reasoning
  ) values (
    v_contact_id, 'general', 'other', 'Triage user', 'triage@example.com',
    'Triage message', true, 'urgent', 'do not put this in audit logs'
  );
  insert into public.contact_inquiries (
    id, category, inquiry_type, contact_name, email, message, privacy_consent,
    urgency
  ) values (
    v_low_contact_id, 'general', 'other', 'Triage user 2', 'triage2@example.com',
    'Triage message 2', true, 'low'
  );
  insert into public.protect_reports (
    id, user_id, reporter_email, artist_id, report_type, title, content,
    platform, post_url, posted_at, author_name, confirmation, severity
  ) values
    (
      v_protect_id, v_user_id, 'triage@example.com',
      '00000000-0000-0000-0000-000000001507', 'other', 'Critical report',
      'Critical report body', 'community', 'https://example.com/post',
      current_date, 'Author', true, 'critical'
    ),
    (
      v_low_protect_id, v_user_id, 'triage@example.com',
      '00000000-0000-0000-0000-000000001507', 'other', 'Low report',
      'Low report body', 'community', 'https://example.com/post-2',
      current_date, 'Author', true, 'low'
    );

  if (select urgency_rank from public.contact_inquiries where id = v_contact_id) <=
     (select urgency_rank from public.contact_inquiries where id = v_low_contact_id)
    or (select severity_rank from public.protect_reports where id = v_protect_id) <=
       (select severity_rank from public.protect_reports where id = v_low_protect_id) then
    raise exception 'generated triage ranks have the wrong order';
  end if;

  select updated_at into v_created_at
  from public.contact_inquiries where id = v_contact_id;
  update public.contact_inquiries
  set urgency = 'high', ai_classified_at = clock_timestamp(), read_at = clock_timestamp(), read_by = v_admin_id
  where id = v_contact_id;
  if (select updated_at from public.contact_inquiries where id = v_contact_id) is distinct from v_created_at then
    raise exception 'AI/read metadata changed updated_at';
  end if;

  set local role authenticated;
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin_id::text, 'role', 'authenticated', 'email', 'triage-admin@example.com')::text,
    true
  );
  select mark.read_at, mark.read_by into v_read_at, v_read_by
  from public.mark_contact_inquiry_read(v_low_contact_id) as mark;
  if v_read_at is null or v_read_by is distinct from v_admin_id then
    raise exception 'contact read RPC did not record the administrator';
  end if;
  select mark.read_at, mark.read_by into v_created_at, v_read_by
  from public.mark_contact_inquiry_read(v_low_contact_id) as mark;
  if v_created_at is distinct from v_read_at or v_read_by is distinct from v_admin_id then
    raise exception 'contact read RPC is not idempotent';
  end if;

  select mark.read_at, mark.read_by into v_read_at, v_read_by
  from public.mark_protect_report_read(v_protect_id) as mark;
  if v_read_at is null or v_read_by is distinct from v_admin_id then
    raise exception 'protect read RPC did not record the administrator';
  end if;

  select report.id into v_first_id
  from public.get_admin_protect_reports(null, null, null) as report
  limit 1;
  if v_first_id is distinct from v_protect_id then
    raise exception 'admin protect reports are not severity-ranked';
  end if;
  if (select count(*) from public.get_admin_protect_reports(null, null, 'low')) <> 1 then
    raise exception 'admin protect severity filter is incorrect';
  end if;

  reset role;
  select * into v_audit
  from public.admin_audit_logs
  where table_name = 'contact_inquiries'
    and record_id = v_contact_id::text
    and operation = 'UPDATE'
    and changed_fields @> array['urgency']::text[]
  order by id desc
  limit 1;
  if v_audit.changed_fields @> array['ai_reasoning']::text[]
    or v_audit.before_values ? 'ai_reasoning'
    or v_audit.after_values ? 'ai_reasoning' then
    raise exception 'AI reasoning leaked into the sensitive audit whitelist';
  end if;
  if not (v_audit.changed_fields @> array['urgency', 'ai_classified_at']::text[]) then
    raise exception 'classification metadata was omitted from the audit whitelist';
  end if;
end;
$$;

select pass('inquiry triage metadata, security boundaries, ordering, audit, and read RPCs are enforced');

rollback;
