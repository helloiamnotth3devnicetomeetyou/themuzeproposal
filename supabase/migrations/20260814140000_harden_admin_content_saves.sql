begin;

-- Bound administrative JSON before jsonb_array_elements can expand it into an
-- unbounded amount of work.  The limits are intentionally shared by the small
-- content-save RPCs; individual editors never need more than 500 rows at once.
create or replace function public.assert_admin_save_payload(p_value jsonb)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if pg_column_size(p_value) > 1048576
    or (jsonb_typeof(p_value) = 'array' and jsonb_array_length(p_value) > 500) then
    raise exception 'ADMIN_SAVE_PAYLOAD_TOO_LARGE' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.assert_admin_save_ids(p_ids uuid[])
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if cardinality(p_ids) > 500 then
    raise exception 'ADMIN_SAVE_PAYLOAD_TOO_LARGE' using errcode = '22023';
  end if;
end;
$$;

-- Preserve the existing implementations and put a single cheap boundary in
-- front of every JSON/array administrative save.
alter function public.save_album_with_tracks(jsonb, jsonb) rename to save_album_with_tracks_impl;
create function public.save_album_with_tracks(p_album jsonb, p_tracks jsonb)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform public.assert_admin_save_payload(p_album);
  perform public.assert_admin_save_payload(p_tracks);
  return public.save_album_with_tracks_impl(p_album, p_tracks);
end;
$$;

alter function public.save_artist_gallery(uuid, jsonb, uuid[]) rename to save_artist_gallery_impl;
create function public.save_artist_gallery(p_artist_id uuid, p_items jsonb, p_removed_ids uuid[] default '{}')
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform public.assert_admin_save_payload(p_items);
  perform public.assert_admin_save_ids(coalesce(p_removed_ids, '{}'::uuid[]));
  perform public.save_artist_gallery_impl(p_artist_id, p_items, p_removed_ids);
end;
$$;

alter function public.save_artist_scenes(uuid, jsonb, uuid[], uuid[]) rename to save_artist_scenes_impl;
create function public.save_artist_scenes(p_artist_id uuid, p_scenes jsonb, p_removed_scene_ids uuid[] default '{}', p_removed_region_ids uuid[] default '{}')
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform public.assert_admin_save_payload(p_scenes);
  perform public.assert_admin_save_ids(coalesce(p_removed_scene_ids, '{}'::uuid[]));
  perform public.assert_admin_save_ids(coalesce(p_removed_region_ids, '{}'::uuid[]));
  perform public.save_artist_scenes_impl(p_artist_id, p_scenes, p_removed_scene_ids, p_removed_region_ids);
end;
$$;

alter function public.save_audition_campaign(jsonb, jsonb, uuid[]) rename to save_audition_campaign_impl;
create function public.save_audition_campaign(p_campaign jsonb, p_fields jsonb, p_removed_ids uuid[] default '{}')
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform public.assert_admin_save_payload(p_campaign);
  perform public.assert_admin_save_payload(p_fields);
  perform public.assert_admin_save_ids(coalesce(p_removed_ids, '{}'::uuid[]));
  perform public.save_audition_campaign_impl(p_campaign, p_fields, p_removed_ids);
end;
$$;

alter function public.save_home_hero_slides(jsonb, uuid[]) rename to save_home_hero_slides_impl;
create function public.save_home_hero_slides(p_slides jsonb, p_removed_ids uuid[] default '{}')
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform public.assert_admin_save_payload(p_slides);
  perform public.assert_admin_save_ids(coalesce(p_removed_ids, '{}'::uuid[]));
  perform public.save_home_hero_slides_impl(p_slides, p_removed_ids);
end;
$$;

alter function public.save_avatar_assets(uuid, jsonb, uuid[]) rename to save_avatar_assets_impl;
create function public.save_avatar_assets(p_artist_id uuid, p_items jsonb, p_delete_ids uuid[] default array[]::uuid[])
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform public.assert_admin_save_payload(p_items);
  perform public.assert_admin_save_ids(coalesce(p_delete_ids, '{}'::uuid[]));
  perform public.save_avatar_assets_impl(p_artist_id, p_items, p_delete_ids);
end;
$$;

-- Rebind the optimistic-lock wrappers after the implementation rename above.
create or replace function public.save_artist_gallery_checked(p_artist_id uuid, p_items jsonb, p_removed_ids uuid[], p_expected_updated_at timestamptz)
returns timestamptz language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select updated_at into v_updated_at from public.artists where id = p_artist_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if p_expected_updated_at is null or v_updated_at is distinct from p_expected_updated_at then raise exception 'STALE_WRITE' using errcode = 'P0003'; end if;
  perform public.save_artist_gallery(p_artist_id, p_items, coalesce(p_removed_ids, '{}'::uuid[]));
  update public.artists set updated_at = clock_timestamp() where id = p_artist_id returning updated_at into v_updated_at;
  return v_updated_at;
end;
$$;

create or replace function public.save_artist_scenes_checked(p_artist_id uuid, p_scenes jsonb, p_removed_scene_ids uuid[], p_removed_region_ids uuid[], p_expected_updated_at timestamptz)
returns timestamptz language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select updated_at into v_updated_at from public.artists where id = p_artist_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if p_expected_updated_at is null or v_updated_at is distinct from p_expected_updated_at then raise exception 'STALE_WRITE' using errcode = 'P0003'; end if;
  perform public.save_artist_scenes(p_artist_id, p_scenes, coalesce(p_removed_scene_ids, '{}'::uuid[]), coalesce(p_removed_region_ids, '{}'::uuid[]));
  update public.artists set updated_at = clock_timestamp() where id = p_artist_id returning updated_at into v_updated_at;
  return v_updated_at;
end;
$$;

create or replace function public.save_audition_campaign_checked(p_campaign jsonb, p_fields jsonb, p_removed_ids uuid[], p_expected_updated_at timestamptz)
returns timestamptz language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_id uuid; v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  v_id := nullif(p_campaign->>'id', '')::uuid;
  select updated_at into v_updated_at from public.audition_campaigns where id = v_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if p_expected_updated_at is null or v_updated_at is distinct from p_expected_updated_at then raise exception 'STALE_WRITE' using errcode = 'P0003'; end if;
  perform public.save_audition_campaign(p_campaign, p_fields, coalesce(p_removed_ids, '{}'::uuid[]));
  select updated_at into v_updated_at from public.audition_campaigns where id = v_id;
  return v_updated_at;
end;
$$;

create or replace function public.save_home_hero_slides_checked(p_slides jsonb, p_removed_ids uuid[], p_expected_updated_at timestamptz)
returns timestamptz language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select updated_at into v_updated_at from public.home_hero_slide_revisions where id for update;
  if p_expected_updated_at is null or v_updated_at is distinct from p_expected_updated_at then raise exception 'STALE_WRITE' using errcode = 'P0003'; end if;
  perform public.save_home_hero_slides(p_slides, coalesce(p_removed_ids, '{}'::uuid[]));
  update public.home_hero_slide_revisions set updated_at = clock_timestamp() where id returning updated_at into v_updated_at;
  return v_updated_at;
end;
$$;

-- FK columns alone permit a gallery/scene row to mix two artists.  Check the
-- ownership relation at the table boundary so RPCs and direct writes agree.
create or replace function public.enforce_artist_gallery_ownership()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.album_id is not null and not exists (
    select 1 from public.albums where id = new.album_id and artist_id = new.artist_id for update
  ) then
    raise exception 'ARTIST_CONTENT_REFERENCE_DOES_NOT_BELONG_TO_ARTIST' using errcode = '23514';
  end if;
  if new.member_id is not null and not exists (
    select 1 from public.artist_members where id = new.member_id and artist_id = new.artist_id for update
  ) then
    raise exception 'ARTIST_CONTENT_REFERENCE_DOES_NOT_BELONG_TO_ARTIST' using errcode = '23514';
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
    select 1 from public.artist_scenes scene
    join public.artist_members member on member.id = new.member_id
    where scene.id = new.scene_id and member.artist_id = scene.artist_id
    for update of scene, member
  ) then
    raise exception 'SCENE_MEMBER_DOES_NOT_BELONG_TO_ARTIST' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists artist_gallery_reference_owner on public.artist_gallery;
create trigger artist_gallery_reference_owner
before insert or update of artist_id, album_id, member_id on public.artist_gallery
for each row execute function public.enforce_artist_gallery_ownership();
drop trigger if exists artist_scene_member_reference_owner on public.artist_scene_members;
create trigger artist_scene_member_reference_owner
before insert or update of scene_id, member_id on public.artist_scene_members
for each row execute function public.enforce_artist_scene_member_ownership();

create or replace function public.prevent_artist_content_reference_reassignment()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if new.artist_id is distinct from old.artist_id and (
    (tg_table_name = 'albums' and exists (select 1 from public.artist_gallery where album_id = old.id))
    or (tg_table_name = 'artist_members' and (exists (select 1 from public.artist_gallery where member_id = old.id) or exists (select 1 from public.artist_scene_members where member_id = old.id)))
  ) then
    raise exception 'ARTIST_CONTENT_REFERENCE_REASSIGNMENT_FORBIDDEN' using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists album_artist_content_reference_reassignment on public.albums;
create trigger album_artist_content_reference_reassignment before update of artist_id on public.albums
for each row execute function public.prevent_artist_content_reference_reassignment();
drop trigger if exists artist_member_content_reference_reassignment on public.artist_members;
create trigger artist_member_content_reference_reassignment before update of artist_id on public.artist_members
for each row execute function public.prevent_artist_content_reference_reassignment();

create function public.save_artist_content_checked(
  p_artist_id uuid, p_gallery_items jsonb, p_gallery_removed_ids uuid[],
  p_scenes jsonb, p_removed_scene_ids uuid[], p_removed_region_ids uuid[],
  p_expected_updated_at timestamptz
) returns timestamptz
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select updated_at into v_updated_at from public.artists where id = p_artist_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if p_expected_updated_at is null or v_updated_at is distinct from p_expected_updated_at then
    raise exception 'STALE_WRITE' using errcode = 'P0003';
  end if;
  perform public.save_artist_gallery(p_artist_id, p_gallery_items, coalesce(p_gallery_removed_ids, '{}'::uuid[]));
  perform public.save_artist_scenes(p_artist_id, p_scenes, coalesce(p_removed_scene_ids, '{}'::uuid[]), coalesce(p_removed_region_ids, '{}'::uuid[]));
  update public.artists set updated_at = clock_timestamp() where id = p_artist_id returning updated_at into v_updated_at;
  return v_updated_at;
end;
$$;

revoke all on function public.assert_admin_save_payload(jsonb), public.assert_admin_save_ids(uuid[]), public.enforce_artist_gallery_ownership(), public.enforce_artist_scene_member_ownership(), public.prevent_artist_content_reference_reassignment() from public, anon, authenticated;
revoke all on function public.save_album_with_tracks_impl(jsonb, jsonb), public.save_artist_gallery_impl(uuid, jsonb, uuid[]), public.save_artist_scenes_impl(uuid, jsonb, uuid[], uuid[]), public.save_audition_campaign_impl(jsonb, jsonb, uuid[]), public.save_home_hero_slides_impl(jsonb, uuid[]), public.save_avatar_assets_impl(uuid, jsonb, uuid[]) from public, anon, authenticated;
revoke all on function public.save_album_with_tracks(jsonb, jsonb), public.save_artist_gallery(uuid, jsonb, uuid[]), public.save_artist_scenes(uuid, jsonb, uuid[], uuid[]), public.save_audition_campaign(jsonb, jsonb, uuid[]), public.save_home_hero_slides(jsonb, uuid[]), public.save_avatar_assets(uuid, jsonb, uuid[]) from public, anon;
revoke all on function public.save_artist_content_checked(uuid, jsonb, uuid[], jsonb, uuid[], uuid[], timestamptz) from public, anon;
grant execute on function public.save_album_with_tracks(jsonb, jsonb), public.save_avatar_assets(uuid, jsonb, uuid[]) to authenticated, service_role;
grant execute on function public.save_artist_gallery(uuid, jsonb, uuid[]), public.save_artist_scenes(uuid, jsonb, uuid[], uuid[]), public.save_audition_campaign(jsonb, jsonb, uuid[]), public.save_home_hero_slides(jsonb, uuid[]) to service_role;
grant execute on function public.save_artist_content_checked(uuid, jsonb, uuid[], jsonb, uuid[], uuid[], timestamptz) to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
