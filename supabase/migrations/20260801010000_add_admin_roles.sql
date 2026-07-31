begin;

-- Null identifies an ordinary site account; only explicit roles can access the
-- studio. This prevents existing non-admin accounts from being promoted.
alter table public.profiles add column if not exists role text;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role is null or role in ('super_admin', 'editor'));

update public.profiles
set role = case when is_admin then 'super_admin' else null end
where role is null;

-- Replace the old boolean-dependent helper before removing that column.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('super_admin', 'editor')
  );
$$;

-- Remove policies and trigger definitions that still name the old column
-- before PostgreSQL removes it.
drop policy if exists "users insert own profile" on public.profiles;
drop policy if exists "users update own non-privileged fields" on public.profiles;
drop trigger if exists profiles_admin_role_audit on public.profiles;

-- Storage policies referencing profiles.is_admin directly need to be dropped or updated first
drop policy if exists "admin delete artist assets" on storage.objects;
drop policy if exists "admin delete music assets" on storage.objects;
drop policy if exists "admin delete album covers" on storage.objects;
drop policy if exists "admin delete track assets" on storage.objects;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, null)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

alter table public.profiles drop column if exists is_admin;

-- These RPCs previously checked the removed boolean column directly.
create or replace function public.reorder_albums(p_artist_id uuid, p_album_ids uuid[])
returns void
language plpgsql
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  if exists (
    select 1 from unnest(p_album_ids) id
    where not exists (select 1 from public.albums a where a.id = id and a.artist_id = p_artist_id)
  ) then
    raise exception 'album does not belong to this artist' using errcode = '22023';
  end if;

  update public.albums a
  set sort_order = ordered.position
  from unnest(p_album_ids) with ordinality as ordered(id, position)
  where a.id = ordered.id and a.artist_id = p_artist_id;
end;
$$;

create or replace function public.save_album_with_tracks(p_album jsonb, p_tracks jsonb)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_album_id uuid := coalesce(nullif(p_album->>'id', '')::uuid, gen_random_uuid());
  v_artist_id uuid := (p_album->>'artist_id')::uuid;
  v_existing public.albums%rowtype;
  v_track jsonb;
  v_track_id uuid;
  v_seen_ids uuid[] := array[]::uuid[];
  v_position integer := 0;
  v_published boolean := coalesce((p_album->>'is_published')::boolean, false);
  v_published_at timestamptz;
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  if coalesce(trim(p_album->>'title'), '') = '' or coalesce(trim(p_album->>'type'), '') = '' then
    raise exception 'album title and type are required' using errcode = '22023';
  end if;

  if v_published and (
    nullif(p_album->>'release_date', '') is null
    or nullif(p_album->>'cover_url', '') is null
    or jsonb_array_length(coalesce(p_tracks, '[]'::jsonb)) = 0
  ) then
    raise exception 'published albums require release date, cover and tracks' using errcode = '22023';
  end if;

  select * into v_existing from public.albums where id = v_album_id for update;
  v_published_at := case
    when not v_published then null
    when v_existing.id is not null and v_existing.is_published then v_existing.published_at
    else now()
  end;

  insert into public.albums (
    id, artist_id, slug, title, type, release_date, cover_url, hero_image_url, color,
    description_ko, description_en, description_ja, spotify_id, youtube_url,
    sort_order, is_published, published_at
  ) values (
    v_album_id, v_artist_id, v_album_id::text, trim(p_album->>'title'), trim(p_album->>'type'),
    nullif(p_album->>'release_date', '')::date, nullif(p_album->>'cover_url', ''), nullif(p_album->>'hero_image_url', ''),
    coalesce(nullif(p_album->>'color', ''), '#FC6FCF'), p_album->>'description_ko',
    p_album->>'description_en', p_album->>'description_ja', nullif(p_album->>'spotify_id', ''),
    nullif(p_album->>'youtube_url', ''),
    coalesce((p_album->>'sort_order')::integer, (select coalesce(max(sort_order), 0) + 1 from public.albums where artist_id = v_artist_id)),
    v_published, v_published_at
  )
  on conflict (id) do update set
    slug = excluded.slug, title = excluded.title, type = excluded.type,
    release_date = excluded.release_date, cover_url = excluded.cover_url, hero_image_url = excluded.hero_image_url, color = excluded.color,
    description_ko = excluded.description_ko, description_en = excluded.description_en,
    description_ja = excluded.description_ja, spotify_id = excluded.spotify_id,
    youtube_url = excluded.youtube_url, is_published = excluded.is_published,
    published_at = excluded.published_at;

  update public.tracks set track_number = track_number + 100000 where album_id = v_album_id;

  for v_track in select value from jsonb_array_elements(coalesce(p_tracks, '[]'::jsonb)) loop
    v_position := v_position + 1;
    if coalesce(trim(v_track->>'title'), '') = '' then
      raise exception 'all track titles are required' using errcode = '22023';
    end if;

    v_track_id := coalesce(nullif(v_track->>'id', '')::uuid, gen_random_uuid());
    v_seen_ids := array_append(v_seen_ids, v_track_id);

    insert into public.tracks (
      id, album_id, title, track_number, is_title,
      spotify_url, youtube_url, audio_url, music_video_url, logo_url
    ) values (
      v_track_id, v_album_id, trim(v_track->>'title'), v_position,
      coalesce((v_track->>'is_title')::boolean, false),
      nullif(v_track->>'spotify_url', ''), nullif(v_track->>'youtube_url', ''), nullif(v_track->>'audio_url', ''),
      nullif(v_track->>'music_video_url', ''), nullif(v_track->>'logo_url', '')
    )
    on conflict (id) do update set
      title = excluded.title, track_number = excluded.track_number,
      is_title = excluded.is_title, spotify_url = excluded.spotify_url,
      youtube_url = excluded.youtube_url, audio_url = excluded.audio_url,
      music_video_url = excluded.music_video_url, logo_url = excluded.logo_url;
  end loop;

  delete from public.tracks where album_id = v_album_id and not (id = any(v_seen_ids));
  return v_album_id;
end;
$$;

create or replace function public.has_admin_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = p_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('super_admin', 'editor')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_admin_role('super_admin');
$$;

revoke all on function public.has_admin_role(text) from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_super_admin() from public, anon;
grant execute on function public.has_admin_role(text) to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.is_super_admin() to authenticated, service_role;

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
on public.profiles for insert to authenticated
with check (
  id = auth.uid()
  and role is null
  and email = coalesce(auth.jwt() ->> 'email', '')
);

drop policy if exists "users update own non-privileged fields" on public.profiles;
create policy "users update own non-privileged fields"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role is not distinct from (
    select profiles_1.role from public.profiles as profiles_1
    where profiles_1.id = auth.uid()
  )
);

drop policy if exists "admins manage all profiles" on public.profiles;
create policy "super admins manage all profiles"
on public.profiles to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop trigger if exists profiles_admin_role_audit on public.profiles;
create trigger profiles_admin_role_audit
  after update of role on public.profiles
  for each row when (old.role is distinct from new.role)
  execute function public.capture_admin_audit('id', 'standard');

notify pgrst, 'reload schema';
commit;
