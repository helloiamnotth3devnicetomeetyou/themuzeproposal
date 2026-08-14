begin;

select plan(5);

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
) values (
  '30000000-0000-0000-0000-000000000001',
  'discography-logo-admin@example.com',
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
where id = '30000000-0000-0000-0000-000000000001';

insert into public.artists (id, slug, name)
values (
  '30000000-0000-0000-0000-000000000002',
  'discography-logo-artist',
  'Discography logo artist'
);
insert into public.albums (
  id,
  artist_id,
  slug,
  title,
  type,
  typo_logo_url
) values (
  '30000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000002',
  'discography-logo-album',
  'Discography logo album',
  'Single',
  'https://cdn.example.com/album-logo.svg'
);
insert into public.tracks (id, album_id, title, track_number, logo_url)
values (
  '30000000-0000-0000-0000-000000000004',
  '30000000-0000-0000-0000-000000000003',
  'Discography logo track',
  1,
  'https://cdn.example.com/track-logo.svg'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","email":"discography-logo-admin@example.com"}',
  true
);
select set_config(
  'test.discography_artist_updated_at',
  (select updated_at::text from public.artists where id = '30000000-0000-0000-0000-000000000002'),
  true
);
set local role authenticated;

select ok(
  public.save_album_with_tracks_checked(
    jsonb_build_object(
      'id', '30000000-0000-0000-0000-000000000003',
      'artist_id', '30000000-0000-0000-0000-000000000002',
      'title', 'Updated album',
      'type', 'Single',
      'typo_logo_url', 'https://cdn.example.com/album-logo-new.svg'
    ),
    jsonb_build_array(jsonb_build_object(
      'id', '30000000-0000-0000-0000-000000000004',
      'title', 'Updated track',
      'logo_url', 'https://cdn.example.com/track-logo-new.svg'
    )),
    current_setting('test.discography_artist_updated_at')::timestamptz
  ) is not null,
  'album save succeeds through the checked RPC'
);

select is(
  (select typo_logo_url from public.albums
   where id = '30000000-0000-0000-0000-000000000003'),
  'https://cdn.example.com/album-logo-new.svg',
  'album typography logo is saved'
);
select is(
  (select logo_url from public.tracks
   where id = '30000000-0000-0000-0000-000000000004'),
  'https://cdn.example.com/track-logo-new.svg',
  'track logo is saved'
);

-- Older callers omitted both logo keys; that must not erase existing values.
select public.save_album_with_tracks_checked(
  jsonb_build_object(
    'id', '30000000-0000-0000-0000-000000000003',
    'artist_id', '30000000-0000-0000-0000-000000000002',
    'title', 'Updated again',
    'type', 'Single'
  ),
  jsonb_build_array(jsonb_build_object(
    'id', '30000000-0000-0000-0000-000000000004',
    'title', 'Updated track again'
  )),
  (select updated_at from public.artists where id = '30000000-0000-0000-0000-000000000002')
);

select is(
  (select typo_logo_url from public.albums
   where id = '30000000-0000-0000-0000-000000000003'),
  'https://cdn.example.com/album-logo-new.svg',
  'omitted album logo is preserved'
);
select is(
  (select logo_url from public.tracks
   where id = '30000000-0000-0000-0000-000000000004'),
  'https://cdn.example.com/track-logo-new.svg',
  'omitted track logo is preserved'
);

rollback;
