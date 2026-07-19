-- Unified album + track editor, including managed media assets.
-- Run after 001_discography.sql.

alter table public.tracks
  add column if not exists duration integer check (duration is null or duration >= 0),
  add column if not exists is_title boolean not null default false,
  add column if not exists spotify_url text,
  add column if not exists audio_url text,
  add column if not exists music_video_url text,
  add column if not exists logo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('album-covers', 'album-covers', true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('track-assets', 'track-assets', true, 524288000, array['audio/mpeg','video/mp4','image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read music assets" on storage.objects;
create policy "public read music assets"
on storage.objects for select
using (bucket_id in ('album-covers', 'track-assets'));

drop policy if exists "admin upload music assets" on storage.objects;
create policy "admin upload music assets"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('album-covers', 'track-assets')
  and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

drop policy if exists "admin update music assets" on storage.objects;
create policy "admin update music assets"
on storage.objects for update to authenticated
using (
  bucket_id in ('album-covers', 'track-assets')
  and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
)
with check (
  bucket_id in ('album-covers', 'track-assets')
  and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

drop policy if exists "admin delete music assets" on storage.objects;
create policy "admin delete music assets"
on storage.objects for delete to authenticated
using (
  bucket_id in ('album-covers', 'track-assets')
  and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

create or replace function public.save_album_with_tracks(p_album jsonb, p_tracks jsonb)
returns uuid
language plpgsql
security invoker
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
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  if coalesce(trim(p_album->>'title'), '') = ''
    or coalesce(trim(p_album->>'type'), '') = ''
    or coalesce(p_album->>'slug', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception '앨범 제목, 종류, 올바른 URL ID가 필요합니다.' using errcode = '22023';
  end if;

  if v_published and (
    nullif(p_album->>'release_date', '') is null
    or nullif(p_album->>'cover_url', '') is null
    or jsonb_array_length(coalesce(p_tracks, '[]'::jsonb)) = 0
  ) then
    raise exception '공개하려면 발매일, 커버, 수록곡 1곡 이상이 필요합니다.' using errcode = '22023';
  end if;

  select * into v_existing from public.albums where id = v_album_id for update;
  v_published_at := case
    when not v_published then null
    when v_existing.id is not null and v_existing.is_published then v_existing.published_at
    else now()
  end;

  insert into public.albums (
    id, artist_id, slug, title, type, release_date, cover_url, color,
    description_ko, description_en, description_ja, spotify_id, youtube_url,
    sort_order, is_published, published_at
  ) values (
    v_album_id, v_artist_id, trim(p_album->>'slug'), trim(p_album->>'title'), trim(p_album->>'type'),
    nullif(p_album->>'release_date', '')::date, nullif(p_album->>'cover_url', ''),
    coalesce(nullif(p_album->>'color', ''), '#FC6FCF'), p_album->>'description_ko',
    p_album->>'description_en', p_album->>'description_ja', nullif(p_album->>'spotify_id', ''),
    nullif(p_album->>'youtube_url', ''),
    coalesce((p_album->>'sort_order')::integer, (select coalesce(max(sort_order), 0) + 1 from public.albums where artist_id = v_artist_id)),
    v_published, v_published_at
  )
  on conflict (id) do update set
    slug = excluded.slug, title = excluded.title, type = excluded.type,
    release_date = excluded.release_date, cover_url = excluded.cover_url, color = excluded.color,
    description_ko = excluded.description_ko, description_en = excluded.description_en,
    description_ja = excluded.description_ja, spotify_id = excluded.spotify_id,
    youtube_url = excluded.youtube_url, is_published = excluded.is_published,
    published_at = excluded.published_at;

  -- Move existing positions out of the unique range before applying a reorder.
  update public.tracks set track_number = track_number + 100000 where album_id = v_album_id;

  for v_track in select value from jsonb_array_elements(coalesce(p_tracks, '[]'::jsonb)) loop
    v_position := v_position + 1;
    if coalesce(trim(v_track->>'title'), '') = '' then
      raise exception '모든 트랙에 곡명이 필요합니다.' using errcode = '22023';
    end if;

    v_track_id := coalesce(nullif(v_track->>'id', '')::uuid, gen_random_uuid());
    v_seen_ids := array_append(v_seen_ids, v_track_id);

    insert into public.tracks (
      id, album_id, title, track_number, duration, is_title,
      spotify_url, audio_url, music_video_url, logo_url
    ) values (
      v_track_id, v_album_id, trim(v_track->>'title'), v_position,
      nullif(v_track->>'duration', '')::integer, coalesce((v_track->>'is_title')::boolean, false),
      nullif(v_track->>'spotify_url', ''), nullif(v_track->>'audio_url', ''),
      nullif(v_track->>'music_video_url', ''), nullif(v_track->>'logo_url', '')
    )
    on conflict (id) do update set
      title = excluded.title, track_number = excluded.track_number, duration = excluded.duration,
      is_title = excluded.is_title, spotify_url = excluded.spotify_url,
      audio_url = excluded.audio_url, music_video_url = excluded.music_video_url,
      logo_url = excluded.logo_url;
  end loop;

  delete from public.tracks
  where album_id = v_album_id and not (id = any(v_seen_ids));

  return v_album_id;
end;
$$;

create or replace function public.reorder_albums(p_artist_id uuid, p_album_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  if exists (
    select 1 from unnest(p_album_ids) id
    where not exists (select 1 from public.albums a where a.id = id and a.artist_id = p_artist_id)
  ) then
    raise exception '다른 아티스트의 앨범은 정렬할 수 없습니다.' using errcode = '22023';
  end if;

  update public.albums a
  set sort_order = ordered.position
  from unnest(p_album_ids) with ordinality as ordered(id, position)
  where a.id = ordered.id and a.artist_id = p_artist_id;
end;
$$;

grant execute on function public.save_album_with_tracks(jsonb, jsonb) to authenticated;
grant execute on function public.reorder_albums(uuid, uuid[]) to authenticated;
