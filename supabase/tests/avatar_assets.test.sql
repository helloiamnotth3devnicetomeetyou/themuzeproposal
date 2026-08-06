begin;

select plan(1);

insert into auth.users (
  id, email, encrypted_password, aud, role,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000301',
  'avatar-user@example.com',
  '',
  'authenticated',
  'authenticated',
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

insert into public.artists (id, slug, name)
values ('00000000-0000-0000-0000-000000000302', 'avatar-test-artist', 'Avatar test artist');

insert into public.avatar_assets (id, artist_id, image_path, sort_order, is_active)
values (
  '00000000-0000-0000-0000-000000000303',
  '00000000-0000-0000-0000-000000000302',
  '00000000-0000-0000-0000-000000000302/avatars/test.webp',
  1,
  true
);

do $$
begin
  update public.profiles
    set avatar_asset_id = '00000000-0000-0000-0000-000000000303'
    where id = '00000000-0000-0000-0000-000000000301';

  if not exists (
    select 1 from public.profiles
    where id = '00000000-0000-0000-0000-000000000301'
      and avatar_asset_id = '00000000-0000-0000-0000-000000000303'
  ) then
    raise exception 'active avatar selection was not saved';
  end if;

  update public.avatar_assets
    set is_active = false
    where id = '00000000-0000-0000-0000-000000000303';

  if exists (
    select 1 from public.profiles
    where id = '00000000-0000-0000-0000-000000000301'
      and avatar_asset_id is not null
  ) then
    raise exception 'inactive avatar did not fall back to default';
  end if;

  update public.profiles
    set avatar_asset_id = '00000000-0000-0000-0000-000000000303'
    where id = '00000000-0000-0000-0000-000000000301';

  if exists (
    select 1 from public.profiles
    where id = '00000000-0000-0000-0000-000000000301'
      and avatar_asset_id is not null
  ) then
    raise exception 'inactive avatar selection was not normalized';
  end if;

  update public.avatar_assets
    set is_active = true
    where id = '00000000-0000-0000-0000-000000000303';
  update public.profiles
    set avatar_asset_id = '00000000-0000-0000-0000-000000000303'
    where id = '00000000-0000-0000-0000-000000000301';
  delete from public.avatar_assets
    where id = '00000000-0000-0000-0000-000000000303';

  if exists (
    select 1 from public.profiles
    where id = '00000000-0000-0000-0000-000000000301'
      and avatar_asset_id is not null
  ) then
    raise exception 'deleted avatar did not fall back to default';
  end if;
end;
$$;

select pass('avatar selection and fallback checks');

rollback;
