begin;

select plan(1);

insert into auth.users (
  id, email, encrypted_password, aud, role, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '70000000-0000-0000-0000-000000000001', 'before-email-sync@example.com', '',
  'authenticated', 'authenticated', '{}'::jsonb, '{}'::jsonb, now(), now()
);
update auth.users
set email = 'after-email-sync@example.com'
where id = '70000000-0000-0000-0000-000000000001';

select is(
  (select email from public.profiles where id = '70000000-0000-0000-0000-000000000001'),
  'after-email-sync@example.com',
  'auth email updates synchronize the profile email'
);

rollback;
