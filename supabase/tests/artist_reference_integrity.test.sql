begin;

select plan(3);

select ok(
  position(
    'for update' in lower(pg_get_functiondef('public.enforce_artist_gallery_ownership()'::regprocedure))
  ) > 0
  and position(
    'for update' in lower(pg_get_functiondef('public.enforce_artist_scene_member_ownership()'::regprocedure))
  ) > 0,
  'artist reference checks lock both parent rows before validating ownership'
);

do $$
declare
  v_artist_a uuid := '20000000-0000-0000-0000-000000000001';
  v_artist_b uuid := '20000000-0000-0000-0000-000000000002';
  v_album_a uuid := '20000000-0000-0000-0000-000000000003';
  v_member_a uuid := '20000000-0000-0000-0000-000000000004';
  v_member_b uuid := '20000000-0000-0000-0000-000000000005';
  v_scene_a uuid := '20000000-0000-0000-0000-000000000006';
begin
  insert into public.artists (id, slug, name)
  values
    (v_artist_a, 'reference-integrity-a', 'Reference integrity A'),
    (v_artist_b, 'reference-integrity-b', 'Reference integrity B');
  insert into public.albums (id, artist_id, slug, title, type)
  values (v_album_a, v_artist_a, 'reference-integrity-album', 'Reference integrity album', 'single');
  insert into public.artist_members (id, artist_id, slug, name)
  values
    (v_member_a, v_artist_a, 'reference-integrity-member-a', 'Reference integrity member A'),
    (v_member_b, v_artist_b, 'reference-integrity-member-b', 'Reference integrity member B');
  insert into public.artist_scenes (id, artist_id, title, image_url)
  values (v_scene_a, v_artist_a, 'Reference integrity scene', 'https://example.com/reference-integrity.jpg');

  begin
    insert into public.artist_gallery (artist_id, album_id, image_url)
    values (v_artist_b, v_album_a, 'https://example.com/cross-artist-gallery.jpg');
    raise exception 'cross-artist gallery insert unexpectedly succeeded';
  exception when sqlstate '23514' then
    null;
  end;

  begin
    insert into public.artist_scene_members (scene_id, member_id, outline)
    values (
      v_scene_a,
      v_member_b,
      '[{"x":0,"y":0},{"x":100,"y":0},{"x":50,"y":100}]'::jsonb
    );
    raise exception 'cross-artist scene member insert unexpectedly succeeded';
  exception when sqlstate '23514' then
    null;
  end;

  insert into public.artist_gallery (artist_id, album_id, image_url)
  values (v_artist_a, v_album_a, 'https://example.com/valid-gallery.jpg');
end;
$$;

select pass('cross-artist gallery and scene-member references are rejected');

do $$
declare
  v_artist_a uuid := '20000000-0000-0000-0000-000000000001';
  v_artist_b uuid := '20000000-0000-0000-0000-000000000002';
  v_album_a uuid := '20000000-0000-0000-0000-000000000003';
begin
  begin
    update public.albums
    set artist_id = v_artist_b
    where id = v_album_a;
    raise exception 'parent artist update unexpectedly succeeded';
  exception when sqlstate '23514' then
    null;
  end;
end;
$$;

select pass('parent artist changes remain blocked while references exist');

rollback;
