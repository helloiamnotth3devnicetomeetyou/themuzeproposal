begin;

alter table public.asset_registry
  add column if not exists reservation_id uuid,
  add column if not exists expires_at timestamptz;

update public.asset_registry
set expires_at = reserved_at + interval '30 minutes'
where expires_at is null;

alter table public.asset_registry
  alter column expires_at set default (now() + interval '30 minutes'),
  alter column expires_at set not null;

create index if not exists asset_registry_expires_at_idx
  on public.asset_registry (expires_at);

create or replace function public.reserve_r2_asset_deletions(
  p_bucket text,
  p_paths text[],
  p_actor_id uuid,
  p_reservation_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_path text;
begin
  if p_actor_id is null or p_reservation_id is null
    or p_bucket not in ('artist-assets', 'album-covers', 'track-assets', 'business-assets', 'hero-videos', 'audition-attachments')
    or p_paths is null or cardinality(p_paths) < 1 or cardinality(p_paths) > 100 then
    raise exception 'invalid asset deletion request' using errcode = '22023';
  end if;
  delete from public.asset_registry where expires_at <= now();
  for v_path in
    select distinct path from unnest(p_paths) as requested(path) order by path
  loop
    if v_path !~ '^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.[a-zA-Z0-9]+$' then
      raise exception 'invalid asset path' using errcode = '22023';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(p_bucket || chr(0) || v_path, 0));
    if exists (select 1 from public.asset_registry where bucket = p_bucket and path = v_path) then
      raise exception 'asset deletion already reserved' using errcode = '55P03';
    end if;
    if public.r2_asset_is_referenced(p_bucket, v_path) then
      raise exception 'asset is still referenced' using errcode = '23514';
    end if;
  end loop;
  insert into public.asset_registry (bucket, path, status, reserved_by, reservation_id, expires_at)
  select p_bucket, path, 'deleting', p_actor_id, p_reservation_id, now() + interval '30 minutes'
  from unnest(p_paths) as requested(path) group by path;
end;
$$;

create or replace function public.complete_r2_asset_deletions(
  p_bucket text, p_paths text[], p_actor_id uuid, p_reservation_id uuid
)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_count integer;
begin
  delete from public.asset_registry
  where bucket = p_bucket and path = any(p_paths) and reserved_by = p_actor_id
    and reservation_id = p_reservation_id;
  get diagnostics v_count = row_count;
  if v_count <> cardinality(p_paths) then
    raise exception 'asset deletion reservation not found' using errcode = '55P03';
  end if;
end;
$$;

create or replace function public.release_r2_asset_deletions(
  p_bucket text, p_paths text[], p_actor_id uuid, p_reservation_id uuid
)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_count integer;
begin
  delete from public.asset_registry
  where bucket = p_bucket and path = any(p_paths) and reserved_by = p_actor_id
    and reservation_id = p_reservation_id;
  get diagnostics v_count = row_count;
  if v_count <> cardinality(p_paths) then
    raise exception 'asset deletion reservation not found' using errcode = '55P03';
  end if;
end;
$$;

create or replace function public.expire_r2_asset_deletions()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  delete from public.asset_registry where expires_at <= now();
  return new;
end;
$$;

do $$
declare v_table text;
begin
  foreach v_table in array array[
    'artists', 'albums', 'artist_gallery', 'artist_members',
    'artist_scenes', 'artist_scene_members', 'tracks', 'home_hero_slides',
    'site_settings', 'avatar_assets', 'contact_inquiries',
    'protect_report_attachments', 'audition_submissions'
  ] loop
    execute format('drop trigger if exists expire_r2_asset_deletions on public.%I', v_table);
    execute format('create trigger expire_r2_asset_deletions before insert or update on public.%I for each row execute function public.expire_r2_asset_deletions()', v_table);
  end loop;
end;
$$;

revoke all on function public.reserve_r2_asset_deletions(text, text[], uuid, uuid) from public, anon, authenticated;
revoke all on function public.complete_r2_asset_deletions(text, text[], uuid, uuid) from public, anon, authenticated;
revoke all on function public.release_r2_asset_deletions(text, text[], uuid, uuid) from public, anon, authenticated;
grant execute on function public.reserve_r2_asset_deletions(text, text[], uuid, uuid) to service_role;
grant execute on function public.complete_r2_asset_deletions(text, text[], uuid, uuid) to service_role;
grant execute on function public.release_r2_asset_deletions(text, text[], uuid, uuid) to service_role;

notify pgrst, 'reload schema';
commit;
