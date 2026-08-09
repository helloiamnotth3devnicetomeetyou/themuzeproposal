begin;

select plan(1);

insert into auth.users (
  id, email, encrypted_password, aud, role,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000401',
  'profile-owner@example.com',
  '', 'authenticated', 'authenticated', '{}'::jsonb, '{}'::jsonb, now(), now()
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000401","role":"authenticated","email":"profile-owner@example.com"}',
  true
);
set local role authenticated;

do $$
begin
  update public.profiles
  set name = 'Updated profile name'
  where id = '00000000-0000-0000-0000-000000000401';

  begin
    update public.profiles
    set email = 'attacker@example.com'
    where id = '00000000-0000-0000-0000-000000000401';
    raise exception 'authenticated users can replace their profile email';
  exception when insufficient_privilege then
    null;
  end;

  if not exists (
    select 1 from public.profiles
    where id = '00000000-0000-0000-0000-000000000401'
      and email = 'profile-owner@example.com'
      and name = 'Updated profile name'
  ) then
    raise exception 'profile identity binding rejected a legitimate own-profile update';
  end if;
end;
$$;

select pass('profile email remains bound to the authenticated identity');

rollback;
