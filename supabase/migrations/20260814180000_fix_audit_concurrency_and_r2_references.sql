begin;

-- Serialize every write that introduces a bucket-relative asset reference with
-- the matching delete reservation.  URL-shaped references already take this
-- lock in assert_no_reserved_asset_urls.
create or replace function public.assert_no_reserved_asset_path(p_bucket text, p_path text)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if p_path is null then return; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_bucket || chr(31) || p_path, 0));
  if exists (select 1 from public.asset_registry where bucket = p_bucket and path = p_path) then
    raise exception 'asset is reserved for deletion' using errcode = '55P03';
  end if;
end;
$$;

create or replace function public.reject_reserved_r2_asset_reference()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_column text; v_value text; v_path text;
begin
  for v_column, v_value in select key, value from jsonb_each_text(to_jsonb(new)) loop
    if v_value is not null and not (tg_table_name = 'site_settings' and v_column = 'value') then
      perform public.assert_no_reserved_asset_urls(v_value, array['artist-assets', 'album-covers', 'track-assets', 'business-assets', 'hero-videos']);
    end if;
  end loop;
  if tg_table_name = 'site_settings' then
    for v_value in select value from jsonb_each_text(case when jsonb_typeof(to_jsonb(new)->'value') = 'object' then to_jsonb(new)->'value' else '{}'::jsonb end) loop
      perform public.assert_no_reserved_asset_urls(v_value, array['business-assets']);
    end loop;
  elsif tg_table_name = 'avatar_assets' then
    perform public.assert_no_reserved_asset_path('artist-assets', to_jsonb(new)->>'image_path');
  elsif tg_table_name = 'contact_inquiries' then
    perform public.assert_no_reserved_asset_path('contact-attachments', to_jsonb(new)->>'attachment_path');
  elsif tg_table_name = 'protect_report_attachments' then
    perform public.assert_no_reserved_asset_path('protect-evidence', to_jsonb(new)->>'file_path');
  elsif tg_table_name = 'audition_submissions' and jsonb_typeof(to_jsonb(new)->'answers') = 'object' then
    for v_path in select value->>'path' from jsonb_each(to_jsonb(new)->'answers')
      where jsonb_typeof(value) = 'object' and jsonb_typeof(value->'path') = 'string'
    loop
      perform public.assert_no_reserved_asset_path('audition-attachments', v_path);
    end loop;
  end if;
  return new;
end;
$$;

create or replace function public.complete_r2_asset_deletions(p_bucket text, p_paths text[], p_actor_id uuid, p_reservation_id uuid)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_count integer; v_path text;
begin
  for v_path in select distinct path from unnest(p_paths) as requested(path) order by path loop
    perform pg_advisory_xact_lock(hashtextextended(p_bucket || chr(31) || v_path, 0));
  end loop;
  delete from public.asset_registry where bucket = p_bucket and path = any(p_paths)
    and reserved_by = p_actor_id and reservation_id = p_reservation_id;
  get diagnostics v_count = row_count;
  if v_count <> cardinality(p_paths) then raise exception 'asset deletion reservation not found' using errcode = '55P03'; end if;
end;
$$;

create function public.save_album_with_tracks_checked(p_album jsonb, p_tracks jsonb, p_expected_updated_at timestamptz)
returns timestamptz language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_artist_id uuid; v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  v_artist_id := (p_album->>'artist_id')::uuid;
  select updated_at into v_updated_at from public.artists where id = v_artist_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if p_expected_updated_at is null or v_updated_at is distinct from p_expected_updated_at then raise exception 'STALE_WRITE' using errcode = 'P0003'; end if;
  perform public.save_album_with_tracks(p_album, p_tracks);
  update public.artists set updated_at = clock_timestamp() where id = v_artist_id returning updated_at into v_updated_at;
  return v_updated_at;
end;
$$;

create function public.reorder_albums_checked(p_artist_id uuid, p_album_ids uuid[], p_expected_updated_at timestamptz)
returns timestamptz language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select updated_at into v_updated_at from public.artists where id = p_artist_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if p_expected_updated_at is null or v_updated_at is distinct from p_expected_updated_at then raise exception 'STALE_WRITE' using errcode = 'P0003'; end if;
  perform public.reorder_albums(p_artist_id, p_album_ids);
  update public.artists set updated_at = clock_timestamp() where id = p_artist_id returning updated_at into v_updated_at;
  return v_updated_at;
end;
$$;

create function public.reorder_artist_members_checked(p_artist_id uuid, p_member_ids uuid[], p_expected_updated_at timestamptz)
returns timestamptz language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select updated_at into v_updated_at from public.artists where id = p_artist_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if p_expected_updated_at is null or v_updated_at is distinct from p_expected_updated_at then raise exception 'STALE_WRITE' using errcode = 'P0003'; end if;
  perform public.reorder_artist_members(p_artist_id, p_member_ids);
  update public.artists set updated_at = clock_timestamp() where id = p_artist_id returning updated_at into v_updated_at;
  return v_updated_at;
end;
$$;

create function public.save_avatar_assets_checked(p_artist_id uuid, p_items jsonb, p_delete_ids uuid[], p_expected_updated_at timestamptz)
returns timestamptz language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select updated_at into v_updated_at from public.artists where id = p_artist_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if p_expected_updated_at is null or v_updated_at is distinct from p_expected_updated_at then raise exception 'STALE_WRITE' using errcode = 'P0003'; end if;
  perform public.save_avatar_assets(p_artist_id, p_items, p_delete_ids);
  update public.artists set updated_at = clock_timestamp() where id = p_artist_id returning updated_at into v_updated_at;
  return v_updated_at;
end;
$$;

create function public.save_home_hero_slide_video_checked(p_slide_id uuid, p_video_url text, p_expected_updated_at timestamptz)
returns timestamptz language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select updated_at into v_updated_at from public.home_hero_slide_revisions where id for update;
  if p_expected_updated_at is null or v_updated_at is distinct from p_expected_updated_at then raise exception 'STALE_WRITE' using errcode = 'P0003'; end if;
  update public.home_hero_slides set video_url = p_video_url where id = p_slide_id;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  update public.home_hero_slide_revisions set updated_at = clock_timestamp() where id returning updated_at into v_updated_at;
  return v_updated_at;
end;
$$;

revoke all on function public.assert_no_reserved_asset_path(text, text), public.save_album_with_tracks_checked(jsonb, jsonb, timestamptz), public.reorder_albums_checked(uuid, uuid[], timestamptz), public.reorder_artist_members_checked(uuid, uuid[], timestamptz), public.save_avatar_assets_checked(uuid, jsonb, uuid[], timestamptz), public.save_home_hero_slide_video_checked(uuid, text, timestamptz) from public, anon;
revoke all on function public.save_album_with_tracks(jsonb, jsonb), public.save_avatar_assets(uuid, jsonb, uuid[]), public.reorder_albums(uuid, uuid[]), public.reorder_artist_members(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.save_album_with_tracks(jsonb, jsonb), public.save_avatar_assets(uuid, jsonb, uuid[]), public.reorder_albums(uuid, uuid[]), public.reorder_artist_members(uuid, uuid[]) to service_role;
grant execute on function public.save_album_with_tracks_checked(jsonb, jsonb, timestamptz), public.reorder_albums_checked(uuid, uuid[], timestamptz), public.reorder_artist_members_checked(uuid, uuid[], timestamptz), public.save_avatar_assets_checked(uuid, jsonb, uuid[], timestamptz), public.save_home_hero_slide_video_checked(uuid, text, timestamptz) to authenticated, service_role;
notify pgrst, 'reload schema';
commit;
