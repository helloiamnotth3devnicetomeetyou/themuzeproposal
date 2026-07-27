


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



CREATE OR REPLACE FUNCTION "public"."check_login_rate_limit"("p_identifier_hash" "text", "p_ip_hash" "text") RETURNS TABLE("is_allowed" boolean, "retry_after_seconds" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'private', 'public', 'pg_temp'
    AS $$
declare
  v_blocked_until timestamptz;
begin
  if length(p_identifier_hash) <> 64 or length(p_ip_hash) <> 64 then
    return query select false, 900;
    return;
  end if;

  select max(blocked_until)
    into v_blocked_until
  from private.login_rate_limits
  where key_hash in (p_identifier_hash, p_ip_hash)
    and blocked_until > now();

  return query
  select
    v_blocked_until is null,
    case
      when v_blocked_until is null then 0
      else greatest(1, ceil(extract(epoch from (v_blocked_until - now())))::integer)
    end;
end;
$$;


ALTER FUNCTION "public"."check_login_rate_limit"("p_identifier_hash" "text", "p_ip_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_profile_for_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, is_admin)
  values (new.id, new.email, false)
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;


ALTER FUNCTION "public"."create_profile_for_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (NEW.id, NEW.email, TRUE); -- Set TRUE to make signups admin by default for development. Change to FALSE if needed.
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_login_attempt"("p_identifier_hash" "text", "p_ip_hash" "text", "p_succeeded" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'private', 'public', 'pg_temp'
    AS $$
begin
  if length(p_identifier_hash) <> 64 or length(p_ip_hash) <> 64 then
    raise exception 'invalid rate limit key' using errcode = '22023';
  end if;

  if p_succeeded then
    delete from private.login_rate_limits where key_hash = p_identifier_hash;
    return;
  end if;

  insert into private.login_rate_limits (
    key_hash, failed_count, window_started_at, blocked_until, updated_at
  )
  values (p_identifier_hash, 1, now(), null, now())
  on conflict (key_hash) do update set
    failed_count = case
      when private.login_rate_limits.window_started_at < now() - interval '15 minutes' then 1
      else private.login_rate_limits.failed_count + 1
    end,
    window_started_at = case
      when private.login_rate_limits.window_started_at < now() - interval '15 minutes' then now()
      else private.login_rate_limits.window_started_at
    end,
    blocked_until = case
      when (
        case
          when private.login_rate_limits.window_started_at < now() - interval '15 minutes' then 1
          else private.login_rate_limits.failed_count + 1
        end
      ) >= 5 then now() + interval '15 minutes'
      else private.login_rate_limits.blocked_until
    end,
    updated_at = now();

  insert into private.login_rate_limits (
    key_hash, failed_count, window_started_at, blocked_until, updated_at
  )
  values (p_ip_hash, 1, now(), null, now())
  on conflict (key_hash) do update set
    failed_count = case
      when private.login_rate_limits.window_started_at < now() - interval '15 minutes' then 1
      else private.login_rate_limits.failed_count + 1
    end,
    window_started_at = case
      when private.login_rate_limits.window_started_at < now() - interval '15 minutes' then now()
      else private.login_rate_limits.window_started_at
    end,
    blocked_until = case
      when (
        case
          when private.login_rate_limits.window_started_at < now() - interval '15 minutes' then 1
          else private.login_rate_limits.failed_count + 1
        end
      ) >= 20 then now() + interval '15 minutes'
      else private.login_rate_limits.blocked_until
    end,
    updated_at = now();

  delete from private.login_rate_limits
  where updated_at < now() - interval '30 days';
end;
$$;


ALTER FUNCTION "public"."record_login_attempt"("p_identifier_hash" "text", "p_ip_hash" "text", "p_succeeded" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reorder_albums"("p_artist_id" "uuid", "p_album_ids" "uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."reorder_albums"("p_artist_id" "uuid", "p_album_ids" "uuid"[]) OWNER TO "postgres";


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


ALTER FUNCTION "public"."save_album_with_tracks"("p_album" "jsonb", "p_tracks" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


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
    CONSTRAINT "artist_schedules_category_check" CHECK (("category" = ANY (ARRAY['show'::"text", 'release'::"text", 'anniversary'::"text", 'event'::"text", 'etc'::"text"])))
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
    "is_admin" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
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
    CONSTRAINT "tracks_duration_seconds_check" CHECK ((("duration_seconds" IS NULL) OR ("duration_seconds" >= 0)))
);


ALTER TABLE "public"."tracks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tracks"."title" IS 'Legacy canonical track title; kept for compatibility.';



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



CREATE INDEX "albums_public_order_idx" ON "public"."albums" USING "btree" ("artist_id", "is_published", "sort_order", "release_date" DESC);



CREATE INDEX "artist_gallery_album_idx" ON "public"."artist_gallery" USING "btree" ("album_id") WHERE ("album_id" IS NOT NULL);



CREATE INDEX "artist_gallery_artist_idx" ON "public"."artist_gallery" USING "btree" ("artist_id", "sort_order");



CREATE INDEX "artist_gallery_member_idx" ON "public"."artist_gallery" USING "btree" ("member_id") WHERE ("member_id" IS NOT NULL);



CREATE INDEX "artist_scene_members_member_idx" ON "public"."artist_scene_members" USING "btree" ("member_id", "scene_id");



CREATE INDEX "artist_scene_members_scene_idx" ON "public"."artist_scene_members" USING "btree" ("scene_id", "sort_order");



CREATE INDEX "artist_scenes_artist_order_idx" ON "public"."artist_scenes" USING "btree" ("artist_id", "sort_order", "created_at");



CREATE UNIQUE INDEX "artist_scenes_one_hero_idx" ON "public"."artist_scenes" USING "btree" ("artist_id") WHERE ("is_hero" = true);



CREATE INDEX "artist_schedules_public_calendar_idx" ON "public"."artist_schedules" USING "btree" ("artist_id", "is_published", "event_date", "start_time", "sort_order");



CREATE INDEX "contact_inquiries_category_created_at_idx" ON "public"."contact_inquiries" USING "btree" ("category", "created_at" DESC);



CREATE INDEX "contact_inquiries_status_created_at_idx" ON "public"."contact_inquiries" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "contact_inquiries_user_id_idx" ON "public"."contact_inquiries" USING "btree" ("user_id", "created_at" DESC) WHERE ("user_id" IS NOT NULL);



CREATE INDEX "home_hero_slides_active_order_idx" ON "public"."home_hero_slides" USING "btree" ("is_active", "sort_order");



CREATE INDEX "notices_artist_index" ON "public"."notices" USING "btree" ("artist_id", "is_published", "published_at" DESC);



CREATE INDEX "notices_global_index" ON "public"."notices" USING "btree" ("is_published", "published_at" DESC) WHERE ("artist_id" IS NULL);



CREATE INDEX "protect_report_attachments_report_id_idx" ON "public"."protect_report_attachments" USING "btree" ("report_id");



CREATE INDEX "protect_reports_created_at_idx" ON "public"."protect_reports" USING "btree" ("created_at" DESC);



CREATE INDEX "protect_reports_status_idx" ON "public"."protect_reports" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "tracks_album_order_idx" ON "public"."tracks" USING "btree" ("album_id", "track_number");



CREATE OR REPLACE TRIGGER "albums_set_updated_at" BEFORE UPDATE ON "public"."albums" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "artist_gallery_set_updated_at" BEFORE UPDATE ON "public"."artist_gallery" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "artist_members_set_updated_at" BEFORE UPDATE ON "public"."artist_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "artist_scene_members_set_updated_at" BEFORE UPDATE ON "public"."artist_scene_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "artist_scenes_set_updated_at" BEFORE UPDATE ON "public"."artist_scenes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "artist_schedules_set_updated_at" BEFORE UPDATE ON "public"."artist_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "artists_set_updated_at" BEFORE UPDATE ON "public"."artists" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "contact_inquiries_set_updated_at" BEFORE UPDATE ON "public"."contact_inquiries" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "home_hero_slides_set_updated_at" BEFORE UPDATE ON "public"."home_hero_slides" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "notices_set_updated_at" BEFORE UPDATE ON "public"."notices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "protect_reports_set_updated_at" BEFORE UPDATE ON "public"."protect_reports" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "site_settings_set_updated_at" BEFORE UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tracks_set_updated_at" BEFORE UPDATE ON "public"."tracks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



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



ALTER TABLE ONLY "public"."contact_inquiries"
    ADD CONSTRAINT "contact_inquiries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."home_hero_slides"
    ADD CONSTRAINT "home_hero_slides_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notices"
    ADD CONSTRAINT "notices_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE CASCADE;



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



CREATE POLICY "admin manage albums" ON "public"."albums" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage artist gallery" ON "public"."artist_gallery" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage artist members" ON "public"."artist_members" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage artist scene members" ON "public"."artist_scene_members" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage artist scenes" ON "public"."artist_scenes" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage artist schedules" ON "public"."artist_schedules" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage artists" ON "public"."artists" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage home hero slides" ON "public"."home_hero_slides" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage notices" ON "public"."notices" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage site settings" ON "public"."site_settings" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage tracks" ON "public"."tracks" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admins delete contact inquiries" ON "public"."contact_inquiries" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admins delete protect reports" ON "public"."protect_reports" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admins manage all profiles" ON "public"."profiles" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admins read contact inquiries" ON "public"."contact_inquiries" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admins update contact inquiries" ON "public"."contact_inquiries" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admins update protect reports" ON "public"."protect_reports" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."albums" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artist_gallery" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artist_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artist_scene_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artist_scenes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artist_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_inquiries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."home_hero_slides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protect_report_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protect_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public read active home hero slides" ON "public"."home_hero_slides" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public read artist members" ON "public"."artist_members" FOR SELECT USING (true);



CREATE POLICY "public read artists" ON "public"."artists" FOR SELECT USING (true);



CREATE POLICY "public read published albums" ON "public"."albums" FOR SELECT USING ((("is_published" = true) AND ("published_at" <= "now"())));



CREATE POLICY "public read published artist scenes" ON "public"."artist_scenes" FOR SELECT USING (("is_published" = true));



CREATE POLICY "public read published artist schedules" ON "public"."artist_schedules" FOR SELECT USING (("is_published" = true));



CREATE POLICY "public read published gallery" ON "public"."artist_gallery" FOR SELECT USING (("is_published" = true));



CREATE POLICY "public read published notices" ON "public"."notices" FOR SELECT USING ((("is_published" = true) AND ("published_at" <= "now"())));



CREATE POLICY "public read published scene members" ON "public"."artist_scene_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."artist_scenes" "scene"
  WHERE (("scene"."id" = "artist_scene_members"."scene_id") AND ("scene"."is_published" = true)))));



CREATE POLICY "public read site settings" ON "public"."site_settings" FOR SELECT USING (true);



CREATE POLICY "public read tracks for published albums" ON "public"."tracks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."albums"
  WHERE (("albums"."id" = "tracks"."album_id") AND ("albums"."is_published" = true) AND ("albums"."published_at" <= "now"())))));



ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tracks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users create own protect reports" ON "public"."protect_reports" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users delete own protect report attachments" ON "public"."protect_report_attachments" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."protect_reports" "r"
  WHERE (("r"."id" = "protect_report_attachments"."report_id") AND (("r"."user_id" = "auth"."uid"()) OR "public"."is_admin"())))));



CREATE POLICY "users insert own protect report attachments" ON "public"."protect_report_attachments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."protect_reports" "r"
  WHERE (("r"."id" = "protect_report_attachments"."report_id") AND ("r"."user_id" = "auth"."uid"())))));



CREATE POLICY "users read own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "users read own protect report attachments" ON "public"."protect_report_attachments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."protect_reports" "r"
  WHERE (("r"."id" = "protect_report_attachments"."report_id") AND (("r"."user_id" = "auth"."uid"()) OR "public"."is_admin"())))));



CREATE POLICY "users read own protect reports" ON "public"."protect_reports" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR "public"."is_admin"()));



CREATE POLICY "users update own non-privileged fields" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK ((("auth"."uid"() = "id") AND ("is_admin" = ( SELECT "profiles_1"."is_admin"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"())))));



CREATE POLICY "visitors create contact inquiries" ON "public"."contact_inquiries" FOR INSERT TO "authenticated", "anon" WITH CHECK ((("privacy_consent" = true) AND ((("auth"."uid"() IS NULL) AND ("user_id" IS NULL)) OR (("auth"."uid"() IS NOT NULL) AND (("user_id" IS NULL) OR ("user_id" = "auth"."uid"()))))));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_login_rate_limit"("p_identifier_hash" "text", "p_ip_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_login_rate_limit"("p_identifier_hash" "text", "p_ip_hash" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_login_rate_limit"("p_identifier_hash" "text", "p_ip_hash" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_login_rate_limit"("p_identifier_hash" "text", "p_ip_hash" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_profile_for_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_profile_for_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile_for_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_login_attempt"("p_identifier_hash" "text", "p_ip_hash" "text", "p_succeeded" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_login_attempt"("p_identifier_hash" "text", "p_ip_hash" "text", "p_succeeded" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."record_login_attempt"("p_identifier_hash" "text", "p_ip_hash" "text", "p_succeeded" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_login_attempt"("p_identifier_hash" "text", "p_ip_hash" "text", "p_succeeded" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."reorder_albums"("p_artist_id" "uuid", "p_album_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."reorder_albums"("p_artist_id" "uuid", "p_album_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reorder_albums"("p_artist_id" "uuid", "p_album_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."save_album_with_tracks"("p_album" "jsonb", "p_tracks" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."save_album_with_tracks"("p_album" "jsonb", "p_tracks" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_album_with_tracks"("p_album" "jsonb", "p_tracks" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."albums" TO "anon";
GRANT ALL ON TABLE "public"."albums" TO "authenticated";
GRANT ALL ON TABLE "public"."albums" TO "service_role";



GRANT ALL ON TABLE "public"."artist_gallery" TO "anon";
GRANT ALL ON TABLE "public"."artist_gallery" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_gallery" TO "service_role";



GRANT ALL ON TABLE "public"."artist_members" TO "anon";
GRANT ALL ON TABLE "public"."artist_members" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_members" TO "service_role";



GRANT ALL ON TABLE "public"."artist_scene_members" TO "anon";
GRANT ALL ON TABLE "public"."artist_scene_members" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_scene_members" TO "service_role";



GRANT ALL ON TABLE "public"."artist_scenes" TO "anon";
GRANT ALL ON TABLE "public"."artist_scenes" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_scenes" TO "service_role";



GRANT ALL ON TABLE "public"."artist_schedules" TO "anon";
GRANT ALL ON TABLE "public"."artist_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."artists" TO "anon";
GRANT ALL ON TABLE "public"."artists" TO "authenticated";
GRANT ALL ON TABLE "public"."artists" TO "service_role";



GRANT ALL ON TABLE "public"."contact_inquiries" TO "service_role";
GRANT INSERT ON TABLE "public"."contact_inquiries" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."contact_inquiries" TO "authenticated";



GRANT ALL ON TABLE "public"."home_hero_slides" TO "anon";
GRANT ALL ON TABLE "public"."home_hero_slides" TO "authenticated";
GRANT ALL ON TABLE "public"."home_hero_slides" TO "service_role";



GRANT ALL ON TABLE "public"."notices" TO "anon";
GRANT ALL ON TABLE "public"."notices" TO "authenticated";
GRANT ALL ON TABLE "public"."notices" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."protect_report_attachments" TO "anon";
GRANT ALL ON TABLE "public"."protect_report_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."protect_report_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."protect_reports" TO "anon";
GRANT ALL ON TABLE "public"."protect_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."protect_reports" TO "service_role";



GRANT ALL ON TABLE "public"."site_settings" TO "anon";
GRANT ALL ON TABLE "public"."site_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."site_settings" TO "service_role";



GRANT ALL ON TABLE "public"."tracks" TO "anon";
GRANT ALL ON TABLE "public"."tracks" TO "authenticated";
GRANT ALL ON TABLE "public"."tracks" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







