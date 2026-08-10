begin;

select plan(1);

do $$
begin
  if to_regclass('public.admin_audit_logs') is null then
    raise exception 'admin_audit_logs table was not created';
  end if;
  if to_regclass('public.audition_submissions') is null then
    raise exception 'audition_submissions table was not restored';
  end if;
end;
$$;

insert into auth.users (
  id,
  email,
  encrypted_password,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '00000000-0000-0000-0000-000000000101',
    'audit-admin@example.com',
    '',
    'authenticated',
    'authenticated',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'audit-user@example.com',
    '',
    'authenticated',
    'authenticated',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

update public.profiles
set role = 'super_admin'
where id = '00000000-0000-0000-0000-000000000101';

truncate table public.admin_audit_logs restart identity;

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000101","role":"authenticated","email":"audit-admin@example.com"}',
  true
);
set local role authenticated;

insert into public.artists (id, slug, name)
values ('00000000-0000-0000-0000-000000000201', 'audit-test-artist', '감사 테스트');

do $$
declare
  v_log public.admin_audit_logs%rowtype;
begin
  select * into v_log
  from public.admin_audit_logs
  where table_name = 'artists'
    and record_id = '00000000-0000-0000-0000-000000000201'
    and operation = 'INSERT';

  if v_log.id is null then
    raise exception 'artist insert was not audited';
  end if;
  if v_log.actor_id <> '00000000-0000-0000-0000-000000000101'::uuid
    or v_log.actor_email <> 'audit-admin@example.com' then
    raise exception 'audit actor was not captured';
  end if;
  if v_log.after_values ->> 'name' <> '감사 테스트' then
    raise exception 'insert snapshot is incomplete';
  end if;
end;
$$;

update public.artists
set name = '변경된 감사 테스트'
where id = '00000000-0000-0000-0000-000000000201';

do $$
declare
  v_log public.admin_audit_logs%rowtype;
begin
  select * into v_log
  from public.admin_audit_logs
  where table_name = 'artists'
    and record_id = '00000000-0000-0000-0000-000000000201'
    and operation = 'UPDATE'
  order by id desc
  limit 1;

  if v_log.changed_fields <> array['name']::text[] then
    raise exception 'update changed_fields was %, expected name', v_log.changed_fields;
  end if;
  if v_log.before_values ->> 'name' <> '감사 테스트'
    or v_log.after_values ->> 'name' <> '변경된 감사 테스트' then
    raise exception 'update before/after values are incorrect';
  end if;
  if v_log.before_values ? 'updated_at' or v_log.after_values ? 'updated_at' then
    raise exception 'automatic timestamps must not be audited';
  end if;
end;
$$;

update public.artists
set name = name
where id = '00000000-0000-0000-0000-000000000201';

do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.admin_audit_logs
  where table_name = 'artists'
    and record_id = '00000000-0000-0000-0000-000000000201'
    and operation = 'UPDATE';

  if v_count <> 1 then
    raise exception 'no-op update produced an audit row';
  end if;
end;
$$;

reset role;

insert into public.audition_submissions (
  id,
  name,
  category,
  status,
  reviewer_notes
) values (
  '00000000-0000-0000-0000-000000000401',
  '감사 지원자',
  '보컬',
  'pending',
  '초기 심사 메모'
);

set local role authenticated;
update public.audition_submissions
set reviewer_notes = '수정된 심사 메모'
where id = '00000000-0000-0000-0000-000000000401';

do $$
declare
  v_log public.admin_audit_logs%rowtype;
begin
  select * into v_log
  from public.admin_audit_logs
  where table_name = 'audition_submissions'
    and record_id = '00000000-0000-0000-0000-000000000401'
    and operation = 'UPDATE'
  order by id desc
  limit 1;

  if v_log.changed_fields <> array['reviewer_notes']::text[]
    or v_log.before_values ->> 'reviewer_notes' <> '초기 심사 메모'
    or v_log.after_values ->> 'reviewer_notes' <> '수정된 심사 메모' then
    raise exception 'reviewer_notes audit snapshot is incomplete';
  end if;
end;
$$;

reset role;

insert into public.contact_inquiries (
  id,
  category,
  inquiry_type,
  contact_name,
  email,
  message,
  privacy_consent
) values (
  '00000000-0000-0000-0000-000000000301',
  'general',
  'other',
  '민감한 이름',
  'private@example.com',
  '감사 로그에 남으면 안 되는 문의 본문',
  true
);

set local role authenticated;
update public.contact_inquiries
set status = 'reviewing', admin_note = '확인 중'
where id = '00000000-0000-0000-0000-000000000301';

do $$
declare
  v_log public.admin_audit_logs%rowtype;
  v_payload text;
begin
  select * into v_log
  from public.admin_audit_logs
  where table_name = 'contact_inquiries'
    and record_id = '00000000-0000-0000-0000-000000000301'
  order by id desc
  limit 1;

  v_payload := coalesce(v_log.before_values::text, '') || coalesce(v_log.after_values::text, '');
  if v_log.changed_fields <> array['admin_note', 'status']::text[] then
    raise exception 'sensitive operational fields were not recorded correctly';
  end if;
  if v_payload like '%private@example.com%'
    or v_payload like '%민감한 이름%'
    or v_payload like '%문의 본문%' then
    raise exception 'sensitive inquiry data leaked into the audit payload';
  end if;
end;
$$;

select public.set_admin_role('00000000-0000-0000-0000-000000000102', 'editor');

do $$
begin
  if not exists (
    select 1
    from public.admin_audit_logs
    where table_name = 'profiles'
      and record_id = '00000000-0000-0000-0000-000000000102'
      and changed_fields = array['role']::text[]
  ) then
    raise exception 'administrator role change was not audited';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000102","role":"authenticated","email":"audit-user@example.com"}',
  true
);

update public.profiles
set name = '일반 프로필 변경'
where id = '00000000-0000-0000-0000-000000000102';

do $$
begin
  if exists (
    select 1
    from public.admin_audit_logs
    where table_name = 'profiles'
      and record_id = '00000000-0000-0000-0000-000000000102'
      and changed_fields = array['name']::text[]
  ) then
    raise exception 'ordinary profile update must not be audited';
  end if;
end;
$$;

do $$
begin
  begin
    delete from public.admin_audit_logs;
    raise exception 'authenticated administrator unexpectedly deleted audit logs';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.admin_audit_logs (
      operation,
      table_name,
      record_id,
      record_label
    ) values ('INSERT', 'forged', 'forged', 'forged');
    raise exception 'authenticated administrator unexpectedly inserted an audit log';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

select pass('admin audit log security checks');

rollback;
