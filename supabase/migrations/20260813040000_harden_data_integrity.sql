begin;

-- RLS policies must not call the admin helper for anon.  The helper is
-- intentionally not executable by anon, so keep the public and admin paths
-- as separate policies.
drop policy if exists "public read active audition campaigns" on public.audition_campaigns;
create policy "public read active audition campaigns"
  on public.audition_campaigns for select to anon, authenticated
  using (
    is_active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists "admins read all audition campaigns" on public.audition_campaigns;
create policy "admins read all audition campaigns"
  on public.audition_campaigns for select to authenticated
  using (public.is_admin());

drop policy if exists "public read active audition fields" on public.audition_form_fields;
create policy "public read active audition fields"
  on public.audition_form_fields for select to anon, authenticated
  using (
    is_active
    and exists (
      select 1
      from public.audition_campaigns as campaign
      where campaign.id = audition_form_fields.campaign_id
        and campaign.is_active
        and (campaign.starts_at is null or campaign.starts_at <= now())
        and (campaign.ends_at is null or campaign.ends_at >= now())
    )
  );

drop policy if exists "admins read all audition fields" on public.audition_form_fields;
create policy "admins read all audition fields"
  on public.audition_form_fields for select to authenticated
  using (public.is_admin());

-- An album save is one trust boundary.  Existing album and track IDs must
-- belong to the submitted artist/album; otherwise an admin can mutate a
-- different artist's records by supplying foreign IDs.
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

  insert into public.albums (
    id, artist_id, slug, title, title_ko, title_en, title_ja, type, release_date, cover_url, hero_image_url, color,
    description_ko, description_en, description_ja, spotify_id, youtube_url,
    sort_order, is_published, published_at
  ) values (
    v_album_id, v_artist_id, v_album_id::text, trim(p_album->>'title'),
    nullif(p_album->>'title_ko', ''), nullif(p_album->>'title_en', ''), nullif(p_album->>'title_ja', ''),
    trim(p_album->>'type'),
    nullif(p_album->>'release_date', '')::date, nullif(p_album->>'cover_url', ''),
    nullif(p_album->>'hero_image_url', ''), coalesce(nullif(p_album->>'color', ''), '#FC6FCF'),
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
    hero_image_url = excluded.hero_image_url, color = excluded.color,
    description_ko = excluded.description_ko, description_en = excluded.description_en,
    description_ja = excluded.description_ja, spotify_id = excluded.spotify_id,
    youtube_url = excluded.youtube_url, is_published = excluded.is_published,
    published_at = excluded.published_at;

  update public.tracks
  set track_number = track_number + 100000
  where album_id = v_album_id;

  v_position := 0;
  v_seen_ids := array[]::uuid[];
  for v_track in select value from jsonb_array_elements(p_tracks) loop
    v_position := v_position + 1;
    v_track_id := coalesce(nullif(v_track->>'id', '')::uuid, gen_random_uuid());
    v_seen_ids := array_append(v_seen_ids, v_track_id);
    insert into public.tracks (
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
      track_number = excluded.track_number,
      is_title = excluded.is_title, spotify_url = excluded.spotify_url,
      youtube_url = excluded.youtube_url, audio_url = excluded.audio_url,
      music_video_url = excluded.music_video_url, logo_url = excluded.logo_url;
  end loop;

  delete from public.tracks
  where album_id = v_album_id and not (id = any(v_seen_ids));
  return v_album_id;
end;
$$;

-- Reordering must be a complete permutation.  Partial/duplicate arrays used
-- to leave stale positions or assign the same position to multiple albums.
create or replace function public.reorder_albums(p_artist_id uuid, p_album_ids uuid[])
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;
  if p_artist_id is null or p_album_ids is null then
    raise exception 'artist and album order are required' using errcode = '22023';
  end if;
  select count(*)::integer into v_count from public.albums where artist_id = p_artist_id;
  if cardinality(p_album_ids) <> v_count then
    raise exception 'album order must contain every album exactly once' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(p_album_ids) as requested(id)
    group by requested.id having count(*) > 1
  ) or exists (
    select 1 from unnest(p_album_ids) as requested(id)
    where not exists (
      select 1 from public.albums as album
      where album.id = requested.id and album.artist_id = p_artist_id
    )
  ) then
    raise exception 'album order contains an invalid album' using errcode = '22023';
  end if;

  perform 1 from public.albums where artist_id = p_artist_id for update;
  update public.albums as album
  set sort_order = requested.position
  from unnest(p_album_ids) with ordinality as requested(id, position)
  where album.id = requested.id and album.artist_id = p_artist_id;
end;
$$;

-- Same atomic permutation primitive for the member editor.  The UI can use
-- this RPC instead of issuing one independent UPDATE per member.
create or replace function public.reorder_artist_members(p_artist_id uuid, p_member_ids uuid[])
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;
  if p_artist_id is null or p_member_ids is null then
    raise exception 'artist and member order are required' using errcode = '22023';
  end if;
  select count(*)::integer into v_count from public.artist_members where artist_id = p_artist_id;
  if cardinality(p_member_ids) <> v_count then
    raise exception 'member order must contain every member exactly once' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(p_member_ids) as requested(id)
    group by requested.id having count(*) > 1
  ) or exists (
    select 1 from unnest(p_member_ids) as requested(id)
    where not exists (
      select 1 from public.artist_members as member
      where member.id = requested.id and member.artist_id = p_artist_id
    )
  ) then
    raise exception 'member order contains an invalid member' using errcode = '22023';
  end if;
  perform 1 from public.artist_members where artist_id = p_artist_id for update;
  update public.artist_members as member
  set sort_order = requested.position
  from unnest(p_member_ids) with ordinality as requested(id, position)
  where member.id = requested.id and member.artist_id = p_artist_id;
end;
$$;

-- Campaign deletion is one database transaction.  Return attachment paths so
-- the caller can remove corresponding objects after the committed delete.
create or replace function public.delete_audition_campaign(p_campaign_id uuid)
returns table (attachment_paths text[])
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_paths text[];
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;
  if p_campaign_id is null then
    raise exception 'campaign is required' using errcode = '22023';
  end if;
  perform 1 from public.audition_campaigns where id = p_campaign_id for update;
  if not found then
    raise exception 'campaign not found' using errcode = 'P0002';
  end if;

  select coalesce(array_agg(distinct answer.value->>'path'), array[]::text[])
  into v_paths
  from public.audition_submissions as submission
  cross join lateral jsonb_each(case
    when jsonb_typeof(submission.answers) = 'object' then submission.answers
    else '{}'::jsonb
  end) as answer(key, value)
  where submission.campaign_id = p_campaign_id
    and jsonb_typeof(answer.value) = 'object'
    and jsonb_typeof(answer.value->'path') = 'string';

  delete from public.audition_submissions where campaign_id = p_campaign_id;
  delete from public.audition_campaigns where id = p_campaign_id;
  return query select v_paths;
end;
$$;

-- Campaign creation and initial fields commit together.
create or replace function public.create_audition_campaign(p_campaign jsonb, p_fields jsonb)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_campaign_id uuid;
  v_field jsonb;
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;
  if p_campaign is null or jsonb_typeof(p_campaign) <> 'object'
    or p_fields is null or jsonb_typeof(p_fields) <> 'array' then
    raise exception 'campaign and fields must be valid JSON object/array' using errcode = '22023';
  end if;
  insert into public.audition_campaigns (
    title, description, description_i18n, is_active, starts_at, ends_at, created_by
  ) values (
    trim(p_campaign->>'title'), coalesce(p_campaign->>'description', ''),
    coalesce(p_campaign->'description_i18n', '{}'::jsonb),
    coalesce((p_campaign->>'is_active')::boolean, false),
    nullif(p_campaign->>'starts_at', '')::timestamptz,
    nullif(p_campaign->>'ends_at', '')::timestamptz,
    auth.uid()
  ) returning id into v_campaign_id;

  for v_field in select value from jsonb_array_elements(p_fields) loop
    insert into public.audition_form_fields (
      id, campaign_id, field_key, label_i18n, help_text, field_type, options,
      required, max_length, max_file_size_mb, accepted_file_types, sort_order,
      is_active, is_primary_label
    ) values (
      coalesce(nullif(v_field->>'id', '')::uuid, gen_random_uuid()), v_campaign_id,
      v_field->>'field_key', coalesce(v_field->'label_i18n', '{}'::jsonb),
      v_field->>'help_text', v_field->>'field_type', coalesce(v_field->'options', '[]'::jsonb),
      coalesce((v_field->>'required')::boolean, false),
      nullif(v_field->>'max_length', '')::integer,
      nullif(v_field->>'max_file_size_mb', '')::integer,
      coalesce(array(select jsonb_array_elements_text(coalesce(v_field->'accepted_file_types', '[]'::jsonb))), '{}'::text[]),
      coalesce((v_field->>'sort_order')::integer, 0),
      coalesce((v_field->>'is_active')::boolean, true),
      coalesce((v_field->>'is_primary_label')::boolean, false)
    );
  end loop;
  return v_campaign_id;
end;
$$;

revoke all on function public.reorder_artist_members(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_artist_members(uuid, uuid[]) to authenticated, service_role;
revoke all on function public.delete_audition_campaign(uuid) from public, anon;
grant execute on function public.delete_audition_campaign(uuid) to authenticated, service_role;
revoke all on function public.create_audition_campaign(jsonb, jsonb) from public, anon;
grant execute on function public.create_audition_campaign(jsonb, jsonb) to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
