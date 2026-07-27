-- Add an external YouTube URL for each track.

alter table public.tracks
  add column if not exists youtube_url text;

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
    or coalesce(trim(p_album->>'type'), '') = '' then
    raise exception '앨범 제목과 종류가 필요합니다.' using errcode = '22023';
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
      raise exception '모든 트랙에 곡명이 필요합니다.' using errcode = '22023';
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
      youtube_url = excluded.youtube_url,
      audio_url = excluded.audio_url, music_video_url = excluded.music_video_url,
      logo_url = excluded.logo_url;
  end loop;

  delete from public.tracks
  where album_id = v_album_id and not (id = any(v_seen_ids));

  return v_album_id;
end;
$$;
