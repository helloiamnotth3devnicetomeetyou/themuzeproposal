begin;

-- Keep album and track logos in the transactional editor payload.  The
-- presence checks preserve values for older clients that omit these fields,
-- while an explicit empty value still clears a logo.
create or replace function public.save_album_with_tracks(p_album jsonb, p_tracks jsonb)
returns uuid
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_album_id uuid;
  v_artist_id uuid;
  v_existing public.albums%rowtype;
  v_track jsonb;
  v_track_id uuid;
  v_seen_ids uuid[] := array[]::uuid[];
  v_position integer := 0;
  v_published boolean;
  v_published_at timestamptz;
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;
  if p_album is null or jsonb_typeof(p_album) <> 'object'
    or p_tracks is null or jsonb_typeof(p_tracks) <> 'array' then
    raise exception 'album and tracks must be valid JSON object/array' using errcode = '22023';
  end if;

  v_album_id := coalesce(nullif(p_album->>'id', '')::uuid, gen_random_uuid());
  v_artist_id := nullif(p_album->>'artist_id', '')::uuid;
  v_published := coalesce((p_album->>'is_published')::boolean, false);

  if v_artist_id is null or not exists (
    select 1 from public.artists where id = v_artist_id
  ) then
    raise exception 'artist not found' using errcode = 'P0002';
  end if;
  if coalesce(trim(p_album->>'title'), '') = ''
    or coalesce(trim(p_album->>'type'), '') = '' then
    raise exception 'album title and type are required' using errcode = '22023';
  end if;
  if v_published and (
    nullif(p_album->>'release_date', '') is null
    or nullif(p_album->>'cover_url', '') is null
    or jsonb_array_length(p_tracks) = 0
  ) then
    raise exception 'published albums require release date, cover and tracks' using errcode = '22023';
  end if;

  select * into v_existing
  from public.albums
  where id = v_album_id
  for update;
  if found and v_existing.artist_id is distinct from v_artist_id then
    raise exception 'album does not belong to this artist' using errcode = '22023';
  end if;

  -- Validate every caller-supplied track ID before changing any rows.
  for v_track in select value from jsonb_array_elements(p_tracks) loop
    if coalesce(trim(v_track->>'title'), '') = '' then
      raise exception 'all track titles are required' using errcode = '22023';
    end if;
    if nullif(v_track->>'id', '') is not null then
      v_track_id := (v_track->>'id')::uuid;
      if v_track_id = any(v_seen_ids) then
        raise exception 'duplicate track id in album payload' using errcode = '22023';
      end if;
      if exists (
        select 1 from public.tracks
        where id = v_track_id and album_id is distinct from v_album_id
      ) then
        raise exception 'track does not belong to this album' using errcode = '22023';
      end if;
      v_seen_ids := array_append(v_seen_ids, v_track_id);
    end if;
  end loop;

  v_published_at := case
    when not v_published then null
    when v_existing.id is not null and v_existing.is_published then v_existing.published_at
    else now()
  end;

  insert into public.albums as album (
    id, artist_id, slug, title, title_ko, title_en, title_ja, type, release_date, cover_url, hero_image_url,
    typo_logo_url, color, description_ko, description_en, description_ja, spotify_id, youtube_url,
    sort_order, is_published, published_at
  ) values (
    v_album_id, v_artist_id, v_album_id::text, trim(p_album->>'title'),
    nullif(p_album->>'title_ko', ''), nullif(p_album->>'title_en', ''), nullif(p_album->>'title_ja', ''),
    trim(p_album->>'type'),
    nullif(p_album->>'release_date', '')::date, nullif(p_album->>'cover_url', ''),
    nullif(p_album->>'hero_image_url', ''), nullif(p_album->>'typo_logo_url', ''),
    coalesce(nullif(p_album->>'color', ''), '#FC6FCF'),
    p_album->>'description_ko', p_album->>'description_en', p_album->>'description_ja',
    nullif(p_album->>'spotify_id', ''), nullif(p_album->>'youtube_url', ''),
    coalesce((p_album->>'sort_order')::integer, (
      select coalesce(max(sort_order), 0) + 1 from public.albums where artist_id = v_artist_id
    )),
    v_published, v_published_at
  )
  on conflict (id) do update set
    slug = excluded.slug, title = excluded.title, title_ko = excluded.title_ko,
    title_en = excluded.title_en, title_ja = excluded.title_ja, type = excluded.type,
    release_date = excluded.release_date, cover_url = excluded.cover_url,
    hero_image_url = excluded.hero_image_url,
    typo_logo_url = case
      when p_album ? 'typo_logo_url' then excluded.typo_logo_url
      else album.typo_logo_url
    end,
    color = excluded.color, description_ko = excluded.description_ko,
    description_en = excluded.description_en, description_ja = excluded.description_ja,
    spotify_id = excluded.spotify_id, youtube_url = excluded.youtube_url,
    is_published = excluded.is_published, published_at = excluded.published_at;

  update public.tracks
  set track_number = track_number + 100000
  where album_id = v_album_id;

  v_position := 0;
  v_seen_ids := array[]::uuid[];
  for v_track in select value from jsonb_array_elements(p_tracks) loop
    v_position := v_position + 1;
    v_track_id := coalesce(nullif(v_track->>'id', '')::uuid, gen_random_uuid());
    v_seen_ids := array_append(v_seen_ids, v_track_id);
    insert into public.tracks as track (
      id, album_id, title, title_ko, title_en, title_ja, track_number, is_title,
      spotify_url, youtube_url, audio_url, music_video_url, logo_url
    ) values (
      v_track_id, v_album_id, trim(v_track->>'title'),
      nullif(v_track->>'title_ko', ''), nullif(v_track->>'title_en', ''), nullif(v_track->>'title_ja', ''),
      v_position,
      coalesce((v_track->>'is_title')::boolean, false),
      nullif(v_track->>'spotify_url', ''), nullif(v_track->>'youtube_url', ''),
      nullif(v_track->>'audio_url', ''), nullif(v_track->>'music_video_url', ''),
      nullif(v_track->>'logo_url', '')
    )
    on conflict (id) do update set
      title = excluded.title, title_ko = excluded.title_ko,
      title_en = excluded.title_en, title_ja = excluded.title_ja,
      track_number = excluded.track_number, is_title = excluded.is_title,
      spotify_url = excluded.spotify_url, youtube_url = excluded.youtube_url,
      audio_url = excluded.audio_url, music_video_url = excluded.music_video_url,
      logo_url = case
        when v_track ? 'logo_url' then excluded.logo_url
        else track.logo_url
      end;
  end loop;

  delete from public.tracks
  where album_id = v_album_id and not (id = any(v_seen_ids));
  return v_album_id;
end;
$$;

notify pgrst, 'reload schema';
commit;
