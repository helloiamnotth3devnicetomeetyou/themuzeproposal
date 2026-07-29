begin;

-- Public content must follow the active state of its parent artist at the
-- database boundary, not only through application query conventions.
drop policy if exists "public read active home hero slides" on public.home_hero_slides;
create policy "public read active home hero slides"
on public.home_hero_slides for select
using (
  is_active = true
  and exists (
    select 1
    from public.albums
    join public.artists on artists.id = albums.artist_id
    where albums.id = home_hero_slides.album_id
      and albums.is_published = true
      and albums.published_at <= now()
      and artists.is_active = true
  )
);

drop policy if exists "public read published albums" on public.albums;
create policy "public read published albums"
on public.albums for select
using (
  is_published = true
  and published_at <= now()
  and exists (
    select 1
    from public.artists
    where artists.id = albums.artist_id
      and artists.is_active = true
  )
);

drop policy if exists "public read published gallery" on public.artist_gallery;
create policy "public read published gallery"
on public.artist_gallery for select
using (
  is_published = true
  and exists (
    select 1
    from public.artists
    where artists.id = artist_gallery.artist_id
      and artists.is_active = true
  )
);

drop policy if exists "public read published artist scenes" on public.artist_scenes;
create policy "public read published artist scenes"
on public.artist_scenes for select
using (
  is_published = true
  and exists (
    select 1
    from public.artists
    where artists.id = artist_scenes.artist_id
      and artists.is_active = true
  )
);

drop policy if exists "public read published artist schedules" on public.artist_schedules;
create policy "public read published artist schedules"
on public.artist_schedules for select
using (
  is_published = true
  and exists (
    select 1
    from public.artists
    where artists.id = artist_schedules.artist_id
      and artists.is_active = true
  )
);

drop policy if exists "public read published notices" on public.notices;
create policy "public read published notices"
on public.notices for select
using (
  is_published = true
  and published_at <= now()
  and (
    artist_id is null
    or exists (
      select 1
      from public.artists
      where artists.id = notices.artist_id
        and artists.is_active = true
    )
  )
);

drop policy if exists "public read published scene members" on public.artist_scene_members;
create policy "public read published scene members"
on public.artist_scene_members for select
using (
  exists (
    select 1
    from public.artist_scenes as scene
    join public.artists as artist on artist.id = scene.artist_id
    where scene.id = artist_scene_members.scene_id
      and scene.is_published = true
      and artist.is_active = true
  )
);

drop policy if exists "public read tracks for published albums" on public.tracks;
create policy "public read tracks for published albums"
on public.tracks for select
using (
  exists (
    select 1
    from public.albums
    join public.artists on artists.id = albums.artist_id
    where albums.id = tracks.album_id
      and albums.is_published = true
      and albums.published_at <= now()
      and artists.is_active = true
  )
);

-- Consume both identifier and IP counters before authentication. Upserts lock
-- each counter row, so concurrent requests cannot all pass a stale check.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.login_rate_limits (
  key_hash text primary key check (length(key_hash) = 64),
  failed_count integer not null check (failed_count > 0),
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

revoke all on table private.login_rate_limits from public, anon, authenticated;

create index if not exists login_rate_limits_updated_at_idx
  on private.login_rate_limits (updated_at);

create or replace function public.consume_login_rate_limit(
  p_identifier_hash text,
  p_ip_hash text
) returns table(is_allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  v_identifier_count integer;
  v_identifier_blocked_until timestamptz;
  v_ip_count integer;
  v_ip_blocked_until timestamptz;
  v_blocked_until timestamptz;
begin
  if length(p_identifier_hash) <> 64 or length(p_ip_hash) <> 64 then
    raise exception 'invalid rate limit key' using errcode = '22023';
  end if;

  insert into private.login_rate_limits as limits (
    key_hash, failed_count, window_started_at, blocked_until, updated_at
  ) values (
    p_identifier_hash, 1, now(), null, now()
  )
  on conflict (key_hash) do update set
    failed_count = case
      when limits.window_started_at < now() - interval '15 minutes' then 1
      else limits.failed_count + 1
    end,
    window_started_at = case
      when limits.window_started_at < now() - interval '15 minutes' then now()
      else limits.window_started_at
    end,
    blocked_until = case
      when limits.window_started_at < now() - interval '15 minutes' then null
      when limits.blocked_until > now() then limits.blocked_until
      when limits.failed_count + 1 >= 5 then now() + interval '15 minutes'
      else null
    end,
    updated_at = now()
  returning failed_count, blocked_until
    into v_identifier_count, v_identifier_blocked_until;

  insert into private.login_rate_limits as limits (
    key_hash, failed_count, window_started_at, blocked_until, updated_at
  ) values (
    p_ip_hash, 1, now(), null, now()
  )
  on conflict (key_hash) do update set
    failed_count = case
      when limits.window_started_at < now() - interval '15 minutes' then 1
      else limits.failed_count + 1
    end,
    window_started_at = case
      when limits.window_started_at < now() - interval '15 minutes' then now()
      else limits.window_started_at
    end,
    blocked_until = case
      when limits.window_started_at < now() - interval '15 minutes' then null
      when limits.blocked_until > now() then limits.blocked_until
      when limits.failed_count + 1 >= 20 then now() + interval '15 minutes'
      else null
    end,
    updated_at = now()
  returning failed_count, blocked_until
    into v_ip_count, v_ip_blocked_until;

  delete from private.login_rate_limits
  where updated_at < now() - interval '30 days';

  v_blocked_until := greatest(v_identifier_blocked_until, v_ip_blocked_until);

  return query select
    v_identifier_count <= 5 and v_ip_count <= 20,
    case
      when v_identifier_count <= 5 and v_ip_count <= 20 then 0
      else greatest(
        1,
        ceil(extract(epoch from (coalesce(v_blocked_until, now() + interval '15 minutes') - now())))::integer
      )
    end;
end;
$$;

create or replace function public.reset_login_rate_limit(
  p_identifier_hash text
) returns void
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  if length(p_identifier_hash) <> 64 then
    raise exception 'invalid rate limit key' using errcode = '22023';
  end if;

  delete from private.login_rate_limits
  where key_hash = p_identifier_hash;
end;
$$;

revoke all on function public.consume_login_rate_limit(text, text)
  from public, anon, authenticated;
revoke all on function public.reset_login_rate_limit(text)
  from public, anon, authenticated;
grant execute on function public.consume_login_rate_limit(text, text) to service_role;
grant execute on function public.reset_login_rate_limit(text) to service_role;

drop function if exists public.check_login_rate_limit(text, text);
drop function if exists public.record_login_attempt(text, text, boolean);

-- Remove the development-only trigger function that promoted every signup.
-- CASCADE also removes an unexpected legacy trigger if one still references it.
drop function if exists public.handle_new_user() cascade;

-- Trigger functions and privileged business functions are not public APIs.
revoke all on function public.create_profile_for_new_user()
  from public, anon, authenticated, service_role;
revoke all on function public.capture_admin_audit()
  from public, anon, authenticated, service_role;
revoke all on function public.set_contact_attachment_size_from_storage()
  from public, anon, authenticated;
revoke all on function public.set_updated_at()
  from public, anon, authenticated, service_role;

revoke all on function public.reorder_albums(uuid, uuid[])
  from public, anon;
revoke all on function public.save_album_with_tracks(jsonb, jsonb)
  from public, anon;
grant execute on function public.reorder_albums(uuid, uuid[])
  to authenticated, service_role;
grant execute on function public.save_album_with_tracks(jsonb, jsonb)
  to authenticated, service_role;

revoke all on function public.is_admin()
  from public, anon;
grant execute on function public.is_admin()
  to authenticated, service_role;

-- New public-schema objects start private. Each migration must opt into the
-- minimum required Data API privileges explicitly.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- Tighten existing object privileges while preserving RLS-gated admin CRUD.
revoke all on table
  public.albums,
  public.artist_gallery,
  public.artist_members,
  public.artist_scene_members,
  public.artist_scenes,
  public.artist_schedules,
  public.artists,
  public.home_hero_slides,
  public.notices,
  public.site_settings,
  public.tracks
from anon, authenticated;

grant select on table
  public.albums,
  public.artist_gallery,
  public.artist_members,
  public.artist_scene_members,
  public.artist_scenes,
  public.artist_schedules,
  public.artists,
  public.home_hero_slides,
  public.notices,
  public.site_settings,
  public.tracks
to anon;

grant select, insert, update, delete on table
  public.albums,
  public.artist_gallery,
  public.artist_members,
  public.artist_scene_members,
  public.artist_scenes,
  public.artist_schedules,
  public.artists,
  public.home_hero_slides,
  public.notices,
  public.site_settings,
  public.tracks
to authenticated;

revoke all on table public.profiles from anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
on public.profiles for insert
to authenticated
with check (
  id = auth.uid()
  and is_admin = false
  and email = coalesce(auth.jwt() ->> 'email', '')
);

revoke all on table public.protect_reports from anon, authenticated;
grant select, update, delete on table public.protect_reports to authenticated;

revoke all on table public.protect_report_attachments from anon, authenticated;
grant select, delete on table public.protect_report_attachments to authenticated;

revoke all on table public.contact_inquiries from anon, authenticated;
grant select, update, delete on table public.contact_inquiries to authenticated;

revoke all on table public.audition_submissions from anon, authenticated;
grant select, update on table public.audition_submissions to authenticated;

revoke all on table public.admin_audit_logs from anon, authenticated;
grant select on table public.admin_audit_logs to authenticated;
revoke all on sequence public.admin_audit_logs_id_seq from anon, authenticated;

notify pgrst, 'reload schema';

commit;
