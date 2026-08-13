begin;

-- R2 deletion used to check references and delete the object in two unrelated
-- operations.  Keep a short-lived database reservation around the R2 delete so
-- content writes cannot publish the same asset between those operations.
create table if not exists public.asset_registry (
  bucket text not null,
  path text not null,
  status text not null default 'deleting',
  reserved_by uuid,
  reserved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (bucket, path),
  constraint asset_registry_status_check check (status in ('deleting')),
  constraint asset_registry_path_check check (
    path ~ '^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.[a-zA-Z0-9]+$'
  )
);

alter table public.asset_registry enable row level security;
revoke all on table public.asset_registry from public, anon, authenticated;

create or replace function public.r2_asset_url_matches(
  p_bucket text,
  p_path text,
  p_url text
)
returns boolean
language sql
immutable
set search_path = pg_catalog, public
as $$
  select p_url is not null
    and right(
      split_part(split_part(p_url, '?', 1), '#', 1),
      length('/' || p_bucket || '/' || p_path)
    ) = '/' || p_bucket || '/' || p_path;
$$;

-- This is deliberately a fixed allowlist.  It keeps the lock key and the
-- reference scan in sync with the application upload allowlist.
create or replace function public.r2_asset_is_referenced(
  p_bucket text,
  p_path text
)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_bucket = 'artist-assets' then
    return exists (
      select 1 from public.artists
      where public.r2_asset_url_matches(p_bucket, p_path, logo_url)
         or public.r2_asset_url_matches(p_bucket, p_path, image_url)
    ) or exists (
      select 1 from public.albums
      where public.r2_asset_url_matches(p_bucket, p_path, cover_url)
         or public.r2_asset_url_matches(p_bucket, p_path, hero_image_url)
         or public.r2_asset_url_matches(p_bucket, p_path, typo_logo_url)
    ) or exists (
      select 1 from public.artist_gallery
      where public.r2_asset_url_matches(p_bucket, p_path, image_url)
    ) or exists (
      select 1 from public.artist_members
      where public.r2_asset_url_matches(p_bucket, p_path, image_url)
    ) or exists (
      select 1 from public.artist_scenes
      where public.r2_asset_url_matches(p_bucket, p_path, image_url)
    ) or exists (
      select 1 from public.artist_scene_members
      where public.r2_asset_url_matches(p_bucket, p_path, mask_url)
    ) or exists (
      select 1 from public.tracks
      where public.r2_asset_url_matches(p_bucket, p_path, audio_url)
         or public.r2_asset_url_matches(p_bucket, p_path, music_video_url)
         or public.r2_asset_url_matches(p_bucket, p_path, logo_url)
    ) or exists (
      select 1 from public.home_hero_slides
      where public.r2_asset_url_matches(p_bucket, p_path, video_url)
    ) or exists (
      select 1 from public.avatar_assets
      where image_path = p_path
    );
  elsif p_bucket = 'album-covers' then
    return exists (
      select 1 from public.albums
      where public.r2_asset_url_matches(p_bucket, p_path, cover_url)
    );
  elsif p_bucket = 'track-assets' then
    return exists (
      select 1 from public.tracks
      where public.r2_asset_url_matches(p_bucket, p_path, audio_url)
         or public.r2_asset_url_matches(p_bucket, p_path, music_video_url)
         or public.r2_asset_url_matches(p_bucket, p_path, logo_url)
    );
  elsif p_bucket = 'hero-videos' then
    return exists (
      select 1 from public.home_hero_slides
      where public.r2_asset_url_matches(p_bucket, p_path, video_url)
    );
  elsif p_bucket = 'business-assets' then
    return exists (
      select 1 from public.site_settings
      where public.r2_asset_url_matches(p_bucket, p_path, value->>'pressKitUrl')
         or public.r2_asset_url_matches(p_bucket, p_path, value->>'profilePdfUrl')
    );
  elsif p_bucket = 'audition-attachments' then
    return exists (
      select 1 from public.audition_submissions submission
      where submission.answers @? format('$.* ? (@.path == %s)', to_json(p_path))::jsonpath
    );
  end if;
  return false;
end;
$$;

create or replace function public.reserve_r2_asset_deletions(
  p_bucket text,
  p_paths text[],
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_path text;
  v_reserved_by uuid;
begin
  if p_actor_id is null
    or p_bucket not in (
      'artist-assets', 'album-covers', 'track-assets', 'business-assets',
      'hero-videos', 'audition-attachments'
    )
    or p_paths is null
    or cardinality(p_paths) < 1
    or cardinality(p_paths) > 100
  then
    raise exception 'invalid asset deletion request' using errcode = '22023';
  end if;

  -- All callers use this key before checking references.  A content trigger
  -- uses the same key, so a concurrent URL write either commits first (and is
  -- seen by the scan below) or waits until the reservation is committed.
  for v_path in
    select distinct path
    from unnest(p_paths) as requested(path)
    order by path
  loop
    if v_path !~ '^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.[a-zA-Z0-9]+$' then
      raise exception 'invalid asset path' using errcode = '22023';
    end if;
    perform pg_advisory_xact_lock(
      hashtextextended(p_bucket || chr(0) || v_path, 0)
    );
    select reserved_by into v_reserved_by
    from public.asset_registry
    where bucket = p_bucket and path = v_path
    for update;
    if found then
      raise exception 'asset deletion already reserved' using errcode = '55P03';
    end if;
    if public.r2_asset_is_referenced(p_bucket, v_path) then
      raise exception 'asset is still referenced' using errcode = '23514';
    end if;
  end loop;

  insert into public.asset_registry (bucket, path, status, reserved_by)
  select p_bucket, path, 'deleting', p_actor_id
  from unnest(p_paths) as requested(path)
  group by path;
end;
$$;

create or replace function public.complete_r2_asset_deletions(
  p_bucket text,
  p_paths text[],
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_count integer;
begin
  delete from public.asset_registry
  where bucket = p_bucket
    and path = any(p_paths)
    and reserved_by = p_actor_id;
  get diagnostics v_count = row_count;
  if v_count <> cardinality(p_paths) then
    raise exception 'asset deletion reservation not found' using errcode = '55P03';
  end if;
end;
$$;

create or replace function public.release_r2_asset_deletions(
  p_bucket text,
  p_paths text[],
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_count integer;
begin
  delete from public.asset_registry
  where bucket = p_bucket
    and path = any(p_paths)
    and reserved_by = p_actor_id;
  get diagnostics v_count = row_count;
  if v_count <> cardinality(p_paths) then
    raise exception 'asset deletion reservation not found' using errcode = '55P03';
  end if;
end;
$$;

-- Every server-side content writer reaches these tables, including RPCs.  The
-- trigger acquires the same advisory key before checking the reservation, so
-- it closes the check/delete race without requiring each UI save path to know
-- about the registry.
create or replace function public.reject_reserved_r2_asset_reference()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_column text;
  v_value text;
  v_bucket text;
  v_path text;
  v_marker text;
  v_position integer;
begin
  for v_column, v_value in
    select key, value from jsonb_each_text(to_jsonb(new))
  loop
    if v_value is null or (tg_table_name = 'site_settings' and v_column = 'value') then
      continue;
    end if;
    for v_bucket in
      select unnest(array[
        'artist-assets', 'album-covers', 'track-assets',
        'business-assets', 'hero-videos'
      ])
    loop
      v_marker := '/' || v_bucket || '/';
      v_position := strpos(v_value, v_marker);
      if v_position > 0 then
        v_path := split_part(
          split_part(substr(v_value, v_position + length(v_marker)), '?', 1),
          '#', 1
        );
        if v_path ~ '^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.[a-zA-Z0-9]+$' then
          perform pg_advisory_xact_lock(
            hashtextextended(v_bucket || chr(0) || v_path, 0)
          );
          if exists (
            select 1 from public.asset_registry
            where bucket = v_bucket and path = v_path
          ) then
            raise exception 'asset is reserved for deletion' using errcode = '55P03';
          end if;
        end if;
      end if;
    end loop;
  end loop;

  if tg_table_name = 'site_settings' then
    for v_value in
      select value
      from jsonb_each_text(
        coalesce(
          case
            when jsonb_typeof(to_jsonb(new)->'value') = 'object'
              then to_jsonb(new)->'value'
            else null
          end,
          '{}'::jsonb
        )
      )
    loop
      for v_bucket in
        select unnest(array['business-assets'])
      loop
        v_marker := '/' || v_bucket || '/';
        v_position := strpos(v_value, v_marker);
        if v_position > 0 then
          v_path := split_part(
            split_part(substr(v_value, v_position + length(v_marker)), '?', 1),
            '#', 1
          );
          if v_path ~ '^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.[a-zA-Z0-9]+$' then
            perform pg_advisory_xact_lock(
              hashtextextended(v_bucket || chr(0) || v_path, 0)
            );
            if exists (
              select 1 from public.asset_registry
              where bucket = v_bucket and path = v_path
            ) then
              raise exception 'asset is reserved for deletion' using errcode = '55P03';
            end if;
          end if;
        end if;
      end loop;
    end loop;
  elsif tg_table_name = 'avatar_assets' then
    v_path := to_jsonb(new)->>'image_path';
    if v_path is not null then
      perform pg_advisory_xact_lock(
        hashtextextended('artist-assets' || chr(0) || v_path, 0)
      );
      if exists (
        select 1 from public.asset_registry
        where bucket = 'artist-assets' and path = v_path
      ) then
        raise exception 'asset is reserved for deletion' using errcode = '55P03';
      end if;
    end if;
  elsif tg_table_name = 'contact_inquiries' then
    v_path := to_jsonb(new)->>'attachment_path';
    if v_path is not null then
      perform pg_advisory_xact_lock(
        hashtextextended('contact-attachments' || chr(0) || v_path, 0)
      );
      if exists (
        select 1 from public.asset_registry
        where bucket = 'contact-attachments' and path = v_path
      ) then
        raise exception 'asset is reserved for deletion' using errcode = '55P03';
      end if;
    end if;
  elsif tg_table_name = 'protect_report_attachments' then
    v_path := to_jsonb(new)->>'file_path';
    if v_path is not null then
      perform pg_advisory_xact_lock(
        hashtextextended('protect-evidence' || chr(0) || v_path, 0)
      );
      if exists (
        select 1 from public.asset_registry
        where bucket = 'protect-evidence' and path = v_path
      ) then
        raise exception 'asset is reserved for deletion' using errcode = '55P03';
      end if;
    end if;
  elsif tg_table_name = 'audition_submissions'
    and jsonb_typeof(to_jsonb(new)->'answers') = 'object' then
    for v_path in
      select value->>'path'
      from jsonb_each(to_jsonb(new)->'answers')
      where jsonb_typeof(value) = 'object'
        and jsonb_typeof(value->'path') = 'string'
    loop
      perform pg_advisory_xact_lock(
        hashtextextended('audition-attachments' || chr(0) || v_path, 0)
      );
      if exists (
        select 1 from public.asset_registry
        where bucket = 'audition-attachments' and path = v_path
      ) then
        raise exception 'asset is reserved for deletion' using errcode = '55P03';
      end if;
    end loop;
  end if;
  return new;
end;
$$;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'artists', 'albums', 'artist_gallery', 'artist_members',
    'artist_scenes', 'artist_scene_members', 'tracks', 'home_hero_slides',
    'site_settings', 'avatar_assets', 'contact_inquiries',
    'protect_report_attachments', 'audition_submissions'
  ]
  loop
    execute format(
      'drop trigger if exists reject_reserved_r2_asset_reference on public.%I',
      v_table
    );
    execute format(
      'create trigger reject_reserved_r2_asset_reference before insert or update on public.%I for each row execute function public.reject_reserved_r2_asset_reference()',
      v_table
    );
  end loop;
end;
$$;

revoke all on function public.r2_asset_url_matches(text, text, text) from public, anon, authenticated;
revoke all on function public.r2_asset_is_referenced(text, text) from public, anon, authenticated;
revoke all on function public.reserve_r2_asset_deletions(text, text[], uuid) from public, anon, authenticated;
revoke all on function public.complete_r2_asset_deletions(text, text[], uuid) from public, anon, authenticated;
revoke all on function public.release_r2_asset_deletions(text, text[], uuid) from public, anon, authenticated;
revoke all on function public.reject_reserved_r2_asset_reference() from public, anon, authenticated, service_role;
grant execute on function public.reserve_r2_asset_deletions(text, text[], uuid) to service_role;
grant execute on function public.complete_r2_asset_deletions(text, text[], uuid) to service_role;
grant execute on function public.release_r2_asset_deletions(text, text[], uuid) to service_role;

notify pgrst, 'reload schema';
commit;
