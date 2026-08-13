begin;

select plan(1);

do $$
begin
  if to_regprocedure('public.handle_new_user()') is not null then
    raise exception 'development admin-promotion function still exists';
  end if;
  if to_regprocedure('public.check_login_rate_limit(text,text)') is not null
    or to_regprocedure('public.record_login_attempt(text,text,boolean)') is not null
    or to_regprocedure('public.reset_login_rate_limit(text)') is not null then
    raise exception 'legacy non-atomic login rate-limit functions still exist';
  end if;
  if has_function_privilege('anon', 'public.consume_login_rate_limit(text,text)', 'execute')
    or has_function_privilege('authenticated', 'public.consume_login_rate_limit(text,text)', 'execute')
    or has_function_privilege('anon', 'public.reset_login_rate_limit(text,text)', 'execute')
    or has_function_privilege('authenticated', 'public.reset_login_rate_limit(text,text)', 'execute') then
    raise exception 'login rate-limit functions are exposed to Data API roles';
  end if;
  if not has_function_privilege('service_role', 'public.consume_login_rate_limit(text,text)', 'execute')
    or not has_function_privilege('service_role', 'public.reset_login_rate_limit(text,text)', 'execute') then
    raise exception 'service role cannot execute login rate-limit functions';
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_default_acl as defaults
    cross join lateral aclexplode(defaults.defaclacl) as permission
    left join pg_namespace as namespace on namespace.oid = defaults.defaclnamespace
    where namespace.nspname = 'public'
      and defaults.defaclrole = (select oid from pg_roles where rolname = 'postgres')
      and permission.grantee in (
        0,
        (select oid from pg_roles where rolname = 'anon'),
        (select oid from pg_roles where rolname = 'authenticated')
      )
      and permission.privilege_type in (
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE',
        'REFERENCES', 'TRIGGER', 'USAGE', 'EXECUTE'
      )
  ) then
    raise exception 'public schema still auto-grants future objects to Data API roles';
  end if;
end;
$$;

insert into public.artists (id, slug, name, is_active)
values (
  '10000000-0000-0000-0000-000000000001',
  'inactive-security-test',
  'Inactive security test',
  false
);

insert into public.artist_members (
  id, artist_id, slug, name
) values (
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'hidden-member',
  'Hidden member'
);

insert into public.albums (
  id, artist_id, slug, title, is_published, published_at
) values (
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  'hidden-album',
  'Hidden album',
  true,
  now() - interval '1 minute'
);

insert into public.tracks (
  id, album_id, title, track_number
) values (
  '10000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000003',
  'Hidden track',
  1
);

insert into public.artist_gallery (
  id, artist_id, image_url, is_published
) values (
  '10000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000001',
  'https://example.com/hidden-gallery.jpg',
  true
);

insert into public.artist_scenes (
  id, artist_id, title, image_url, is_published
) values (
  '10000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000001',
  'Hidden scene',
  'https://example.com/hidden-scene.jpg',
  true
);

insert into public.artist_scene_members (
  id, scene_id, member_id, outline
) values (
  '10000000-0000-0000-0000-000000000007',
  '10000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000002',
  '[{"x":0,"y":0},{"x":100,"y":0},{"x":50,"y":100}]'::jsonb
);

insert into public.artist_schedules (
  id, artist_id, event_date, category, title_ko, is_published
) values (
  '10000000-0000-0000-0000-000000000008',
  '10000000-0000-0000-0000-000000000001',
  current_date,
  'etc',
  'Hidden schedule',
  true
);

insert into public.notices (
  id, artist_id, title_ko, is_published, published_at
) values (
  '10000000-0000-0000-0000-000000000009',
  '10000000-0000-0000-0000-000000000001',
  'Hidden notice',
  true,
  now() - interval '1 minute'
), (
  '10000000-0000-0000-0000-000000000010',
  null,
  'Visible global notice',
  true,
  now() - interval '1 minute'
);

insert into public.home_hero_slides (
  id, album_id, is_active
) values (
  '10000000-0000-0000-0000-000000000011',
  '10000000-0000-0000-0000-000000000003',
  true
);

insert into public.site_settings (key, value)
values
  ('footer', '{"copyright":"Visible footer"}'::jsonb),
  ('internal_security_test', '{"token":"must-not-be-public"}'::jsonb);

set local role anon;

do $$
begin
  if exists (
    select 1 from public.artists
    where id = '10000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'inactive artist is visible to anon';
  end if;
  if exists (
    select 1 from public.artist_members
    where artist_id = '10000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'inactive artist member is visible to anon';
  end if;
  if exists (
    select 1 from public.albums
    where artist_id = '10000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'inactive artist album is visible to anon';
  end if;
  if exists (
    select 1 from public.tracks
    where id = '10000000-0000-0000-0000-000000000004'
  ) then
    raise exception 'inactive artist track is visible to anon';
  end if;
  if exists (
    select 1 from public.artist_gallery
    where artist_id = '10000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'inactive artist gallery is visible to anon';
  end if;
  if exists (
    select 1 from public.artist_scenes
    where artist_id = '10000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'inactive artist scene is visible to anon';
  end if;
  if exists (
    select 1 from public.artist_scene_members
    where id = '10000000-0000-0000-0000-000000000007'
  ) then
    raise exception 'inactive artist scene member is visible to anon';
  end if;
  if exists (
    select 1 from public.artist_schedules
    where artist_id = '10000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'inactive artist schedule is visible to anon';
  end if;
  if exists (
    select 1 from public.notices
    where id = '10000000-0000-0000-0000-000000000009'
  ) then
    raise exception 'inactive artist notice is visible to anon';
  end if;
  if exists (
    select 1 from public.home_hero_slides
    where id = '10000000-0000-0000-0000-000000000011'
  ) then
    raise exception 'inactive artist home slide is visible to anon';
  end if;
  if not exists (
    select 1 from public.notices
    where id = '10000000-0000-0000-0000-000000000010'
  ) then
    raise exception 'global notice was hidden by artist visibility policy';
  end if;
  if not exists (
    select 1 from public.site_settings where key = 'footer'
  ) then
    raise exception 'published site setting is hidden from anon';
  end if;
  if exists (
    select 1 from public.site_settings where key = 'internal_security_test'
  ) then
    raise exception 'non-public site setting is visible to anon';
  end if;
end;
$$;

select pass('database security boundary checks');

rollback;
