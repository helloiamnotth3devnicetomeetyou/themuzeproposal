begin;

select plan(3);

insert into public.asset_registry (bucket, path, reserved_by, reservation_id, expires_at)
values ('artist-assets', 'audit/avatar.webp', gen_random_uuid(), gen_random_uuid(), now() + interval '5 minutes');

do $$
begin
  begin
    perform public.assert_no_reserved_asset_path('artist-assets', 'audit/avatar.webp');
    raise exception 'reserved relative asset path was accepted';
  exception when sqlstate '55P03' then null;
  end;
end;
$$;
select pass('reserved relative asset paths are rejected');

insert into auth.users (id, email, encrypted_password, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('70000000-0000-0000-0000-000000000001', 'audit-concurrency-admin@example.com', '', 'authenticated', 'authenticated', '{}'::jsonb, '{}'::jsonb, now(), now());
update public.profiles set role = 'super_admin' where id = '70000000-0000-0000-0000-000000000001';
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  begin
    perform public.save_home_hero_slide_video_checked(
      gen_random_uuid(), null,
      (select updated_at - interval '1 microsecond' from public.home_hero_slide_revisions where id)
    );
    raise exception 'stale hero video save was accepted';
  exception when sqlstate 'P0003' then null;
  end;
end;
$$;
select pass('stale hero video saves are rejected');

select ok(
  has_function_privilege('authenticated', 'public.save_album_with_tracks_checked(jsonb,jsonb,timestamptz)', 'execute')
  and has_function_privilege('authenticated', 'public.reorder_albums_checked(uuid,uuid[],timestamptz)', 'execute')
  and has_function_privilege('authenticated', 'public.reorder_artist_members_checked(uuid,uuid[],timestamptz)', 'execute')
  and has_function_privilege('authenticated', 'public.save_avatar_assets_checked(uuid,jsonb,uuid[],timestamptz)', 'execute'),
  'browser clients use the checked save RPCs'
);

rollback;
