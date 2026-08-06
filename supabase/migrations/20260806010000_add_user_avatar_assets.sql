begin;

create table public.avatar_assets (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  image_path text not null unique,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint avatar_assets_image_path_check check (
    length(image_path) <= 500
    and image_path like artist_id::text || '/avatars/%'
  )
);

create index avatar_assets_artist_order_idx
  on public.avatar_assets (artist_id, sort_order, created_at);

alter table public.profiles
  add column avatar_asset_id uuid references public.avatar_assets(id) on delete set null;

create index profiles_avatar_asset_idx
  on public.profiles (avatar_asset_id)
  where avatar_asset_id is not null;

drop trigger if exists avatar_assets_set_updated_at on public.avatar_assets;
create trigger avatar_assets_set_updated_at
  before update on public.avatar_assets
  for each row execute function public.set_updated_at();

alter table public.avatar_assets enable row level security;

create policy "authenticated read active avatar assets"
  on public.avatar_assets
  for select
  to authenticated
  using (is_active or public.is_admin());

create policy "admins manage avatar assets"
  on public.avatar_assets
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.avatar_assets from public, anon, authenticated;
grant select, insert, update, delete on table public.avatar_assets to authenticated, service_role;

create or replace function public.normalize_profile_avatar()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.avatar_asset_id is not null
    and not exists (
      select 1
      from public.avatar_assets
      where id = new.avatar_asset_id
        and is_active = true
    ) then
    new.avatar_asset_id := null;
  end if;
  return new;
end;
$$;

revoke all on function public.normalize_profile_avatar() from public, anon, authenticated, service_role;

drop trigger if exists profiles_normalize_avatar on public.profiles;
create trigger profiles_normalize_avatar
  before insert or update of avatar_asset_id on public.profiles
  for each row execute function public.normalize_profile_avatar();

create or replace function public.clear_inactive_profile_avatars()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if old.is_active and not new.is_active then
    update public.profiles
      set avatar_asset_id = null
      where avatar_asset_id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function public.clear_inactive_profile_avatars() from public, anon, authenticated, service_role;

drop trigger if exists avatar_assets_clear_inactive_profiles on public.avatar_assets;
create trigger avatar_assets_clear_inactive_profiles
  after update of is_active on public.avatar_assets
  for each row
  when (old.is_active is distinct from new.is_active)
  execute function public.clear_inactive_profile_avatars();

create or replace function public.save_avatar_assets(
  p_artist_id uuid,
  p_items jsonb,
  p_delete_ids uuid[] default array[]::uuid[]
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_item record;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if not exists (select 1 from public.artists where id = p_artist_id) then
    raise exception 'Artist not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as item(id uuid)
    join public.avatar_assets existing on existing.id = item.id
    where existing.artist_id <> p_artist_id
  ) then
    raise exception 'Avatar asset belongs to another artist' using errcode = '23503';
  end if;

  delete from public.avatar_assets
  where artist_id = p_artist_id
    and id = any(coalesce(p_delete_ids, array[]::uuid[]));

  for v_item in
    select *
    from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb))
      as item(id uuid, image_path text, sort_order integer, is_active boolean)
  loop
    if v_item.id is null or nullif(v_item.image_path, '') is null then
      raise exception 'Invalid avatar asset' using errcode = '22023';
    end if;

    insert into public.avatar_assets (id, artist_id, image_path, sort_order, is_active)
    values (
      v_item.id,
      p_artist_id,
      v_item.image_path,
      greatest(coalesce(v_item.sort_order, 0), 0),
      coalesce(v_item.is_active, true)
    )
    on conflict (id) do update set
      image_path = excluded.image_path,
      sort_order = excluded.sort_order,
      is_active = excluded.is_active;
  end loop;
end;
$$;

revoke all on function public.save_avatar_assets(uuid, jsonb, uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.save_avatar_assets(uuid, jsonb, uuid[]) to authenticated, service_role;

drop trigger if exists avatar_assets_admin_audit on public.avatar_assets;
create trigger avatar_assets_admin_audit
  after insert or update or delete on public.avatar_assets
  for each row execute function public.capture_admin_audit('id', 'standard');

commit;
