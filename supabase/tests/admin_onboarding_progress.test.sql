begin;

select plan(1);

insert into auth.users (
  id, email, encrypted_password, aud, role,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000401', 'guide-one@example.com', '', 'authenticated', 'authenticated', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000402', 'guide-two@example.com', '', 'authenticated', 'authenticated', '{}'::jsonb, '{}'::jsonb, now(), now());

update public.profiles set role = 'editor'
where id in ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000402');

insert into public.admin_onboarding_progress (user_id, chapter_id, furthest_step_id)
values ('00000000-0000-0000-0000-000000000402', '9', '9-search');

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000401","role":"authenticated","email":"guide-one@example.com"}',
  true
);
set local role authenticated;

insert into public.admin_onboarding_progress (user_id, chapter_id, furthest_step_id)
values ('00000000-0000-0000-0000-000000000401', '1', '1-add')
on conflict (user_id, chapter_id) do update set furthest_step_id = excluded.furthest_step_id, updated_at = now();

insert into public.admin_onboarding_progress (user_id, chapter_id, furthest_step_id, completed_at)
values ('00000000-0000-0000-0000-000000000401', '1', '1-save', now())
on conflict (user_id, chapter_id) do update set furthest_step_id = excluded.furthest_step_id, completed_at = excluded.completed_at, updated_at = now();

do $$
begin
  if (select count(*) from public.admin_onboarding_progress) <> 1 then
    raise exception 'an administrator could read another user progress';
  end if;

  begin
    insert into public.admin_onboarding_progress (user_id, chapter_id, furthest_step_id)
    values ('00000000-0000-0000-0000-000000000402', '1', '1-add');
    raise exception 'an administrator wrote another user progress';
  exception
    when insufficient_privilege or check_violation then null;
  end;
end;
$$;

select pass('onboarding progress is private and upsertable by its owner');

rollback;
