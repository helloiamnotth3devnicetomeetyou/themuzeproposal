begin;

select plan(9);

insert into auth.users (
  id, email, encrypted_password, aud, role, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '40000000-0000-0000-0000-000000000001',
  'atomic-content-admin@example.com', '', 'authenticated', 'authenticated',
  '{}'::jsonb, '{}'::jsonb, now(), now()
);
update public.profiles
set role = 'super_admin'
where id = '40000000-0000-0000-0000-000000000001';

insert into public.artists (id, slug, name)
values
  ('40000000-0000-0000-0000-000000000002', 'atomic-content-a', 'Atomic content A'),
  ('40000000-0000-0000-0000-000000000003', 'atomic-content-b', 'Atomic content B');
insert into public.artist_members (id, artist_id, slug, name)
values
  ('40000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', 'atomic-member-a', 'Member A'),
  ('40000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000003', 'atomic-member-b', 'Member B');
insert into public.artist_gallery (id, artist_id, image_url)
values ('40000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000002', 'https://example.com/old-gallery.jpg');
insert into public.artist_scenes (id, artist_id, title, image_url)
values ('40000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000002', 'Old scene', 'https://example.com/old-scene.jpg');

select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-0000-0000-000000000001","role":"authenticated","email":"atomic-content-admin@example.com"}',
  true
);
set local role authenticated;

select public.save_artist_gallery_checked(
  '40000000-0000-0000-0000-000000000002',
  jsonb_build_array(jsonb_build_object(
    'id', '40000000-0000-0000-0000-000000000008',
    'artist_id', '40000000-0000-0000-0000-000000000002',
    'image_url', 'https://example.com/new-gallery.jpg'
  )),
  array['40000000-0000-0000-0000-000000000006']::uuid[],
  (select updated_at from public.artists where id = '40000000-0000-0000-0000-000000000002')
);
select ok(
  not exists (select 1 from public.artist_gallery where id = '40000000-0000-0000-0000-000000000006')
  and exists (select 1 from public.artist_gallery where id = '40000000-0000-0000-0000-000000000008'),
  'gallery save applies deletes and upserts together'
);

do $$
begin
  begin
    perform public.save_artist_gallery_checked(
      '40000000-0000-0000-0000-000000000002',
      jsonb_build_array(jsonb_build_object(
        'id', '40000000-0000-0000-0000-000000000005',
        'artist_id', '40000000-0000-0000-0000-000000000002',
        'image_url', 'https://example.com/foreign-gallery.jpg'
      )),
      array['40000000-0000-0000-0000-000000000008']::uuid[],
      (select updated_at from public.artists where id = '40000000-0000-0000-0000-000000000002')
    );
    raise exception 'foreign gallery row unexpectedly accepted';
  exception when sqlstate '22023' then
    null;
  end;
end;
$$;
select ok(
  exists (select 1 from public.artist_gallery where id = '40000000-0000-0000-0000-000000000008'),
  'gallery failure rolls back its delete'
);

select public.save_artist_scenes_checked(
  '40000000-0000-0000-0000-000000000002',
  jsonb_build_array(jsonb_build_object(
    'id', '40000000-0000-0000-0000-000000000009',
    'artist_id', '40000000-0000-0000-0000-000000000002',
    'title', 'New scene',
    'image_url', 'https://example.com/new-scene.jpg',
    'artist_scene_members', jsonb_build_array(jsonb_build_object(
      'id', '40000000-0000-0000-0000-00000000000a',
      'member_id', '40000000-0000-0000-0000-000000000004',
      'outline', '[{"x":0,"y":0},{"x":100,"y":0},{"x":50,"y":100}]'::jsonb
    ))
  )),
  array['40000000-0000-0000-0000-000000000007']::uuid[],
  '{}'::uuid[],
  (select updated_at from public.artists where id = '40000000-0000-0000-0000-000000000002')
);
select ok(
  not exists (select 1 from public.artist_scenes where id = '40000000-0000-0000-0000-000000000007')
  and exists (select 1 from public.artist_scene_members where id = '40000000-0000-0000-0000-00000000000a'),
  'scene save applies scene and region changes together'
);

do $$
begin
  begin
    perform public.save_artist_scenes_checked(
      '40000000-0000-0000-0000-000000000002',
      jsonb_build_array(jsonb_build_object(
        'id', '40000000-0000-0000-0000-00000000000b',
        'artist_id', '40000000-0000-0000-0000-000000000002',
        'title', 'Invalid scene',
        'image_url', 'https://example.com/invalid-scene.jpg',
        'artist_scene_members', jsonb_build_array(jsonb_build_object(
          'id', '40000000-0000-0000-0000-00000000000c',
          'member_id', '40000000-0000-0000-0000-000000000005',
          'outline', '[{"x":0,"y":0},{"x":100,"y":0},{"x":50,"y":100}]'::jsonb
        ))
      )),
      array['40000000-0000-0000-0000-000000000009']::uuid[],
      '{}'::uuid[],
      (select updated_at from public.artists where id = '40000000-0000-0000-0000-000000000002')
    );
    raise exception 'foreign scene region unexpectedly accepted';
  exception when sqlstate '23514' then
    null;
  end;
end;
$$;
select ok(
  exists (select 1 from public.artist_scenes where id = '40000000-0000-0000-0000-000000000009')
  and not exists (select 1 from public.artist_scenes where id = '40000000-0000-0000-0000-00000000000b'),
  'scene failure rolls back its delete and insert'
);

do $$
begin
  begin
    perform public.save_artist_gallery_checked(
      '40000000-0000-0000-0000-000000000002', '[]'::jsonb, '{}'::uuid[],
      (select updated_at - interval '1 microsecond' from public.artists where id = '40000000-0000-0000-0000-000000000002')
    );
    raise exception 'stale gallery save unexpectedly accepted';
  exception when sqlstate 'P0003' then null;
  end;
end;
$$;
select pass('stale artist content save is rejected');

select ok(has_function_privilege('authenticated', 'public.save_artist_gallery_checked(uuid,jsonb,uuid[],timestamptz)', 'execute'), 'admins can call checked gallery RPC');
select ok(has_function_privilege('authenticated', 'public.save_artist_scenes_checked(uuid,jsonb,uuid[],uuid[],timestamptz)', 'execute'), 'admins can call checked scene RPC');
select ok(not has_function_privilege('anon', 'public.save_artist_gallery_checked(uuid,jsonb,uuid[],timestamptz)', 'execute'), 'anon cannot call checked gallery RPC');
select ok(not has_function_privilege('anon', 'public.save_artist_scenes_checked(uuid,jsonb,uuid[],uuid[],timestamptz)', 'execute'), 'anon cannot call checked scene RPC');

rollback;
