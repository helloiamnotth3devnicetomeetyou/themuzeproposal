


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."capture_admin_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_mode text := coalesce(tg_argv[1], 'standard');
  v_primary_key text := coalesce(tg_argv[0], 'id');
  v_row jsonb;
  v_old jsonb := '{}'::jsonb;
  v_new jsonb := '{}'::jsonb;
  v_before jsonb;
  v_after jsonb;
  v_changed_fields text[] := array[]::text[];
  v_safe_fields text[];
  v_actor_id uuid := auth.uid();
  v_actor_email text;
  v_record_id text;
  v_record_label text;
begin
  if tg_op <> 'INSERT' then
    v_old := to_jsonb(old) - array['created_at', 'updated_at'];
  end if;

  if tg_op <> 'DELETE' then
    v_new := to_jsonb(new) - array['created_at', 'updated_at'];
  end if;

  v_row := case when tg_op = 'DELETE' then v_old else v_new end;
  v_record_id := coalesce(v_row ->> v_primary_key, '');

  if v_record_id = '' then
    raise exception 'Audit target on %.% has no primary key value', tg_table_schema, tg_table_name;
  end if;

  v_record_label := case tg_table_name
    when 'contact_inquiries' then '문의 #' || upper(left(v_record_id, 8))
    when 'protect_reports' then '신고 #' || upper(left(v_record_id, 8))
    when 'audition_submissions' then '오디션 #' || upper(left(v_record_id, 8))
    when 'profiles' then '관리자 권한 #' || upper(left(v_record_id, 8))
    else coalesce(
      nullif(v_row ->> 'name_ko', ''),
      nullif(v_row ->> 'name', ''),
      nullif(v_row ->> 'title_ko', ''),
      nullif(v_row ->> 'title', ''),
      nullif(v_row ->> 'key', ''),
      nullif(v_row ->> 'slug', ''),
      v_record_id
    )
  end;

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(entry.key order by entry.key), array[]::text[])
      into v_changed_fields
    from jsonb_each(v_old) as entry
    where (v_new -> entry.key) is distinct from entry.value;

    if cardinality(v_changed_fields) = 0 then
      return new;
    end if;

    if v_mode = 'sensitive' then
      v_safe_fields := case tg_table_name
        when 'contact_inquiries' then array['status', 'admin_note', 'answered_at', 'answered_by']
        when 'protect_reports' then array['status', 'admin_note', 'answered_at', 'answered_by']
        when 'audition_submissions' then array['status', 'notes']
        else array[]::text[]
      end;
    else
      v_safe_fields := v_changed_fields;
    end if;

    select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
      into v_before
    from jsonb_each(v_old) as entry
    where entry.key = any(v_changed_fields)
      and entry.key = any(v_safe_fields);

    select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
      into v_after
    from jsonb_each(v_new) as entry
    where entry.key = any(v_changed_fields)
      and entry.key = any(v_safe_fields);
  elsif tg_op = 'INSERT' then
    v_after := v_new;
    select coalesce(array_agg(entry.key order by entry.key), array[]::text[])
      into v_changed_fields
    from jsonb_each(v_new) as entry;
  else
    if v_mode = 'sensitive' then
      v_safe_fields := case tg_table_name
        when 'contact_inquiries' then array['id', 'category', 'inquiry_type', 'status', 'admin_note', 'answered_at', 'answered_by']
        when 'protect_reports' then array['id', 'report_type', 'status', 'admin_note']
        when 'audition_submissions' then array['id', 'category', 'status', 'notes']
        else array['id']
      end;

      select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
        into v_before
      from jsonb_each(v_old) as entry
      where entry.key = any(v_safe_fields);
    else
      v_before := v_old;
    end if;

    select coalesce(array_agg(entry.key order by entry.key), array[]::text[])
      into v_changed_fields
    from jsonb_each(v_before) as entry;
  end if;

  begin
    v_actor_email := nullif(auth.jwt() ->> 'email', '');
  exception when others then
    v_actor_email := null;
  end;

  if v_actor_email is null and v_actor_id is not null then
    select profile.email
      into v_actor_email
    from public.profiles as profile
    where profile.id = v_actor_id;
  end if;

  insert into public.admin_audit_logs (
    actor_id,
    actor_email,
    operation,
    table_name,
    record_id,
    record_label,
    changed_fields,
    before_values,
    after_values,
    transaction_id
  ) values (
    v_actor_id,
    v_actor_email,
    tg_op,
    tg_table_name,
    v_record_id,
    v_record_label,
    v_changed_fields,
    v_before,
    v_after,
    txid_current()
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."capture_admin_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clear_inactive_profile_avatars"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  if old.is_active and not new.is_active then
    update public.profiles
      set avatar_asset_id = null
      where avatar_asset_id = new.id;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."clear_inactive_profile_avatars"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."consume_login_rate_limit"("p_identifier_hash" "text", "p_ip_hash" "text") RETURNS TABLE("is_allowed" boolean, "retry_after_seconds" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'private', 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."consume_login_rate_limit"("p_identifier_hash" "text", "p_ip_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."consume_submission_rate_limit"("p_scope" "text", "p_key_hash" "text", "p_limit" integer, "p_window_seconds" integer) RETURNS TABLE("is_allowed" boolean, "retry_after_seconds" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'private', 'public', 'pg_temp'
    AS $$
declare
  v_attempt_count integer;
  v_window_started_at timestamptz;
begin
  if p_scope not in ('contact_inquiry', 'protect_report', 'audition_submission')
    or length(p_key_hash) <> 64
    or p_limit < 1 or p_limit > 100
    or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid submission rate-limit arguments' using errcode = '22023';
  end if;

  insert into private.submission_rate_limits as limits (
    scope, key_hash, attempt_count, window_started_at, updated_at
  ) values (p_scope, p_key_hash, 1, now(), now())
  on conflict (scope, key_hash) do update set
    attempt_count = case
      when limits.window_started_at < now() - make_interval(secs => p_window_seconds) then 1
      else limits.attempt_count + 1
    end,
    window_started_at = case
      when limits.window_started_at < now() - make_interval(secs => p_window_seconds) then now()
      else limits.window_started_at
    end,
    updated_at = now()
  returning attempt_count, window_started_at into v_attempt_count, v_window_started_at;

  return query select
    v_attempt_count <= p_limit,
    case when v_attempt_count <= p_limit then 0
      else greatest(1, ceil(extract(epoch from (v_window_started_at + make_interval(secs => p_window_seconds) - now())))::integer)
    end;
end;
$$;


ALTER FUNCTION "public"."consume_submission_rate_limit"("p_scope" "text", "p_key_hash" "text", "p_limit" integer, "p_window_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_profile_for_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, null)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;


ALTER FUNCTION "public"."create_profile_for_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_audition_submissions"("p_campaign_id" "uuid") RETURNS TABLE("id" "uuid", "campaign_id" "uuid", "answers" "jsonb", "form_snapshot" "jsonb", "status" "text", "reviewer_notes" "text", "reviewed_by" "uuid", "reviewed_at" timestamp with time zone, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  return query
  select
    submission.id,
    submission.campaign_id,
    submission.answers,
    submission.form_snapshot,
    submission.status,
    submission.reviewer_notes,
    submission.reviewed_by,
    submission.reviewed_at,
    submission.created_at,
    submission.updated_at
  from public.audition_submissions submission
  where submission.campaign_id = p_campaign_id
  order by submission.created_at desc;
end;
$$;


ALTER FUNCTION "public"."get_admin_audition_submissions"("p_campaign_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_audition_submissions"() RETURNS TABLE("id" "uuid", "campaign_id" "uuid", "user_id" "uuid", "answers" "jsonb", "form_snapshot" "jsonb", "status" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  return query
  select
    submission.id,
    submission.campaign_id,
    submission.user_id,
    submission.answers,
    submission.form_snapshot,
    submission.status,
    submission.created_at,
    submission.updated_at
  from public.audition_submissions submission
  where submission.user_id = auth.uid()
  order by submission.created_at desc;
end;
$$;


ALTER FUNCTION "public"."get_my_audition_submissions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_admin_role"("p_role" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = p_role
  );
$$;


ALTER FUNCTION "public"."has_admin_role"("p_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('super_admin', 'editor')
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_google_only_email"("p_email" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'auth', 'public', 'pg_temp'
    AS $$
  select exists (
    select 1
    from auth.users as users
    where lower(users.email) = lower(btrim(p_email))
      and exists (
        select 1
        from auth.identities as identities
        where identities.user_id = users.id
          and identities.provider = 'google'
      )
      and not exists (
        select 1
        from auth.identities as identities
        where identities.user_id = users.id
          and identities.provider = 'email'
      )
  );
$$;


ALTER FUNCTION "public"."is_google_only_email"("p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select public.has_admin_role('super_admin');
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_profile_avatar"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
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


ALTER FUNCTION "public"."normalize_profile_avatar"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reorder_albums"("p_artist_id" "uuid", "p_album_ids" "uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."reorder_albums"("p_artist_id" "uuid", "p_album_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_login_rate_limit"("p_identifier_hash" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'private', 'public', 'pg_temp'
    AS $$
begin
  if length(p_identifier_hash) <> 64 then
    raise exception 'invalid rate limit key' using errcode = '22023';
  end if;

  delete from private.login_rate_limits
  where key_hash = p_identifier_hash;
end;
$$;


ALTER FUNCTION "public"."reset_login_rate_limit"("p_identifier_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_album_with_tracks"("p_album" "jsonb", "p_tracks" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."save_album_with_tracks"("p_album" "jsonb", "p_tracks" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_avatar_assets"("p_artist_id" "uuid", "p_items" "jsonb", "p_delete_ids" "uuid"[] DEFAULT ARRAY[]::"uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
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


ALTER FUNCTION "public"."save_avatar_assets"("p_artist_id" "uuid", "p_items" "jsonb", "p_delete_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_contact_attachment_size_from_storage"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'storage', 'pg_temp'
    AS $_$
declare
  v_size bigint;
begin
  if new.attachment_path is null then
    new.attachment_name := null;
    new.attachment_size := null;
    return new;
  end if;

  if new.category <> 'business'
    or new.attachment_name is null
    or split_part(new.attachment_path, '/', 1) <> new.id::text then
    raise exception 'invalid contact attachment' using errcode = '23514';
  end if;

  select
    case
      when metadata->>'size' ~ '^[0-9]+$' then (metadata->>'size')::bigint
      else null
    end
  into v_size
  from storage.objects
  where bucket_id = 'contact-attachments'
    and name = new.attachment_path;

  if v_size is null or v_size < 1 or v_size > 20971520 then
    raise exception 'contact attachment is missing or has an invalid size'
      using errcode = '23514';
  end if;

  new.attachment_size := v_size;
  return new;
end;
$_$;


ALTER FUNCTION "public"."set_contact_attachment_size_from_storage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_audition_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."touch_audition_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_audit_logs" (
    "id" bigint NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "actor_id" "uuid",
    "actor_email" "text",
    "operation" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "record_label" "text" NOT NULL,
    "changed_fields" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb",
    "transaction_id" bigint DEFAULT "txid_current"() NOT NULL,
    CONSTRAINT "admin_audit_logs_operation_check" CHECK (("operation" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);


ALTER TABLE "public"."admin_audit_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_audit_logs" IS 'Append-only administrator data-change audit trail. No automatic retention policy.';



COMMENT ON COLUMN "public"."admin_audit_logs"."before_values" IS 'Changed values only for updates; safe row snapshot for deletes.';



COMMENT ON COLUMN "public"."admin_audit_logs"."after_values" IS 'Changed values only for updates; row snapshot for inserts.';



ALTER TABLE "public"."admin_audit_logs" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."admin_audit_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."admin_onboarding_progress" (
    "user_id" "uuid" NOT NULL,
    "chapter_id" "text" NOT NULL,
    "furthest_step_id" "text",
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_onboarding_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."albums" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "artist_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "type" "text" DEFAULT 'Album'::"text" NOT NULL,
    "release_date" "date",
    "cover_url" "text",
    "color" "text" DEFAULT '#FC6FCF'::"text" NOT NULL,
    "description_ko" "text",
    "description_en" "text",
    "description_ja" "text",
    "spotify_id" "text",
    "youtube_url" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "hero_image_url" "text",
    "typo_logo_url" "text",
    "title_ko" "text",
    "title_en" "text",
    "title_ja" "text"
);


ALTER TABLE "public"."albums" OWNER TO "postgres";


COMMENT ON COLUMN "public"."albums"."title" IS 'Legacy canonical album title; kept for compatibility.';



COMMENT ON COLUMN "public"."albums"."typo_logo_url" IS 'Album-level SVG typography logo used in the home hero.';



CREATE TABLE IF NOT EXISTS "public"."artist_gallery" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "artist_id" "uuid" NOT NULL,
    "album_id" "uuid",
    "member_id" "uuid",
    "image_url" "text" NOT NULL,
    "caption" "text" DEFAULT ''::"text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_published" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."artist_gallery" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artist_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "artist_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "eng_name" "text",
    "role_ko" "text",
    "role_en" "text",
    "role_ja" "text",
    "birth" "text",
    "mbti" "text",
    "image_url" "text",
    "color" "text" DEFAULT '#FC6FCF'::"text" NOT NULL,
    "bio_ko" "text",
    "bio_en" "text",
    "bio_ja" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "social_links" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "name_ko" "text",
    "name_en" "text",
    "name_ja" "text",
    CONSTRAINT "artist_members_social_links_is_array" CHECK (("jsonb_typeof"("social_links") = 'array'::"text"))
);


ALTER TABLE "public"."artist_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artist_scene_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scene_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "outline" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "mask_url" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "artist_scene_members_outline_array" CHECK (("jsonb_typeof"("outline") = 'array'::"text")),
    CONSTRAINT "artist_scene_members_outline_minimum" CHECK (("jsonb_array_length"("outline") >= 3))
);


ALTER TABLE "public"."artist_scene_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artist_scenes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "artist_id" "uuid" NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "image_url" "text" NOT NULL,
    "image_width" integer,
    "image_height" integer,
    "is_hero" boolean DEFAULT false NOT NULL,
    "is_published" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title_ko" "text",
    "title_en" "text",
    "title_ja" "text",
    "link_url" "text",
    CONSTRAINT "artist_scenes_image_height_positive" CHECK ((("image_height" IS NULL) OR ("image_height" > 0))),
    CONSTRAINT "artist_scenes_image_width_positive" CHECK ((("image_width" IS NULL) OR ("image_width" > 0)))
);


ALTER TABLE "public"."artist_scenes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."artist_scenes"."title" IS 'Legacy canonical scene title; kept for compatibility.';



COMMENT ON COLUMN "public"."artist_scenes"."link_url" IS 'Optional HTTP(S) URL or site-relative path opened from the scene arrow button.';



CREATE TABLE IF NOT EXISTS "public"."artist_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "artist_id" "uuid" NOT NULL,
    "event_date" "date" NOT NULL,
    "start_time" time without time zone,
    "category" "text" DEFAULT 'etc'::"text" NOT NULL,
    "title_ko" "text" NOT NULL,
    "title_en" "text",
    "title_ja" "text",
    "description_ko" "text",
    "description_en" "text",
    "description_ja" "text",
    "location" "text",
    "link_url" "text",
    "is_published" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "location_ko" "text",
    "location_en" "text",
    "location_ja" "text",
    CONSTRAINT "artist_schedules_category_check" CHECK (("category" = ANY (ARRAY['show'::"text", 'release'::"text", 'anniversary'::"text", 'event'::"text", 'etc'::"text"]))),
    CONSTRAINT "artist_schedules_link_url_http_check" CHECK ((("link_url" IS NULL) OR ("btrim"("link_url") ~* '^https?://[^[:space:]]+$'::"text")))
);


ALTER TABLE "public"."artist_schedules" OWNER TO "postgres";


COMMENT ON COLUMN "public"."artist_schedules"."location" IS 'Legacy canonical location; kept for compatibility.';



CREATE TABLE IF NOT EXISTS "public"."artists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "logo_url" "text",
    "social_links" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "color" "text" DEFAULT '#FC6FCF'::"text" NOT NULL,
    "eng_name" "text",
    "type" "text" DEFAULT 'group'::"text" NOT NULL,
    "debut_date" "date",
    "image_url" "text",
    "description_ko" "text",
    "description_en" "text",
    "description_ja" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "name_ko" "text",
    "name_en" "text",
    "name_ja" "text",
    CONSTRAINT "artists_social_links_is_array" CHECK (("jsonb_typeof"("social_links") = 'array'::"text"))
);


ALTER TABLE "public"."artists" OWNER TO "postgres";


COMMENT ON COLUMN "public"."artists"."name" IS 'Legacy canonical Korean/default name; kept for compatibility.';



COMMENT ON COLUMN "public"."artists"."eng_name" IS 'Legacy canonical English name; kept for compatibility.';



CREATE TABLE IF NOT EXISTS "public"."audition_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description_i18n" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "audition_campaigns_check" CHECK ((("ends_at" IS NULL) OR ("starts_at" IS NULL) OR ("ends_at" > "starts_at"))),
    CONSTRAINT "audition_campaigns_description_i18n_check" CHECK (("jsonb_typeof"("description_i18n") = 'object'::"text")),
    CONSTRAINT "audition_campaigns_title_check" CHECK ((("char_length"("title") >= 1) AND ("char_length"("title") <= 160)))
);


ALTER TABLE "public"."audition_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audition_form_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "field_key" "text" NOT NULL,
    "label_i18n" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "help_text" "text",
    "field_type" "text" NOT NULL,
    "options" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "required" boolean DEFAULT false NOT NULL,
    "max_length" integer,
    "max_file_size_mb" integer,
    "accepted_file_types" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_primary_label" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "audition_form_fields_field_key_check" CHECK (("field_key" ~ '^[a-z][a-z0-9_]{0,63}$'::"text")),
    CONSTRAINT "audition_form_fields_field_type_check" CHECK (("field_type" = ANY (ARRAY['short_text'::"text", 'long_text'::"text", 'select'::"text", 'radio'::"text", 'checkbox'::"text", 'date'::"text", 'file'::"text", 'consent'::"text"]))),
    CONSTRAINT "audition_form_fields_label_i18n_check" CHECK ((("jsonb_typeof"("label_i18n") = 'object'::"text") AND (COALESCE(NULLIF("btrim"(("label_i18n" ->> 'ko'::"text")), ''::"text"), NULLIF("btrim"(("label_i18n" ->> 'en'::"text")), ''::"text"), NULLIF("btrim"(("label_i18n" ->> 'ja'::"text")), ''::"text")) IS NOT NULL))),
    CONSTRAINT "audition_form_fields_max_file_size_mb_check" CHECK ((("max_file_size_mb" >= 1) AND ("max_file_size_mb" <= 100))),
    CONSTRAINT "audition_form_fields_max_length_check" CHECK ((("max_length" >= 1) AND ("max_length" <= 10000))),
    CONSTRAINT "audition_form_fields_options_check" CHECK (("jsonb_typeof"("options") = 'array'::"text"))
);


ALTER TABLE "public"."audition_form_fields" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audition_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "birth" "text",
    "gender" "text",
    "contact" "text",
    "email" "text",
    "category" "text",
    "intro" "text",
    "link" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "audition_id" "uuid",
    "user_id" "uuid",
    "answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "attachment_path" "text",
    "attachment_name" "text",
    "attachment_size" bigint,
    "campaign_id" "uuid",
    "form_snapshot" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "applicant_email_hash" "text",
    "reviewer_notes" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    CONSTRAINT "audition_submissions_attachment_check" CHECK (((("attachment_path" IS NULL) AND ("attachment_name" IS NULL) AND ("attachment_size" IS NULL)) OR (("attachment_path" IS NOT NULL) AND ("attachment_name" IS NOT NULL) AND ("attachment_size" >= 1) AND ("attachment_size" <= 52428800)))),
    CONSTRAINT "audition_submissions_email_hash_shape" CHECK ((("applicant_email_hash" IS NULL) OR ("applicant_email_hash" ~ '^[0-9a-f]{64}$'::"text"))),
    CONSTRAINT "audition_submissions_form_snapshot_array" CHECK (("jsonb_typeof"("form_snapshot") = 'array'::"text")),
    CONSTRAINT "audition_submissions_reviewer_notes_length" CHECK ((("reviewer_notes" IS NULL) OR ("char_length"("reviewer_notes") <= 10000))),
    CONSTRAINT "audition_submissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewing'::"text", 'accepted'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."audition_submissions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."audition_submissions"."audition_id" IS 'FK to auditions. NULL for legacy pre-session rows.';



COMMENT ON COLUMN "public"."audition_submissions"."user_id" IS 'Auth user who submitted. NULL for legacy rows that predate login requirement.';



COMMENT ON COLUMN "public"."audition_submissions"."answers" IS '{fieldId: string | string[]} — dynamic form answers keyed by AuditionField.id';



COMMENT ON COLUMN "public"."audition_submissions"."attachment_path" IS 'Storage path in the audition-attachments bucket (images/PDF).';



CREATE TABLE IF NOT EXISTS "public"."auditions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" DEFAULT '오디션'::"text" NOT NULL,
    "status" "text" DEFAULT 'tba'::"text" NOT NULL,
    "start_at" timestamp with time zone,
    "end_at" timestamp with time zone,
    "categories" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "form_schema" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category_forms" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "auditions_categories_check" CHECK (("jsonb_typeof"("categories") = 'array'::"text")),
    CONSTRAINT "auditions_form_schema_check" CHECK (("jsonb_typeof"("form_schema") = 'array'::"text")),
    CONSTRAINT "auditions_status_check" CHECK (("status" = ANY (ARRAY['tba'::"text", 'open'::"text", 'closed'::"text", 'reviewing'::"text", 'done'::"text"])))
);


ALTER TABLE "public"."auditions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."auditions"."status" IS 'tba = 공고 예정, open = 접수 중, closed = 마감, reviewing = 심사 중, done = 결과 발표';



COMMENT ON COLUMN "public"."auditions"."categories" IS 'string[] — 지원 분과 목록 (e.g. ["보컬", "댄스"])';



COMMENT ON COLUMN "public"."auditions"."form_schema" IS 'AuditionField[] — 어드민이 구성한 커스텀 폼 필드 목록';



CREATE TABLE IF NOT EXISTS "public"."avatar_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "artist_id" "uuid" NOT NULL,
    "image_path" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "avatar_assets_image_path_check" CHECK ((("length"("image_path") <= 500) AND ("image_path" ~~ (("artist_id")::"text" || '/avatars/%'::"text")))),
    CONSTRAINT "avatar_assets_sort_order_check" CHECK (("sort_order" >= 0))
);


ALTER TABLE "public"."avatar_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_inquiries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "category" "text" NOT NULL,
    "inquiry_type" "text" NOT NULL,
    "company_name" "text",
    "contact_name" "text" NOT NULL,
    "phone" "text",
    "email" "text" NOT NULL,
    "message" "text" NOT NULL,
    "attachment_path" "text",
    "attachment_name" "text",
    "attachment_size" bigint,
    "privacy_consent" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "admin_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "answered_at" timestamp with time zone,
    "answered_by" "uuid",
    CONSTRAINT "contact_inquiries_attachment_check" CHECK (((("attachment_path" IS NULL) AND ("attachment_name" IS NULL) AND ("attachment_size" IS NULL)) OR (("category" = 'business'::"text") AND ("attachment_path" IS NOT NULL) AND ("attachment_name" IS NOT NULL) AND (("attachment_size" >= 1) AND ("attachment_size" <= 20971520))))),
    CONSTRAINT "contact_inquiries_business_fields_check" CHECK ((("category" <> 'business'::"text") OR ((("length"("btrim"(COALESCE("company_name", ''::"text"))) >= 1) AND ("length"("btrim"(COALESCE("company_name", ''::"text"))) <= 120)) AND (("length"("btrim"(COALESCE("phone", ''::"text"))) >= 1) AND ("length"("btrim"(COALESCE("phone", ''::"text"))) <= 40))))),
    CONSTRAINT "contact_inquiries_category_check" CHECK (("category" = ANY (ARRAY['general'::"text", 'business'::"text"]))),
    CONSTRAINT "contact_inquiries_privacy_consent_check" CHECK (("privacy_consent" = true)),
    CONSTRAINT "contact_inquiries_required_text_check" CHECK (((("length"("btrim"("contact_name")) >= 1) AND ("length"("btrim"("contact_name")) <= 80)) AND (("length"("btrim"("email")) >= 3) AND ("length"("btrim"("email")) <= 254)) AND (("length"("btrim"("message")) >= 1) AND ("length"("btrim"("message")) <= 5000)))),
    CONSTRAINT "contact_inquiries_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewing'::"text", 'answered'::"text", 'closed'::"text"]))),
    CONSTRAINT "contact_inquiries_type_check" CHECK (((("category" = 'general'::"text") AND ("inquiry_type" = ANY (ARRAY['account'::"text", 'notice_event'::"text", 'goods_md'::"text", 'site_error'::"text", 'other'::"text"]))) OR (("category" = 'business'::"text") AND ("inquiry_type" = ANY (ARRAY['brand_collaboration'::"text", 'advertising_sponsorship'::"text", 'md_licensing'::"text", 'performance_event'::"text", 'other_business'::"text"])))))
);


ALTER TABLE "public"."contact_inquiries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."home_hero_slides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."home_hero_slides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "artist_id" "uuid",
    "title_ko" "text" NOT NULL,
    "title_en" "text",
    "title_ja" "text",
    "content_ko" "text",
    "content_en" "text",
    "content_ja" "text",
    "category_ko" "text" DEFAULT '공지'::"text" NOT NULL,
    "category_en" "text" DEFAULT 'Notice'::"text",
    "category_ja" "text" DEFAULT 'お知らせ'::"text",
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role" "text",
    "avatar_asset_id" "uuid",
    CONSTRAINT "profiles_role_check" CHECK ((("role" IS NULL) OR ("role" = ANY (ARRAY['super_admin'::"text", 'editor'::"text"]))))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protect_report_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."protect_report_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protect_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reporter_email" "text",
    "artist_id" "uuid" NOT NULL,
    "report_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "platform" "text" NOT NULL,
    "post_url" "text" NOT NULL,
    "posted_at" "date" NOT NULL,
    "author_name" "text" NOT NULL,
    "post_ip" "text",
    "confirmation" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "admin_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "protect_reports_confirmation_check" CHECK (("confirmation" = true)),
    CONSTRAINT "protect_reports_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewing'::"text", 'resolved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "protect_reports_type_check" CHECK (("report_type" = ANY (ARRAY['defamation'::"text", 'harassment'::"text", 'impersonation'::"text", 'copyright'::"text", 'privacy'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."protect_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "key" "text" NOT NULL,
    "value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "site_settings_social_is_array" CHECK ((("key" <> 'social'::"text") OR ("jsonb_typeof"("value") = 'array'::"text")))
);


ALTER TABLE "public"."site_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tracks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "track_number" integer NOT NULL,
    "duration_seconds" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "spotify_url" "text",
    "audio_url" "text",
    "music_video_url" "text",
    "logo_url" "text",
    "is_title" boolean DEFAULT false NOT NULL,
    "youtube_url" "text",
    "title_ko" "text",
    "title_en" "text",
    "title_ja" "text",
    CONSTRAINT "tracks_duration_seconds_check" CHECK ((("duration_seconds" IS NULL) OR ("duration_seconds" >= 0))),
    CONSTRAINT "tracks_urls_http_check" CHECK (((("spotify_url" IS NULL) OR ("btrim"("spotify_url") ~* '^https?://[^[:space:]]+$'::"text")) AND (("youtube_url" IS NULL) OR ("btrim"("youtube_url") ~* '^https?://[^[:space:]]+$'::"text")) AND (("audio_url" IS NULL) OR ("btrim"("audio_url") ~* '^https?://[^[:space:]]+$'::"text")) AND (("music_video_url" IS NULL) OR ("btrim"("music_video_url") ~* '^https?://[^[:space:]]+$'::"text"))))
);


ALTER TABLE "public"."tracks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tracks"."title" IS 'Legacy canonical track title; kept for compatibility.';



ALTER TABLE ONLY "public"."admin_audit_logs"
    ADD CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_onboarding_progress"
    ADD CONSTRAINT "admin_onboarding_progress_pkey" PRIMARY KEY ("user_id", "chapter_id");



ALTER TABLE ONLY "public"."albums"
    ADD CONSTRAINT "albums_artist_id_slug_key" UNIQUE ("artist_id", "slug");



ALTER TABLE ONLY "public"."albums"
    ADD CONSTRAINT "albums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artist_gallery"
    ADD CONSTRAINT "artist_gallery_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artist_members"
    ADD CONSTRAINT "artist_members_artist_id_slug_key" UNIQUE ("artist_id", "slug");



ALTER TABLE ONLY "public"."artist_members"
    ADD CONSTRAINT "artist_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artist_scene_members"
    ADD CONSTRAINT "artist_scene_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artist_scene_members"
    ADD CONSTRAINT "artist_scene_members_unique" UNIQUE ("scene_id", "member_id");



ALTER TABLE ONLY "public"."artist_scenes"
    ADD CONSTRAINT "artist_scenes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artist_schedules"
    ADD CONSTRAINT "artist_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artists"
    ADD CONSTRAINT "artists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artists"
    ADD CONSTRAINT "artists_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."audition_campaigns"
    ADD CONSTRAINT "audition_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audition_form_fields"
    ADD CONSTRAINT "audition_form_fields_campaign_id_field_key_key" UNIQUE ("campaign_id", "field_key");



ALTER TABLE ONLY "public"."audition_form_fields"
    ADD CONSTRAINT "audition_form_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audition_submissions"
    ADD CONSTRAINT "audition_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auditions"
    ADD CONSTRAINT "auditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."avatar_assets"
    ADD CONSTRAINT "avatar_assets_image_path_key" UNIQUE ("image_path");



ALTER TABLE ONLY "public"."avatar_assets"
    ADD CONSTRAINT "avatar_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_inquiries"
    ADD CONSTRAINT "contact_inquiries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."home_hero_slides"
    ADD CONSTRAINT "home_hero_slides_album_id_key" UNIQUE ("album_id");



ALTER TABLE ONLY "public"."home_hero_slides"
    ADD CONSTRAINT "home_hero_slides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notices"
    ADD CONSTRAINT "notices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protect_report_attachments"
    ADD CONSTRAINT "protect_report_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protect_reports"
    ADD CONSTRAINT "protect_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."tracks"
    ADD CONSTRAINT "tracks_album_id_track_number_key" UNIQUE ("album_id", "track_number");



ALTER TABLE ONLY "public"."tracks"
    ADD CONSTRAINT "tracks_pkey" PRIMARY KEY ("id");



CREATE INDEX "admin_audit_logs_actor_index" ON "public"."admin_audit_logs" USING "btree" ("actor_id", "occurred_at" DESC);



CREATE INDEX "admin_audit_logs_occurred_at_index" ON "public"."admin_audit_logs" USING "btree" ("occurred_at" DESC, "id" DESC);



CREATE INDEX "admin_audit_logs_operation_index" ON "public"."admin_audit_logs" USING "btree" ("operation", "occurred_at" DESC);



CREATE INDEX "admin_audit_logs_target_index" ON "public"."admin_audit_logs" USING "btree" ("table_name", "record_id", "occurred_at" DESC);



CREATE INDEX "albums_public_order_idx" ON "public"."albums" USING "btree" ("artist_id", "is_published", "sort_order", "release_date" DESC);



CREATE INDEX "artist_gallery_album_idx" ON "public"."artist_gallery" USING "btree" ("album_id") WHERE ("album_id" IS NOT NULL);



CREATE INDEX "artist_gallery_artist_idx" ON "public"."artist_gallery" USING "btree" ("artist_id", "sort_order");



CREATE INDEX "artist_gallery_member_idx" ON "public"."artist_gallery" USING "btree" ("member_id") WHERE ("member_id" IS NOT NULL);



CREATE INDEX "artist_scene_members_member_idx" ON "public"."artist_scene_members" USING "btree" ("member_id", "scene_id");



CREATE INDEX "artist_scene_members_scene_idx" ON "public"."artist_scene_members" USING "btree" ("scene_id", "sort_order");



CREATE INDEX "artist_scenes_artist_order_idx" ON "public"."artist_scenes" USING "btree" ("artist_id", "sort_order", "created_at");



CREATE UNIQUE INDEX "artist_scenes_one_hero_idx" ON "public"."artist_scenes" USING "btree" ("artist_id") WHERE ("is_hero" = true);



CREATE INDEX "artist_schedules_public_calendar_idx" ON "public"."artist_schedules" USING "btree" ("artist_id", "is_published", "event_date", "start_time", "sort_order");



CREATE INDEX "audition_campaigns_public_idx" ON "public"."audition_campaigns" USING "btree" ("is_active", "starts_at", "ends_at");



CREATE INDEX "audition_form_fields_campaign_order_idx" ON "public"."audition_form_fields" USING "btree" ("campaign_id", "is_active", "sort_order");



CREATE UNIQUE INDEX "audition_form_fields_primary_label_uidx" ON "public"."audition_form_fields" USING "btree" ("campaign_id") WHERE ("is_primary_label" AND "is_active");



CREATE INDEX "audition_submissions_answers_gin_idx" ON "public"."audition_submissions" USING "gin" ("answers");



CREATE UNIQUE INDEX "audition_submissions_campaign_email_uidx" ON "public"."audition_submissions" USING "btree" ("campaign_id", "applicant_email_hash") WHERE (("campaign_id" IS NOT NULL) AND ("applicant_email_hash" IS NOT NULL));



CREATE UNIQUE INDEX "audition_submissions_campaign_user_uidx" ON "public"."audition_submissions" USING "btree" ("campaign_id", "user_id") WHERE (("campaign_id" IS NOT NULL) AND ("user_id" IS NOT NULL));



CREATE INDEX "audition_submissions_created_at_index" ON "public"."audition_submissions" USING "btree" ("created_at" DESC);



CREATE INDEX "avatar_assets_artist_order_idx" ON "public"."avatar_assets" USING "btree" ("artist_id", "sort_order", "created_at");



CREATE INDEX "contact_inquiries_category_created_at_idx" ON "public"."contact_inquiries" USING "btree" ("category", "created_at" DESC);



CREATE INDEX "contact_inquiries_status_created_at_idx" ON "public"."contact_inquiries" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "contact_inquiries_user_id_idx" ON "public"."contact_inquiries" USING "btree" ("user_id", "created_at" DESC) WHERE ("user_id" IS NOT NULL);



CREATE INDEX "home_hero_slides_active_order_idx" ON "public"."home_hero_slides" USING "btree" ("is_active", "sort_order");



CREATE INDEX "notices_artist_index" ON "public"."notices" USING "btree" ("artist_id", "is_published", "published_at" DESC);



CREATE INDEX "notices_global_index" ON "public"."notices" USING "btree" ("is_published", "published_at" DESC) WHERE ("artist_id" IS NULL);



CREATE INDEX "profiles_avatar_asset_idx" ON "public"."profiles" USING "btree" ("avatar_asset_id") WHERE ("avatar_asset_id" IS NOT NULL);



CREATE INDEX "protect_report_attachments_report_id_idx" ON "public"."protect_report_attachments" USING "btree" ("report_id");



CREATE INDEX "protect_reports_created_at_idx" ON "public"."protect_reports" USING "btree" ("created_at" DESC);



CREATE INDEX "protect_reports_status_idx" ON "public"."protect_reports" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "tracks_album_order_idx" ON "public"."tracks" USING "btree" ("album_id", "track_number");



CREATE OR REPLACE TRIGGER "albums_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."albums" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "albums_set_updated_at" BEFORE UPDATE ON "public"."albums" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "artist_gallery_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."artist_gallery" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "artist_gallery_set_updated_at" BEFORE UPDATE ON "public"."artist_gallery" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "artist_members_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."artist_members" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "artist_members_set_updated_at" BEFORE UPDATE ON "public"."artist_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "artist_scene_members_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."artist_scene_members" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "artist_scene_members_set_updated_at" BEFORE UPDATE ON "public"."artist_scene_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "artist_scenes_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."artist_scenes" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "artist_scenes_set_updated_at" BEFORE UPDATE ON "public"."artist_scenes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "artist_schedules_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."artist_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "artist_schedules_set_updated_at" BEFORE UPDATE ON "public"."artist_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "artists_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."artists" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "artists_set_updated_at" BEFORE UPDATE ON "public"."artists" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "audition_campaigns_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."audition_campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "audition_campaigns_set_updated_at" BEFORE UPDATE ON "public"."audition_campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "audition_form_fields_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."audition_form_fields" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "audition_form_fields_set_updated_at" BEFORE UPDATE ON "public"."audition_form_fields" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "audition_submissions_admin_audit" AFTER DELETE OR UPDATE ON "public"."audition_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'sensitive');



CREATE OR REPLACE TRIGGER "audition_submissions_set_updated_at" BEFORE UPDATE ON "public"."audition_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "avatar_assets_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."avatar_assets" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "avatar_assets_clear_inactive_profiles" AFTER UPDATE OF "is_active" ON "public"."avatar_assets" FOR EACH ROW WHEN (("old"."is_active" IS DISTINCT FROM "new"."is_active")) EXECUTE FUNCTION "public"."clear_inactive_profile_avatars"();



CREATE OR REPLACE TRIGGER "avatar_assets_set_updated_at" BEFORE UPDATE ON "public"."avatar_assets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "contact_inquiries_admin_audit" AFTER DELETE OR UPDATE ON "public"."contact_inquiries" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'sensitive');



CREATE OR REPLACE TRIGGER "contact_inquiries_set_attachment_size" BEFORE INSERT ON "public"."contact_inquiries" FOR EACH ROW EXECUTE FUNCTION "public"."set_contact_attachment_size_from_storage"();



CREATE OR REPLACE TRIGGER "contact_inquiries_set_updated_at" BEFORE UPDATE ON "public"."contact_inquiries" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "home_hero_slides_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."home_hero_slides" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "home_hero_slides_set_updated_at" BEFORE UPDATE ON "public"."home_hero_slides" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "notices_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."notices" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "notices_set_updated_at" BEFORE UPDATE ON "public"."notices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_admin_role_audit" AFTER UPDATE OF "role" ON "public"."profiles" FOR EACH ROW WHEN (("old"."role" IS DISTINCT FROM "new"."role")) EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "profiles_normalize_avatar" BEFORE INSERT OR UPDATE OF "avatar_asset_id" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."normalize_profile_avatar"();



CREATE OR REPLACE TRIGGER "protect_reports_admin_audit" AFTER DELETE OR UPDATE ON "public"."protect_reports" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'sensitive');



CREATE OR REPLACE TRIGGER "protect_reports_set_updated_at" BEFORE UPDATE ON "public"."protect_reports" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "site_settings_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('key', 'standard');



CREATE OR REPLACE TRIGGER "site_settings_set_updated_at" BEFORE UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tracks_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."tracks" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "tracks_set_updated_at" BEFORE UPDATE ON "public"."tracks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_audit_audition_submissions" AFTER UPDATE ON "public"."audition_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'sensitive');



CREATE OR REPLACE TRIGGER "trg_auditions_updated_at" BEFORE UPDATE ON "public"."auditions" FOR EACH ROW EXECUTE FUNCTION "public"."touch_audition_updated_at"();



ALTER TABLE ONLY "public"."admin_onboarding_progress"
    ADD CONSTRAINT "admin_onboarding_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."albums"
    ADD CONSTRAINT "albums_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artist_gallery"
    ADD CONSTRAINT "artist_gallery_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."artist_gallery"
    ADD CONSTRAINT "artist_gallery_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artist_gallery"
    ADD CONSTRAINT "artist_gallery_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."artist_members"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."artist_members"
    ADD CONSTRAINT "artist_members_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artist_scene_members"
    ADD CONSTRAINT "artist_scene_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."artist_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artist_scene_members"
    ADD CONSTRAINT "artist_scene_members_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "public"."artist_scenes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artist_scenes"
    ADD CONSTRAINT "artist_scenes_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artist_schedules"
    ADD CONSTRAINT "artist_schedules_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audition_campaigns"
    ADD CONSTRAINT "audition_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audition_form_fields"
    ADD CONSTRAINT "audition_form_fields_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."audition_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audition_submissions"
    ADD CONSTRAINT "audition_submissions_audition_id_fkey" FOREIGN KEY ("audition_id") REFERENCES "public"."auditions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audition_submissions"
    ADD CONSTRAINT "audition_submissions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."audition_campaigns"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."audition_submissions"
    ADD CONSTRAINT "audition_submissions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audition_submissions"
    ADD CONSTRAINT "audition_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."avatar_assets"
    ADD CONSTRAINT "avatar_assets_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_inquiries"
    ADD CONSTRAINT "contact_inquiries_answered_by_fkey" FOREIGN KEY ("answered_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contact_inquiries"
    ADD CONSTRAINT "contact_inquiries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."home_hero_slides"
    ADD CONSTRAINT "home_hero_slides_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notices"
    ADD CONSTRAINT "notices_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_avatar_asset_id_fkey" FOREIGN KEY ("avatar_asset_id") REFERENCES "public"."avatar_assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."protect_report_attachments"
    ADD CONSTRAINT "protect_report_attachments_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."protect_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."protect_reports"
    ADD CONSTRAINT "protect_reports_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."protect_reports"
    ADD CONSTRAINT "protect_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tracks"
    ADD CONSTRAINT "tracks_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE CASCADE;



CREATE POLICY "admin delete artists" ON "public"."artists" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admin full access auditions" ON "public"."auditions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"text", 'editor'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"text", 'editor'::"text"]))))));



CREATE POLICY "admin insert artists" ON "public"."artists" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage albums" ON "public"."albums" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage artist gallery" ON "public"."artist_gallery" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage artist members" ON "public"."artist_members" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage artist scene members" ON "public"."artist_scene_members" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage artist scenes" ON "public"."artist_scenes" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage artist schedules" ON "public"."artist_schedules" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage home hero slides" ON "public"."home_hero_slides" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage notices" ON "public"."notices" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage site settings" ON "public"."site_settings" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage tracks" ON "public"."tracks" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin read all artists" ON "public"."artists" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admin update artists" ON "public"."artists" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."admin_audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_onboarding_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admins create own onboarding progress" ON "public"."admin_onboarding_progress" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND "public"."is_admin"()));



CREATE POLICY "admins delete audition campaigns" ON "public"."audition_campaigns" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admins delete audition fields" ON "public"."audition_form_fields" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admins delete contact inquiries" ON "public"."contact_inquiries" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admins delete protect reports" ON "public"."protect_reports" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admins insert audition campaigns" ON "public"."audition_campaigns" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "admins insert audition fields" ON "public"."audition_form_fields" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "admins manage avatar assets" ON "public"."avatar_assets" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admins read audit logs" ON "public"."admin_audit_logs" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admins read audition submissions" ON "public"."audition_submissions" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admins read contact inquiries" ON "public"."contact_inquiries" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admins read own onboarding progress" ON "public"."admin_onboarding_progress" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND "public"."is_admin"()));



CREATE POLICY "admins update audition campaigns" ON "public"."audition_campaigns" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admins update audition fields" ON "public"."audition_form_fields" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admins update audition submissions" ON "public"."audition_submissions" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admins update contact inquiries" ON "public"."contact_inquiries" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admins update own onboarding progress" ON "public"."admin_onboarding_progress" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND "public"."is_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND "public"."is_admin"()));



CREATE POLICY "admins update protect reports" ON "public"."protect_reports" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."albums" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "applicants read submitted audition campaigns" ON "public"."audition_campaigns" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."audition_submissions" "submission"
  WHERE (("submission"."campaign_id" = "audition_campaigns"."id") AND ("submission"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."artist_gallery" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artist_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artist_scene_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artist_scenes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artist_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audition_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audition_form_fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audition_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."auditions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated read active avatar assets" ON "public"."avatar_assets" FOR SELECT TO "authenticated" USING (("is_active" OR "public"."is_admin"()));



ALTER TABLE "public"."avatar_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_inquiries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."home_hero_slides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protect_report_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protect_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public read active artist members" ON "public"."artist_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."artists"
  WHERE (("artists"."id" = "artist_members"."artist_id") AND ("artists"."is_active" = true)))));



CREATE POLICY "public read active audition campaigns" ON "public"."audition_campaigns" FOR SELECT TO "authenticated", "anon" USING ((("is_active" AND (("starts_at" IS NULL) OR ("starts_at" <= "now"())) AND (("ends_at" IS NULL) OR ("ends_at" >= "now"()))) OR "public"."is_admin"()));



CREATE POLICY "public read active audition fields" ON "public"."audition_form_fields" FOR SELECT TO "authenticated", "anon" USING ((("is_active" AND (EXISTS ( SELECT 1
   FROM "public"."audition_campaigns" "campaign"
  WHERE (("campaign"."id" = "audition_form_fields"."campaign_id") AND "campaign"."is_active" AND (("campaign"."starts_at" IS NULL) OR ("campaign"."starts_at" <= "now"())) AND (("campaign"."ends_at" IS NULL) OR ("campaign"."ends_at" >= "now"())))))) OR "public"."is_admin"()));



CREATE POLICY "public read active home hero slides" ON "public"."home_hero_slides" FOR SELECT USING ((("is_active" = true) AND (EXISTS ( SELECT 1
   FROM ("public"."albums"
     JOIN "public"."artists" ON (("artists"."id" = "albums"."artist_id")))
  WHERE (("albums"."id" = "home_hero_slides"."album_id") AND ("albums"."is_published" = true) AND ("albums"."published_at" <= "now"()) AND ("artists"."is_active" = true))))));



CREATE POLICY "public read artists" ON "public"."artists" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public read open auditions" ON "public"."auditions" FOR SELECT USING (("status" = 'open'::"text"));



CREATE POLICY "public read published albums" ON "public"."albums" FOR SELECT USING ((("is_published" = true) AND ("published_at" <= "now"()) AND (EXISTS ( SELECT 1
   FROM "public"."artists"
  WHERE (("artists"."id" = "albums"."artist_id") AND ("artists"."is_active" = true))))));



CREATE POLICY "public read published artist scenes" ON "public"."artist_scenes" FOR SELECT USING ((("is_published" = true) AND (EXISTS ( SELECT 1
   FROM "public"."artists"
  WHERE (("artists"."id" = "artist_scenes"."artist_id") AND ("artists"."is_active" = true))))));



CREATE POLICY "public read published artist schedules" ON "public"."artist_schedules" FOR SELECT USING ((("is_published" = true) AND (EXISTS ( SELECT 1
   FROM "public"."artists"
  WHERE (("artists"."id" = "artist_schedules"."artist_id") AND ("artists"."is_active" = true))))));



CREATE POLICY "public read published gallery" ON "public"."artist_gallery" FOR SELECT USING ((("is_published" = true) AND (EXISTS ( SELECT 1
   FROM "public"."artists"
  WHERE (("artists"."id" = "artist_gallery"."artist_id") AND ("artists"."is_active" = true))))));



CREATE POLICY "public read published notices" ON "public"."notices" FOR SELECT USING ((("is_published" = true) AND ("published_at" <= "now"()) AND (("artist_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."artists"
  WHERE (("artists"."id" = "notices"."artist_id") AND ("artists"."is_active" = true)))))));



CREATE POLICY "public read published scene members" ON "public"."artist_scene_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."artist_scenes" "scene"
     JOIN "public"."artists" "artist" ON (("artist"."id" = "scene"."artist_id")))
  WHERE (("scene"."id" = "artist_scene_members"."scene_id") AND ("scene"."is_published" = true) AND ("artist"."is_active" = true)))));



CREATE POLICY "public read site settings" ON "public"."site_settings" FOR SELECT USING (true);



CREATE POLICY "public read tracks for published albums" ON "public"."tracks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."albums"
     JOIN "public"."artists" ON (("artists"."id" = "albums"."artist_id")))
  WHERE (("albums"."id" = "tracks"."album_id") AND ("albums"."is_published" = true) AND ("albums"."published_at" <= "now"()) AND ("artists"."is_active" = true)))));



ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "super admins manage all profiles" ON "public"."profiles" TO "authenticated" USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



ALTER TABLE "public"."tracks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users create own protect reports" ON "public"."protect_reports" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users delete own protect report attachments" ON "public"."protect_report_attachments" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."protect_reports" "r"
  WHERE (("r"."id" = "protect_report_attachments"."report_id") AND (("r"."user_id" = "auth"."uid"()) OR "public"."is_admin"())))));



CREATE POLICY "users insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((("id" = "auth"."uid"()) AND ("role" IS NULL) AND ("email" = COALESCE(("auth"."jwt"() ->> 'email'::"text"), ''::"text"))));



CREATE POLICY "users insert own protect report attachments" ON "public"."protect_report_attachments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."protect_reports" "r"
  WHERE (("r"."id" = "protect_report_attachments"."report_id") AND ("r"."user_id" = "auth"."uid"())))));



CREATE POLICY "users read own audition submissions" ON "public"."audition_submissions" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "users read own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "users read own protect report attachments" ON "public"."protect_report_attachments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."protect_reports" "r"
  WHERE (("r"."id" = "protect_report_attachments"."report_id") AND (("r"."user_id" = "auth"."uid"()) OR "public"."is_admin"())))));



CREATE POLICY "users read own protect reports" ON "public"."protect_reports" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR "public"."is_admin"()));



CREATE POLICY "users update own non-privileged fields" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK ((("auth"."uid"() = "id") AND (NOT ("role" IS DISTINCT FROM ( SELECT "profiles_1"."role"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"()))))));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."capture_admin_audit"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."clear_inactive_profile_avatars"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."consume_login_rate_limit"("p_identifier_hash" "text", "p_ip_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."consume_login_rate_limit"("p_identifier_hash" "text", "p_ip_hash" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."consume_submission_rate_limit"("p_scope" "text", "p_key_hash" "text", "p_limit" integer, "p_window_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."consume_submission_rate_limit"("p_scope" "text", "p_key_hash" "text", "p_limit" integer, "p_window_seconds" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_profile_for_new_user"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."get_admin_audition_submissions"("p_campaign_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_audition_submissions"("p_campaign_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_admin_audition_submissions"("p_campaign_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_my_audition_submissions"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_my_audition_submissions"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_my_audition_submissions"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."has_admin_role"("p_role" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_admin_role"("p_role" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."has_admin_role"("p_role" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_google_only_email"("p_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_google_only_email"("p_email" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_super_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."normalize_profile_avatar"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."reorder_albums"("p_artist_id" "uuid", "p_album_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reorder_albums"("p_artist_id" "uuid", "p_album_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reorder_albums"("p_artist_id" "uuid", "p_album_ids" "uuid"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."reset_login_rate_limit"("p_identifier_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reset_login_rate_limit"("p_identifier_hash" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_album_with_tracks"("p_album" "jsonb", "p_tracks" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_album_with_tracks"("p_album" "jsonb", "p_tracks" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_album_with_tracks"("p_album" "jsonb", "p_tracks" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_avatar_assets"("p_artist_id" "uuid", "p_items" "jsonb", "p_delete_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_avatar_assets"("p_artist_id" "uuid", "p_items" "jsonb", "p_delete_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_avatar_assets"("p_artist_id" "uuid", "p_items" "jsonb", "p_delete_ids" "uuid"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_contact_attachment_size_from_storage"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_contact_attachment_size_from_storage"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM PUBLIC;



GRANT ALL ON FUNCTION "public"."touch_audition_updated_at"() TO "service_role";



GRANT SELECT ON TABLE "public"."admin_audit_logs" TO "service_role";
GRANT SELECT ON TABLE "public"."admin_audit_logs" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."admin_audit_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."admin_onboarding_progress" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."admin_onboarding_progress" TO "authenticated";



GRANT ALL ON TABLE "public"."albums" TO "service_role";
GRANT SELECT ON TABLE "public"."albums" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."albums" TO "authenticated";



GRANT ALL ON TABLE "public"."artist_gallery" TO "service_role";
GRANT SELECT ON TABLE "public"."artist_gallery" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."artist_gallery" TO "authenticated";



GRANT ALL ON TABLE "public"."artist_members" TO "service_role";
GRANT SELECT ON TABLE "public"."artist_members" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."artist_members" TO "authenticated";



GRANT ALL ON TABLE "public"."artist_scene_members" TO "service_role";
GRANT SELECT ON TABLE "public"."artist_scene_members" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."artist_scene_members" TO "authenticated";



GRANT ALL ON TABLE "public"."artist_scenes" TO "service_role";
GRANT SELECT ON TABLE "public"."artist_scenes" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."artist_scenes" TO "authenticated";



GRANT ALL ON TABLE "public"."artist_schedules" TO "service_role";
GRANT SELECT ON TABLE "public"."artist_schedules" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."artist_schedules" TO "authenticated";



GRANT ALL ON TABLE "public"."artists" TO "service_role";
GRANT SELECT ON TABLE "public"."artists" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."artists" TO "authenticated";



GRANT ALL ON TABLE "public"."audition_campaigns" TO "service_role";
GRANT SELECT ON TABLE "public"."audition_campaigns" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."audition_campaigns" TO "authenticated";



GRANT ALL ON TABLE "public"."audition_form_fields" TO "service_role";
GRANT SELECT ON TABLE "public"."audition_form_fields" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."audition_form_fields" TO "authenticated";



GRANT ALL ON TABLE "public"."audition_submissions" TO "service_role";



GRANT SELECT("id") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT SELECT("status"),UPDATE("status") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT SELECT("created_at") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT SELECT("updated_at") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT SELECT("user_id") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT SELECT("answers") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT SELECT("campaign_id") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT SELECT("form_snapshot") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT UPDATE("reviewer_notes") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT UPDATE("reviewed_by") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT UPDATE("reviewed_at") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT ALL ON TABLE "public"."auditions" TO "service_role";



GRANT ALL ON TABLE "public"."avatar_assets" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."avatar_assets" TO "authenticated";



GRANT ALL ON TABLE "public"."contact_inquiries" TO "service_role";
GRANT SELECT,DELETE,UPDATE ON TABLE "public"."contact_inquiries" TO "authenticated";



GRANT ALL ON TABLE "public"."home_hero_slides" TO "service_role";
GRANT SELECT ON TABLE "public"."home_hero_slides" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."home_hero_slides" TO "authenticated";



GRANT ALL ON TABLE "public"."notices" TO "service_role";
GRANT SELECT ON TABLE "public"."notices" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."notices" TO "authenticated";



GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."profiles" TO "authenticated";



GRANT ALL ON TABLE "public"."protect_report_attachments" TO "service_role";
GRANT SELECT,DELETE ON TABLE "public"."protect_report_attachments" TO "authenticated";



GRANT ALL ON TABLE "public"."protect_reports" TO "service_role";
GRANT SELECT,DELETE,UPDATE ON TABLE "public"."protect_reports" TO "authenticated";



GRANT ALL ON TABLE "public"."site_settings" TO "service_role";
GRANT SELECT ON TABLE "public"."site_settings" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."site_settings" TO "authenticated";



GRANT ALL ON TABLE "public"."tracks" TO "service_role";
GRANT SELECT ON TABLE "public"."tracks" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."tracks" TO "authenticated";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







