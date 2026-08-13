begin;

-- The ownership checks in 20260813150000 are intentionally kept as triggers,
-- because artist_gallery and artist_scene_members denormalize their parent
-- relationships.  A plain existence check is not enough, though: a parent
-- artist_id update and a child insert can otherwise both pass their checks
-- against the same snapshot and commit a cross-artist relationship.
--
create or replace function public.enforce_artist_gallery_ownership()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_album_artist_id uuid;
  v_member_artist_id uuid;
begin
  -- The parent row lock conflicts with an in-flight artist_id UPDATE.  Read
  -- the artist ID from the same locking query so the validation is performed
  -- against the version that we actually locked.
  if new.album_id is not null then
    select album.artist_id
      into v_album_artist_id
    from public.albums as album
    where album.id = new.album_id
    for update;
  end if;
  if new.member_id is not null then
    select member.artist_id
      into v_member_artist_id
    from public.artist_members as member
    where member.id = new.member_id
    for update;
  end if;

  if new.album_id is not null and v_album_artist_id is distinct from new.artist_id then
    raise exception 'gallery album belongs to another artist' using errcode = '23514';
  end if;
  if new.member_id is not null and v_member_artist_id is distinct from new.artist_id then
    raise exception 'gallery member belongs to another artist' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_artist_scene_member_ownership()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_scene_artist_id uuid;
  v_member_artist_id uuid;
begin
  -- Lock in a fixed order (scene, then member) so concurrent relationship
  -- writes cannot deadlock while they validate the two parent rows.
  select scene.artist_id
    into v_scene_artist_id
  from public.artist_scenes as scene
  where scene.id = new.scene_id
  for update;
  select member.artist_id
    into v_member_artist_id
  from public.artist_members as member
  where member.id = new.member_id
  for update;

  if v_scene_artist_id is distinct from v_member_artist_id then
    raise exception 'scene member belongs to another artist' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_artist_gallery_ownership() from public, anon, authenticated, service_role;
revoke all on function public.enforce_artist_scene_member_ownership() from public, anon, authenticated, service_role;

notify pgrst, 'reload schema';
commit;
