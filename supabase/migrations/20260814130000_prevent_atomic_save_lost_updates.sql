begin;

create function public.save_artist_gallery_checked(
  p_artist_id uuid, p_items jsonb, p_removed_ids uuid[], p_expected_updated_at timestamptz
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
  perform public.save_artist_gallery(p_artist_id, p_items, coalesce(p_removed_ids, '{}'::uuid[]));
  update public.artists set updated_at = clock_timestamp() where id = p_artist_id returning updated_at into v_updated_at;
  return v_updated_at;
end;
$$;

create function public.save_artist_scenes_checked(
  p_artist_id uuid, p_scenes jsonb, p_removed_scene_ids uuid[], p_removed_region_ids uuid[], p_expected_updated_at timestamptz
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
  perform public.save_artist_scenes(p_artist_id, p_scenes, coalesce(p_removed_scene_ids, '{}'::uuid[]), coalesce(p_removed_region_ids, '{}'::uuid[]));
  update public.artists set updated_at = clock_timestamp() where id = p_artist_id returning updated_at into v_updated_at;
  return v_updated_at;
end;
$$;

create function public.save_audition_campaign_checked(
  p_campaign jsonb, p_fields jsonb, p_removed_ids uuid[], p_expected_updated_at timestamptz
) returns timestamptz
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_id uuid; v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  v_id := nullif(p_campaign->>'id', '')::uuid;
  select updated_at into v_updated_at from public.audition_campaigns where id = v_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if p_expected_updated_at is null or v_updated_at is distinct from p_expected_updated_at then
    raise exception 'STALE_WRITE' using errcode = 'P0003';
  end if;
  perform public.save_audition_campaign(p_campaign, p_fields, coalesce(p_removed_ids, '{}'::uuid[]));
  select updated_at into v_updated_at from public.audition_campaigns where id = v_id;
  return v_updated_at;
end;
$$;

create table public.home_hero_slide_revisions (
  id boolean primary key default true check (id),
  updated_at timestamptz not null default now()
);
insert into public.home_hero_slide_revisions (id) values (true) on conflict do nothing;
alter table public.home_hero_slide_revisions enable row level security;

create function public.get_home_hero_slide_revision()
returns timestamptz language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select updated_at into v_updated_at from public.home_hero_slide_revisions where id;
  return v_updated_at;
end;
$$;

create function public.save_home_hero_slides_checked(
  p_slides jsonb, p_removed_ids uuid[], p_expected_updated_at timestamptz
) returns timestamptz
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select updated_at into v_updated_at from public.home_hero_slide_revisions where id for update;
  if p_expected_updated_at is null or v_updated_at is distinct from p_expected_updated_at then
    raise exception 'STALE_WRITE' using errcode = 'P0003';
  end if;
  perform public.save_home_hero_slides(p_slides, coalesce(p_removed_ids, '{}'::uuid[]));
  update public.home_hero_slide_revisions set updated_at = clock_timestamp() where id returning updated_at into v_updated_at;
  return v_updated_at;
end;
$$;

revoke all on function public.save_artist_gallery(uuid, jsonb, uuid[]) from authenticated;
revoke all on function public.save_artist_scenes(uuid, jsonb, uuid[], uuid[]) from authenticated;
revoke all on function public.save_audition_campaign(jsonb, jsonb, uuid[]) from authenticated;
revoke all on function public.save_home_hero_slides(jsonb, uuid[]) from authenticated;
revoke all on function public.save_artist_gallery_checked(uuid, jsonb, uuid[], timestamptz) from public, anon;
revoke all on function public.save_artist_scenes_checked(uuid, jsonb, uuid[], uuid[], timestamptz) from public, anon;
revoke all on function public.save_audition_campaign_checked(jsonb, jsonb, uuid[], timestamptz) from public, anon;
revoke all on function public.get_home_hero_slide_revision() from public, anon;
revoke all on function public.save_home_hero_slides_checked(jsonb, uuid[], timestamptz) from public, anon;
grant execute on function public.save_artist_gallery_checked(uuid, jsonb, uuid[], timestamptz), public.save_artist_scenes_checked(uuid, jsonb, uuid[], uuid[], timestamptz), public.save_audition_campaign_checked(jsonb, jsonb, uuid[], timestamptz), public.get_home_hero_slide_revision(), public.save_home_hero_slides_checked(jsonb, uuid[], timestamptz) to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
