begin;

-- Keep denormalized artist IDs aligned across content relationships. Foreign
-- keys alone validate existence, not that both sides belong to the same artist.
do $$
begin
  if exists (
    select 1
    from public.artist_gallery as gallery
    left join public.albums as album
      on album.id = gallery.album_id
    left join public.artist_members as member
      on member.id = gallery.member_id
    where (gallery.album_id is not null and album.artist_id is distinct from gallery.artist_id)
       or (gallery.member_id is not null and member.artist_id is distinct from gallery.artist_id)
  ) then
    raise exception 'existing artist_gallery rows have cross-artist references';
  end if;
  if exists (
    select 1
    from public.artist_scene_members as region
    join public.artist_scenes as scene on scene.id = region.scene_id
    join public.artist_members as member on member.id = region.member_id
    where scene.artist_id is distinct from member.artist_id
  ) then
    raise exception 'existing artist_scene_members rows have cross-artist references';
  end if;
end;
$$;

create or replace function public.enforce_artist_gallery_ownership()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.album_id is not null and not exists (
    select 1 from public.albums
    where id = new.album_id and artist_id = new.artist_id
  ) then
    raise exception 'gallery album belongs to another artist' using errcode = '23514';
  end if;
  if new.member_id is not null and not exists (
    select 1 from public.artist_members
    where id = new.member_id and artist_id = new.artist_id
  ) then
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
begin
  if not exists (
    select 1
    from public.artist_scenes as scene
    join public.artist_members as member on member.id = new.member_id
    where scene.id = new.scene_id and scene.artist_id = member.artist_id
  ) then
    raise exception 'scene member belongs to another artist' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.prevent_album_artist_mismatch()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.artist_id is distinct from old.artist_id and exists (
    select 1 from public.artist_gallery
    where album_id = new.id and artist_id is distinct from new.artist_id
  ) then
    raise exception 'album artist cannot change while gallery references disagree' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.prevent_member_artist_mismatch()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.artist_id is distinct from old.artist_id and (
    exists (
      select 1 from public.artist_gallery
      where member_id = new.id and artist_id is distinct from new.artist_id
    ) or exists (
      select 1
      from public.artist_scene_members as region
      join public.artist_scenes as scene on scene.id = region.scene_id
      where region.member_id = new.id and scene.artist_id is distinct from new.artist_id
    )
  ) then
    raise exception 'member artist cannot change while references disagree' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.prevent_scene_artist_mismatch()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.artist_id is distinct from old.artist_id and exists (
    select 1
    from public.artist_scene_members as region
    join public.artist_members as member on member.id = region.member_id
    where region.scene_id = new.id and member.artist_id is distinct from new.artist_id
  ) then
    raise exception 'scene artist cannot change while member references disagree' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists artist_gallery_ownership on public.artist_gallery;
create trigger artist_gallery_ownership
  before insert or update of artist_id, album_id, member_id on public.artist_gallery
  for each row execute function public.enforce_artist_gallery_ownership();

drop trigger if exists artist_scene_member_ownership on public.artist_scene_members;
create trigger artist_scene_member_ownership
  before insert or update of scene_id, member_id on public.artist_scene_members
  for each row execute function public.enforce_artist_scene_member_ownership();

drop trigger if exists albums_artist_reference_integrity on public.albums;
create trigger albums_artist_reference_integrity
  before update of artist_id on public.albums
  for each row execute function public.prevent_album_artist_mismatch();

drop trigger if exists artist_members_artist_reference_integrity on public.artist_members;
create trigger artist_members_artist_reference_integrity
  before update of artist_id on public.artist_members
  for each row execute function public.prevent_member_artist_mismatch();

drop trigger if exists artist_scenes_artist_reference_integrity on public.artist_scenes;
create trigger artist_scenes_artist_reference_integrity
  before update of artist_id on public.artist_scenes
  for each row execute function public.prevent_scene_artist_mismatch();

revoke all on function public.enforce_artist_gallery_ownership() from public, anon, authenticated, service_role;
revoke all on function public.enforce_artist_scene_member_ownership() from public, anon, authenticated, service_role;
revoke all on function public.prevent_album_artist_mismatch() from public, anon, authenticated, service_role;
revoke all on function public.prevent_member_artist_mismatch() from public, anon, authenticated, service_role;
revoke all on function public.prevent_scene_artist_mismatch() from public, anon, authenticated, service_role;

notify pgrst, 'reload schema';
commit;
