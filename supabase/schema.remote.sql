


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



CREATE OR REPLACE FUNCTION "public"."audition_submission_has_attachment"("p_path" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $_$
  select exists (
    select 1 from public.audition_submissions submission
    where submission.attachment_path = p_path
       or submission.answers @? format('$.* ? (@.path == %s)', to_json(p_path))::jsonpath
  );
$_$;


ALTER FUNCTION "public"."audition_submission_has_attachment"("p_path" "text") OWNER TO "postgres";


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
    else coalesce(nullif(v_row ->> 'name_ko', ''), nullif(v_row ->> 'name', ''), nullif(v_row ->> 'title_ko', ''), nullif(v_row ->> 'title', ''), nullif(v_row ->> 'key', ''), nullif(v_row ->> 'slug', ''), v_record_id)
  end;

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(entry.key order by entry.key), array[]::text[]) into v_changed_fields
    from jsonb_each(v_old) as entry
    where (v_new -> entry.key) is distinct from entry.value;
    if cardinality(v_changed_fields) = 0 then return new; end if;
    if v_mode = 'sensitive' then
      v_safe_fields := case tg_table_name
        when 'contact_inquiries' then array['status', 'admin_note', 'answered_at', 'answered_by']
        when 'protect_reports' then array['status', 'admin_note']
        when 'audition_submissions' then array['status', 'reviewer_notes']
        else array[]::text[]
      end;
    else
      v_safe_fields := v_changed_fields;
    end if;
    select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb) into v_before
    from jsonb_each(v_old) as entry
    where entry.key = any(v_changed_fields) and entry.key = any(v_safe_fields);
    select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb) into v_after
    from jsonb_each(v_new) as entry
    where entry.key = any(v_changed_fields) and entry.key = any(v_safe_fields);
  elsif tg_op = 'INSERT' then
    v_after := v_new;
    select coalesce(array_agg(entry.key order by entry.key), array[]::text[]) into v_changed_fields
    from jsonb_each(v_new) as entry;
  else
    if v_mode = 'sensitive' then
      v_safe_fields := case tg_table_name
        when 'contact_inquiries' then array['id', 'category', 'inquiry_type', 'status', 'admin_note', 'answered_at', 'answered_by']
        when 'protect_reports' then array['id', 'report_type', 'status', 'admin_note']
        when 'audition_submissions' then array['id', 'category', 'status', 'reviewer_notes']
        else array['id']
      end;
      select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb) into v_before
      from jsonb_each(v_old) as entry where entry.key = any(v_safe_fields);
    else
      v_before := v_old;
    end if;
    select coalesce(array_agg(entry.key order by entry.key), array[]::text[]) into v_changed_fields
    from jsonb_each(v_before) as entry;
  end if;

  begin
    v_actor_email := nullif(auth.jwt() ->> 'email', '');
  exception when others then
    v_actor_email := null;
  end;
  if v_actor_email is null and v_actor_id is not null then
    select profile.email into v_actor_email from public.profiles as profile where profile.id = v_actor_id;
  end if;
  insert into public.admin_audit_logs (
    actor_id, actor_email, operation, table_name, record_id, record_label,
    changed_fields, before_values, after_values, transaction_id
  ) values (
    v_actor_id, v_actor_email, tg_op, tg_table_name, v_record_id, v_record_label,
    v_changed_fields, v_before, v_after, txid_current()
  );
  if tg_op = 'DELETE' then return old; end if;
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


CREATE OR REPLACE FUNCTION "public"."complete_r2_asset_deletions"("p_bucket" "text", "p_paths" "text"[], "p_actor_id" "uuid", "p_reservation_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare v_count integer;
begin
  delete from public.asset_registry
  where bucket = p_bucket and path = any(p_paths) and reserved_by = p_actor_id
    and reservation_id = p_reservation_id;
  get diagnostics v_count = row_count;
  if v_count <> cardinality(p_paths) then
    raise exception 'asset deletion reservation not found' using errcode = '55P03';
  end if;
end;
$$;


ALTER FUNCTION "public"."complete_r2_asset_deletions"("p_bucket" "text", "p_paths" "text"[], "p_actor_id" "uuid", "p_reservation_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."consume_submission_rate_limit"("p_scope" "text", "p_key_hash" "text", "p_limit" integer, "p_window_seconds" integer) RETURNS TABLE("is_allowed" boolean, "retry_after_seconds" integer, "remaining" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'private', 'public', 'pg_temp'
    AS $$
declare
  v_attempt_count integer;
  v_window_started_at timestamptz;
begin
  if p_scope not in ('contact_inquiry', 'protect_report', 'audition_submission', 'contact_inquiry_attempt', 'protect_report_attempt', 'audition_submission_attempt', 'admin_upload_attempt')
    or length(p_key_hash) <> 64
    or p_limit < 1 or p_limit > 1000
    or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid submission rate-limit arguments' using errcode = '22023';
  end if;

  insert into private.submission_rate_limits as limits (scope, key_hash, attempt_count, window_started_at, updated_at)
  values (p_scope, p_key_hash, 1, now(), now())
  on conflict (scope, key_hash) do update set
    attempt_count = case when limits.window_started_at < now() - make_interval(secs => p_window_seconds) then 1 else limits.attempt_count + 1 end,
    window_started_at = case when limits.window_started_at < now() - make_interval(secs => p_window_seconds) then now() else limits.window_started_at end,
    updated_at = now()
  returning attempt_count, window_started_at into v_attempt_count, v_window_started_at;

  return query select v_attempt_count <= p_limit,
    case when v_attempt_count <= p_limit then 0 else greatest(1, ceil(extract(epoch from (v_window_started_at + make_interval(secs => p_window_seconds) - now())))::integer) end,
    greatest(0, p_limit - v_attempt_count);
end;
$$;


ALTER FUNCTION "public"."consume_submission_rate_limit"("p_scope" "text", "p_key_hash" "text", "p_limit" integer, "p_window_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_audition_campaign"("p_campaign" "jsonb", "p_fields" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
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


ALTER FUNCTION "public"."create_audition_campaign"("p_campaign" "jsonb", "p_fields" "jsonb") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."delete_audition_campaign"("p_campaign_id" "uuid") RETURNS TABLE("attachment_paths" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare v_paths text[];
begin
  if not public.is_admin() then raise exception 'administrator access required' using errcode = '42501'; end if;
  if p_campaign_id is null then raise exception 'campaign is required' using errcode = '22023'; end if;
  perform 1 from public.audition_campaigns where id = p_campaign_id for update;
  if not found then raise exception 'campaign not found' using errcode = 'P0002'; end if;
  select coalesce(array_agg(distinct path), array[]::text[]) into v_paths
  from (
    select submission.attachment_path as path
    from public.audition_submissions submission
    where submission.campaign_id = p_campaign_id and submission.attachment_path is not null
    union all
    select answer.value->>'path'
    from public.audition_submissions submission
    cross join lateral jsonb_each(case when jsonb_typeof(submission.answers) = 'object' then submission.answers else '{}'::jsonb end) answer(key, value)
    where submission.campaign_id = p_campaign_id and jsonb_typeof(answer.value) = 'object' and jsonb_typeof(answer.value->'path') = 'string'
  ) paths where path <> '';
  delete from public.audition_submissions where campaign_id = p_campaign_id;
  delete from public.audition_campaigns where id = p_campaign_id;
  return query select v_paths;
end;
$$;


ALTER FUNCTION "public"."delete_audition_campaign"("p_campaign_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_artist_gallery_ownership"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_album_artist_id uuid;
  v_member_artist_id uuid;
begin
  -- The parent row lock conflicts with an in-flight artist_id UPDATE.  Read
  -- the artist ID from the same locking query so the validation is performed
  -- against the version that we actually locked.
  if new.album_id is not null then
    select album.artist_id
      into v_album_artist_id
    from public.albums as album
    where album.id = new.album_id
    for update;
  end if;
  if new.member_id is not null then
    select member.artist_id
      into v_member_artist_id
    from public.artist_members as member
    where member.id = new.member_id
    for update;
  end if;

  if new.album_id is not null and v_album_artist_id is distinct from new.artist_id then
    raise exception 'gallery album belongs to another artist' using errcode = '23514';
  end if;
  if new.member_id is not null and v_member_artist_id is distinct from new.artist_id then
    raise exception 'gallery member belongs to another artist' using errcode = '23514';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_artist_gallery_ownership"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_artist_scene_member_ownership"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_scene_artist_id uuid;
  v_member_artist_id uuid;
begin
  -- Lock in a fixed order (scene, then member) so concurrent relationship
  -- writes cannot deadlock while they validate the two parent rows.
  select scene.artist_id
    into v_scene_artist_id
  from public.artist_scenes as scene
  where scene.id = new.scene_id
  for update;
  select member.artist_id
    into v_member_artist_id
  from public.artist_members as member
  where member.id = new.member_id
  for update;

  if v_scene_artist_id is distinct from v_member_artist_id then
    raise exception 'scene member belongs to another artist' using errcode = '23514';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_artist_scene_member_ownership"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_r2_asset_deletions"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  delete from public.asset_registry where expires_at <= now();
  return new;
end;
$$;


ALTER FUNCTION "public"."expire_r2_asset_deletions"() OWNER TO "postgres";


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

SET default_tablespace = '';

SET default_table_access_method = "heap";


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


CREATE OR REPLACE FUNCTION "public"."get_admin_protect_reports"("p_status" "text" DEFAULT NULL::"text", "p_search" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."protect_reports"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_search text := nullif(btrim(p_search), '');
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  if p_status is not null and p_status not in ('pending', 'reviewing', 'resolved', 'rejected') then
    raise exception 'invalid report status' using errcode = '22023';
  end if;

  return query
  select report.*
  from public.protect_reports as report
  where (p_status is null or report.status = p_status)
    and (
      v_search is null
      or position(lower(v_search) in lower(coalesce(report.title, ''))) > 0
      or position(lower(v_search) in lower(coalesce(report.reporter_email, ''))) > 0
      or position(lower(v_search) in lower(coalesce(report.author_name, ''))) > 0
      or position(lower(v_search) in lower(coalesce(report.platform, ''))) > 0
      or position(lower(v_search) in lower(coalesce(report.content, ''))) > 0
    )
  order by report.created_at desc;
end;
$$;


ALTER FUNCTION "public"."get_admin_protect_reports"("p_status" "text", "p_search" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_home_hero_slide_revision"() RETURNS timestamp with time zone
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select updated_at into v_updated_at from public.home_hero_slide_revisions where id;
  return v_updated_at;
end;
$$;


ALTER FUNCTION "public"."get_home_hero_slide_revision"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_referenced_account_avatars"("p_user_ids" "uuid"[]) RETURNS TABLE("id" "uuid", "avatar_asset_id" "uuid")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  return query
  select profile.id, profile.avatar_asset_id
  from public.profiles as profile
  where profile.id = any(coalesce(p_user_ids, '{}'::uuid[]))
    and profile.avatar_asset_id is not null
    and (
      exists (select 1 from public.audition_submissions where user_id = profile.id)
      or exists (select 1 from public.protect_reports where user_id = profile.id)
    );
end;
$$;


ALTER FUNCTION "public"."get_referenced_account_avatars"("p_user_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_submission_rate_limit_remaining"("p_scope" "text", "p_key_hash" "text", "p_limit" integer, "p_window_seconds" integer) RETURNS TABLE("remaining" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'private', 'public', 'pg_temp'
    AS $$
  select case
    when limits.window_started_at is null
      or limits.window_started_at < now() - make_interval(secs => p_window_seconds) then p_limit
    else greatest(0, p_limit - limits.attempt_count)
  end
  from (select 1) seed
  left join private.submission_rate_limits limits
    on limits.scope = p_scope and limits.key_hash = p_key_hash
  where p_scope in ('contact_inquiry', 'protect_report', 'audition_submission')
    and length(p_key_hash) = 64
    and p_limit between 1 and 1000
    and p_window_seconds between 1 and 86400;
$$;


ALTER FUNCTION "public"."get_submission_rate_limit_remaining"("p_scope" "text", "p_key_hash" "text", "p_limit" integer, "p_window_seconds" integer) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."prevent_album_artist_mismatch"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  if new.artist_id is distinct from old.artist_id and exists (
    select 1 from public.artist_gallery
    where album_id = new.id and artist_id is distinct from new.artist_id
  ) then
    raise exception 'album artist cannot change while gallery references disagree' using errcode = '23514';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."prevent_album_artist_mismatch"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_member_artist_mismatch"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  if new.artist_id is distinct from old.artist_id and (
    exists (
      select 1 from public.artist_gallery
      where member_id = new.id and artist_id is distinct from new.artist_id
    ) or exists (
      select 1
      from public.artist_scene_members as region
      join public.artist_scenes as scene on scene.id = region.scene_id
      where region.member_id = new.id and scene.artist_id is distinct from new.artist_id
    )
  ) then
    raise exception 'member artist cannot change while references disagree' using errcode = '23514';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."prevent_member_artist_mismatch"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_scene_artist_mismatch"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  if new.artist_id is distinct from old.artist_id and exists (
    select 1
    from public.artist_scene_members as region
    join public.artist_members as member on member.id = region.member_id
    where region.scene_id = new.id and member.artist_id is distinct from new.artist_id
  ) then
    raise exception 'scene artist cannot change while member references disagree' using errcode = '23514';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."prevent_scene_artist_mismatch"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."r2_asset_is_referenced"("p_bucket" "text", "p_path" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  if p_bucket = 'artist-assets' then
    return exists (select 1 from public.artists where public.r2_asset_url_matches(p_bucket, p_path, logo_url) or public.r2_asset_url_matches(p_bucket, p_path, image_url))
      or exists (select 1 from public.albums where public.r2_asset_url_matches(p_bucket, p_path, cover_url) or public.r2_asset_url_matches(p_bucket, p_path, hero_image_url) or public.r2_asset_url_matches(p_bucket, p_path, typo_logo_url))
      or exists (select 1 from public.artist_gallery where public.r2_asset_url_matches(p_bucket, p_path, image_url))
      or exists (select 1 from public.artist_members where public.r2_asset_url_matches(p_bucket, p_path, image_url))
      or exists (select 1 from public.artist_scenes where public.r2_asset_url_matches(p_bucket, p_path, image_url))
      or exists (select 1 from public.artist_scene_members where public.r2_asset_url_matches(p_bucket, p_path, mask_url))
      or exists (select 1 from public.tracks where public.r2_asset_url_matches(p_bucket, p_path, audio_url) or public.r2_asset_url_matches(p_bucket, p_path, music_video_url) or public.r2_asset_url_matches(p_bucket, p_path, logo_url))
      or exists (select 1 from public.home_hero_slides where public.r2_asset_url_matches(p_bucket, p_path, video_url))
      or exists (select 1 from public.avatar_assets where image_path = p_path);
  elsif p_bucket = 'album-covers' then
    return exists (select 1 from public.albums where public.r2_asset_url_matches(p_bucket, p_path, cover_url) or public.r2_asset_url_matches(p_bucket, p_path, hero_image_url) or public.r2_asset_url_matches(p_bucket, p_path, typo_logo_url))
      or exists (select 1 from public.tracks where public.r2_asset_url_matches(p_bucket, p_path, logo_url));
  elsif p_bucket = 'track-assets' then
    return exists (select 1 from public.tracks where public.r2_asset_url_matches(p_bucket, p_path, audio_url) or public.r2_asset_url_matches(p_bucket, p_path, music_video_url) or public.r2_asset_url_matches(p_bucket, p_path, logo_url));
  elsif p_bucket = 'hero-videos' then
    return exists (select 1 from public.home_hero_slides where public.r2_asset_url_matches(p_bucket, p_path, video_url));
  elsif p_bucket = 'business-assets' then
    return exists (select 1 from public.site_settings where public.r2_asset_url_matches(p_bucket, p_path, value->>'pressKitUrl') or public.r2_asset_url_matches(p_bucket, p_path, value->>'profilePdfUrl'));
  elsif p_bucket = 'audition-attachments' then
    return public.audition_submission_has_attachment(p_path);
  end if;
  return false;
end;
$$;


ALTER FUNCTION "public"."r2_asset_is_referenced"("p_bucket" "text", "p_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."r2_asset_url_matches"("p_bucket" "text", "p_path" "text", "p_url" "text") RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select p_url is not null
    and right(
      split_part(split_part(p_url, '?', 1), '#', 1),
      length('/' || p_bucket || '/' || p_path)
    ) = '/' || p_bucket || '/' || p_path;
$$;


ALTER FUNCTION "public"."r2_asset_url_matches"("p_bucket" "text", "p_path" "text", "p_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_reserved_legacy_audition_attachment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare v_path text;
begin
  v_path := new.attachment_path;
  if v_path is not null and v_path <> '' then
    perform pg_advisory_xact_lock(hashtextextended('audition-attachments' || chr(0) || v_path, 0));
    if exists (
      select 1 from public.asset_registry
      where bucket = 'audition-attachments' and path = v_path
    ) then
      raise exception 'asset is reserved for deletion' using errcode = '55P03';
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."reject_reserved_legacy_audition_attachment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_reserved_r2_asset_reference"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $_$
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
$_$;


ALTER FUNCTION "public"."reject_reserved_r2_asset_reference"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_r2_asset_deletions"("p_bucket" "text", "p_paths" "text"[], "p_actor_id" "uuid", "p_reservation_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare v_count integer;
begin
  delete from public.asset_registry
  where bucket = p_bucket and path = any(p_paths) and reserved_by = p_actor_id
    and reservation_id = p_reservation_id;
  get diagnostics v_count = row_count;
  if v_count <> cardinality(p_paths) then
    raise exception 'asset deletion reservation not found' using errcode = '55P03';
  end if;
end;
$$;


ALTER FUNCTION "public"."release_r2_asset_deletions"("p_bucket" "text", "p_paths" "text"[], "p_actor_id" "uuid", "p_reservation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reorder_albums"("p_artist_id" "uuid", "p_album_ids" "uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
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


ALTER FUNCTION "public"."reorder_albums"("p_artist_id" "uuid", "p_album_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reorder_artist_members"("p_artist_id" "uuid", "p_member_ids" "uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
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


ALTER FUNCTION "public"."reorder_artist_members"("p_artist_id" "uuid", "p_member_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reserve_r2_asset_deletions"("p_bucket" "text", "p_paths" "text"[], "p_actor_id" "uuid", "p_reservation_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $_$
declare
  v_path text;
begin
  if p_actor_id is null or p_reservation_id is null
    or p_bucket not in ('artist-assets', 'album-covers', 'track-assets', 'business-assets', 'hero-videos', 'audition-attachments')
    or p_paths is null or cardinality(p_paths) < 1 or cardinality(p_paths) > 100 then
    raise exception 'invalid asset deletion request' using errcode = '22023';
  end if;
  delete from public.asset_registry where expires_at <= now();
  for v_path in
    select distinct path from unnest(p_paths) as requested(path) order by path
  loop
    if v_path !~ '^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.[a-zA-Z0-9]+$' then
      raise exception 'invalid asset path' using errcode = '22023';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(p_bucket || chr(0) || v_path, 0));
    if exists (select 1 from public.asset_registry where bucket = p_bucket and path = v_path) then
      raise exception 'asset deletion already reserved' using errcode = '55P03';
    end if;
    if public.r2_asset_is_referenced(p_bucket, v_path) then
      raise exception 'asset is still referenced' using errcode = '23514';
    end if;
  end loop;
  insert into public.asset_registry (bucket, path, status, reserved_by, reservation_id, expires_at)
  select p_bucket, path, 'deleting', p_actor_id, p_reservation_id, now() + interval '30 minutes'
  from unnest(p_paths) as requested(path) group by path;
end;
$_$;


ALTER FUNCTION "public"."reserve_r2_asset_deletions"("p_bucket" "text", "p_paths" "text"[], "p_actor_id" "uuid", "p_reservation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_login_rate_limit"("p_identifier_hash" "text", "p_ip_hash" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'private', 'public', 'pg_temp'
    AS $$
begin
  if length(p_identifier_hash) <> 64 or length(p_ip_hash) <> 64 then
    raise exception 'invalid rate limit key' using errcode = '22023';
  end if;

  delete from private.login_rate_limits
  where key_hash in (p_identifier_hash, p_ip_hash);
end;
$$;


ALTER FUNCTION "public"."reset_login_rate_limit"("p_identifier_hash" "text", "p_ip_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."review_audition_submission"("p_submission_id" "uuid", "p_status" "text", "p_reviewer_notes" "text", "p_expected_updated_at" timestamp with time zone) RETURNS TABLE("id" "uuid", "status" "text", "reviewer_notes" "text", "reviewed_by" "uuid", "reviewed_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_current public.audition_submissions%rowtype;
  v_saved public.audition_submissions%rowtype;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if p_status is null or p_status not in ('pending', 'reviewing', 'accepted', 'rejected') then raise exception 'INVALID_STATUS' using errcode = '22023'; end if;
  if p_reviewer_notes is not null and char_length(p_reviewer_notes) > 10000 then raise exception 'REVIEWER_NOTES_TOO_LONG' using errcode = '22023'; end if;
  if p_expected_updated_at is null then raise exception 'EXPECTED_UPDATED_AT_REQUIRED' using errcode = '22023'; end if;

  select * into v_current from public.audition_submissions as submission
  where submission.id = p_submission_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_current.updated_at is distinct from p_expected_updated_at then raise exception 'STALE_WRITE' using errcode = 'P0003'; end if;

  update public.audition_submissions as submission
  set status = p_status,
      reviewer_notes = nullif(btrim(coalesce(p_reviewer_notes, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = clock_timestamp()
  where submission.id = p_submission_id
  returning submission.* into v_saved;

  return query select v_saved.id, v_saved.status, v_saved.reviewer_notes,
    v_saved.reviewed_by, v_saved.reviewed_at, v_saved.updated_at;
end;
$$;


ALTER FUNCTION "public"."review_audition_submission"("p_submission_id" "uuid", "p_status" "text", "p_reviewer_notes" "text", "p_expected_updated_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."review_protect_report"("p_report_id" "uuid", "p_status" "text", "p_admin_note" "text", "p_expected_updated_at" timestamp with time zone) RETURNS TABLE("id" "uuid", "status" "text", "admin_note" "text", "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_current public.protect_reports%rowtype;
  v_saved public.protect_reports%rowtype;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('pending', 'reviewing', 'resolved', 'rejected') then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;
  if p_admin_note is not null and char_length(p_admin_note) > 10000 then
    raise exception 'ADMIN_NOTE_TOO_LONG' using errcode = '22023';
  end if;
  if p_expected_updated_at is null then
    raise exception 'EXPECTED_UPDATED_AT_REQUIRED' using errcode = '22023';
  end if;

  select * into v_current
  from public.protect_reports as report
  where report.id = p_report_id
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_current.updated_at is distinct from p_expected_updated_at then
    raise exception 'STALE_WRITE' using errcode = 'P0003';
  end if;

  update public.protect_reports as report
  set status = p_status,
      admin_note = nullif(btrim(coalesce(p_admin_note, '')), '')
  where report.id = p_report_id
  returning report.* into v_saved;

  return query select v_saved.id, v_saved.status, v_saved.admin_note, v_saved.updated_at;
end;
$$;


ALTER FUNCTION "public"."review_protect_report"("p_report_id" "uuid", "p_status" "text", "p_admin_note" "text", "p_expected_updated_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_album_with_tracks"("p_album" "jsonb", "p_tracks" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
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


ALTER FUNCTION "public"."save_album_with_tracks"("p_album" "jsonb", "p_tracks" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_artist_gallery"("p_artist_id" "uuid", "p_items" "jsonb", "p_removed_ids" "uuid"[] DEFAULT '{}'::"uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_item jsonb;
  v_id uuid;
  v_album_id uuid;
  v_member_id uuid;
  v_image_url text;
  v_caption text;
  v_sort_order integer;
  v_is_published boolean;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_artist_id is null or p_items is null or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'INVALID_GALLERY_PAYLOAD' using errcode = '22023';
  end if;
  p_removed_ids := coalesce(p_removed_ids, '{}'::uuid[]);

  if exists (
    select 1
    from public.artist_gallery as gallery
    where gallery.id = any (p_removed_ids)
      and gallery.artist_id is distinct from p_artist_id
  ) then
    raise exception 'GALLERY_ROW_DOES_NOT_BELONG_TO_ARTIST' using errcode = '22023';
  end if;

  -- Parse and validate the complete payload before mutating any rows.
  for v_item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_item) is distinct from 'object'
      or nullif(v_item->>'id', '') is null then
      raise exception 'INVALID_GALLERY_ITEM' using errcode = '22023';
    end if;
    v_id := (v_item->>'id')::uuid;
    if v_id = any (p_removed_ids) then
      raise exception 'GALLERY_ITEM_CANNOT_BE_REMOVED_AND_SAVED' using errcode = '22023';
    end if;
    if v_item ? 'artist_id' and (v_item->>'artist_id')::uuid is distinct from p_artist_id then
      raise exception 'GALLERY_ROW_DOES_NOT_BELONG_TO_ARTIST' using errcode = '22023';
    end if;
    if exists (
      select 1
      from public.artist_gallery as gallery
      where gallery.id = v_id
        and gallery.artist_id is distinct from p_artist_id
    ) then
      raise exception 'GALLERY_ROW_DOES_NOT_BELONG_TO_ARTIST' using errcode = '22023';
    end if;
    v_album_id := nullif(v_item->>'album_id', '')::uuid;
    v_member_id := nullif(v_item->>'member_id', '')::uuid;
    v_image_url := nullif(btrim(coalesce(v_item->>'image_url', '')), '');
    if v_image_url is null then
      raise exception 'GALLERY_IMAGE_REQUIRED' using errcode = '22023';
    end if;
    v_caption := coalesce(v_item->>'caption', '');
    v_sort_order := coalesce(nullif(v_item->>'sort_order', '')::integer, 0);
    v_is_published := coalesce(nullif(v_item->>'is_published', '')::boolean, true);
  end loop;

  delete from public.artist_gallery as gallery
  where gallery.artist_id = p_artist_id
    and gallery.id = any (p_removed_ids);

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_id := (v_item->>'id')::uuid;
    v_album_id := nullif(v_item->>'album_id', '')::uuid;
    v_member_id := nullif(v_item->>'member_id', '')::uuid;
    v_image_url := btrim(v_item->>'image_url');
    v_caption := coalesce(v_item->>'caption', '');
    v_sort_order := coalesce(nullif(v_item->>'sort_order', '')::integer, 0);
    v_is_published := coalesce(nullif(v_item->>'is_published', '')::boolean, true);

    insert into public.artist_gallery (
      id, artist_id, album_id, member_id, image_url, caption, sort_order, is_published
    ) values (
      v_id, p_artist_id, v_album_id, v_member_id, v_image_url, v_caption, v_sort_order, v_is_published
    )
    on conflict (id) do update set
      artist_id = excluded.artist_id,
      album_id = excluded.album_id,
      member_id = excluded.member_id,
      image_url = excluded.image_url,
      caption = excluded.caption,
      sort_order = excluded.sort_order,
      is_published = excluded.is_published;
  end loop;
end;
$$;


ALTER FUNCTION "public"."save_artist_gallery"("p_artist_id" "uuid", "p_items" "jsonb", "p_removed_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_artist_gallery_checked"("p_artist_id" "uuid", "p_items" "jsonb", "p_removed_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) RETURNS timestamp with time zone
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select updated_at into v_updated_at from public.artists where id = p_artist_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if p_expected_updated_at is null or v_updated_at is distinct from p_expected_updated_at then
    raise exception 'STALE_WRITE' using errcode = 'P0003';
  end if;
  perform public.save_artist_gallery(p_artist_id, p_items, coalesce(p_removed_ids, '{}'::uuid[]));
  update public.artists set updated_at = clock_timestamp() where id = p_artist_id returning updated_at into v_updated_at;
  return v_updated_at;
end;
$$;


ALTER FUNCTION "public"."save_artist_gallery_checked"("p_artist_id" "uuid", "p_items" "jsonb", "p_removed_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_artist_scenes"("p_artist_id" "uuid", "p_scenes" "jsonb", "p_removed_scene_ids" "uuid"[] DEFAULT '{}'::"uuid"[], "p_removed_region_ids" "uuid"[] DEFAULT '{}'::"uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_scene jsonb;
  v_region jsonb;
  v_scene_id uuid;
  v_region_id uuid;
  v_member_id uuid;
  v_existing_scene_id uuid;
  v_image_url text;
  v_title text;
  v_title_ko text;
  v_title_en text;
  v_title_ja text;
  v_link_url text;
  v_image_width integer;
  v_image_height integer;
  v_is_hero boolean;
  v_is_published boolean;
  v_sort_order integer;
  v_outline jsonb;
  v_mask_url text;
  v_region_sort_order integer;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_artist_id is null or p_scenes is null or jsonb_typeof(p_scenes) is distinct from 'array' then
    raise exception 'INVALID_SCENE_PAYLOAD' using errcode = '22023';
  end if;
  p_removed_scene_ids := coalesce(p_removed_scene_ids, '{}'::uuid[]);
  p_removed_region_ids := coalesce(p_removed_region_ids, '{}'::uuid[]);

  if exists (
    select 1
    from public.artist_scenes as scene
    where scene.id = any (p_removed_scene_ids)
      and scene.artist_id is distinct from p_artist_id
  ) then
    raise exception 'SCENE_DOES_NOT_BELONG_TO_ARTIST' using errcode = '22023';
  end if;
  if exists (
    select 1
    from public.artist_scene_members as region
    join public.artist_scenes as scene on scene.id = region.scene_id
    where region.id = any (p_removed_region_ids)
      and scene.artist_id is distinct from p_artist_id
  ) then
    raise exception 'SCENE_REGION_DOES_NOT_BELONG_TO_ARTIST' using errcode = '22023';
  end if;

  -- Validate scenes, member regions, and existing IDs before the first write.
  for v_scene in select value from jsonb_array_elements(p_scenes) loop
    if jsonb_typeof(v_scene) is distinct from 'object'
      or nullif(v_scene->>'id', '') is null then
      raise exception 'INVALID_SCENE_ITEM' using errcode = '22023';
    end if;
    v_scene_id := (v_scene->>'id')::uuid;
    if v_scene_id = any (p_removed_scene_ids) then
      raise exception 'SCENE_CANNOT_BE_REMOVED_AND_SAVED' using errcode = '22023';
    end if;
    if v_scene ? 'artist_id' and (v_scene->>'artist_id')::uuid is distinct from p_artist_id then
      raise exception 'SCENE_DOES_NOT_BELONG_TO_ARTIST' using errcode = '22023';
    end if;
    if exists (
      select 1
      from public.artist_scenes as scene
      where scene.id = v_scene_id
        and scene.artist_id is distinct from p_artist_id
    ) then
      raise exception 'SCENE_DOES_NOT_BELONG_TO_ARTIST' using errcode = '22023';
    end if;
    v_image_url := nullif(btrim(coalesce(v_scene->>'image_url', '')), '');
    if v_image_url is null then
      raise exception 'SCENE_IMAGE_REQUIRED' using errcode = '22023';
    end if;
    if v_scene ? 'artist_scene_members'
      and jsonb_typeof(v_scene->'artist_scene_members') is distinct from 'array' then
      raise exception 'INVALID_SCENE_REGIONS' using errcode = '22023';
    end if;

    for v_region in
      select value from jsonb_array_elements(coalesce(v_scene->'artist_scene_members', '[]'::jsonb))
    loop
      if jsonb_typeof(v_region) is distinct from 'object'
        or nullif(v_region->>'id', '') is null
        or nullif(v_region->>'member_id', '') is null then
        raise exception 'INVALID_SCENE_REGION' using errcode = '22023';
      end if;
      v_region_id := (v_region->>'id')::uuid;
      v_member_id := (v_region->>'member_id')::uuid;
      if v_region ? 'scene_id' and (v_region->>'scene_id')::uuid is distinct from v_scene_id then
        raise exception 'SCENE_REGION_DOES_NOT_BELONG_TO_SCENE' using errcode = '22023';
      end if;
      select region.scene_id
        into v_existing_scene_id
      from public.artist_scene_members as region
      where region.id = v_region_id;
      if v_existing_scene_id is not null and v_existing_scene_id is distinct from v_scene_id then
        raise exception 'SCENE_REGION_DOES_NOT_BELONG_TO_SCENE' using errcode = '22023';
      end if;
      v_outline := coalesce(v_region->'outline', '[]'::jsonb);
      if jsonb_typeof(v_outline) is distinct from 'array'
        or jsonb_array_length(v_outline) < 3 then
        raise exception 'INVALID_SCENE_OUTLINE' using errcode = '22023';
      end if;
    end loop;
  end loop;

  delete from public.artist_scenes as scene
  where scene.artist_id = p_artist_id
    and scene.id = any (p_removed_scene_ids);
  delete from public.artist_scene_members as region
  where region.id = any (p_removed_region_ids);

  for v_scene in select value from jsonb_array_elements(p_scenes) loop
    v_scene_id := (v_scene->>'id')::uuid;
    v_title := coalesce(v_scene->>'title', '');
    v_title_ko := nullif(v_scene->>'title_ko', '');
    v_title_en := nullif(v_scene->>'title_en', '');
    v_title_ja := nullif(v_scene->>'title_ja', '');
    v_link_url := nullif(v_scene->>'link_url', '');
    v_image_url := btrim(v_scene->>'image_url');
    v_image_width := nullif(v_scene->>'image_width', '')::integer;
    v_image_height := nullif(v_scene->>'image_height', '')::integer;
    v_is_hero := coalesce(nullif(v_scene->>'is_hero', '')::boolean, false);
    v_is_published := coalesce(nullif(v_scene->>'is_published', '')::boolean, true);
    v_sort_order := coalesce(nullif(v_scene->>'sort_order', '')::integer, 0);

    insert into public.artist_scenes (
      id, artist_id, title, title_ko, title_en, title_ja, link_url, image_url,
      image_width, image_height, is_hero, is_published, sort_order
    ) values (
      v_scene_id, p_artist_id, v_title, v_title_ko, v_title_en, v_title_ja, v_link_url, v_image_url,
      v_image_width, v_image_height, v_is_hero, v_is_published, v_sort_order
    )
    on conflict (id) do update set
      artist_id = excluded.artist_id,
      title = excluded.title,
      title_ko = excluded.title_ko,
      title_en = excluded.title_en,
      title_ja = excluded.title_ja,
      link_url = excluded.link_url,
      image_url = excluded.image_url,
      image_width = excluded.image_width,
      image_height = excluded.image_height,
      is_hero = excluded.is_hero,
      is_published = excluded.is_published,
      sort_order = excluded.sort_order;

    for v_region in
      select value from jsonb_array_elements(coalesce(v_scene->'artist_scene_members', '[]'::jsonb))
    loop
      v_region_id := (v_region->>'id')::uuid;
      v_member_id := (v_region->>'member_id')::uuid;
      v_outline := coalesce(v_region->'outline', '[]'::jsonb);
      v_mask_url := nullif(v_region->>'mask_url', '');
      v_region_sort_order := coalesce(nullif(v_region->>'sort_order', '')::integer, 0);

      insert into public.artist_scene_members (
        id, scene_id, member_id, outline, mask_url, sort_order
      ) values (
        v_region_id, v_scene_id, v_member_id, v_outline, v_mask_url, v_region_sort_order
      )
      on conflict (id) do update set
        scene_id = excluded.scene_id,
        member_id = excluded.member_id,
        outline = excluded.outline,
        mask_url = excluded.mask_url,
        sort_order = excluded.sort_order;
    end loop;
  end loop;
end;
$$;


ALTER FUNCTION "public"."save_artist_scenes"("p_artist_id" "uuid", "p_scenes" "jsonb", "p_removed_scene_ids" "uuid"[], "p_removed_region_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_artist_scenes_checked"("p_artist_id" "uuid", "p_scenes" "jsonb", "p_removed_scene_ids" "uuid"[], "p_removed_region_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) RETURNS timestamp with time zone
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select updated_at into v_updated_at from public.artists where id = p_artist_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if p_expected_updated_at is null or v_updated_at is distinct from p_expected_updated_at then
    raise exception 'STALE_WRITE' using errcode = 'P0003';
  end if;
  perform public.save_artist_scenes(p_artist_id, p_scenes, coalesce(p_removed_scene_ids, '{}'::uuid[]), coalesce(p_removed_region_ids, '{}'::uuid[]));
  update public.artists set updated_at = clock_timestamp() where id = p_artist_id returning updated_at into v_updated_at;
  return v_updated_at;
end;
$$;


ALTER FUNCTION "public"."save_artist_scenes_checked"("p_artist_id" "uuid", "p_scenes" "jsonb", "p_removed_scene_ids" "uuid"[], "p_removed_region_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_audition_campaign"("p_campaign" "jsonb", "p_fields" "jsonb", "p_removed_ids" "uuid"[] DEFAULT '{}'::"uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_campaign_id uuid;
  v_field jsonb;
  v_field_id uuid;
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;
  if p_campaign is null or jsonb_typeof(p_campaign) <> 'object'
    or p_fields is null or jsonb_typeof(p_fields) <> 'array' then
    raise exception 'campaign and fields must be valid JSON object/array' using errcode = '22023';
  end if;

  v_campaign_id := nullif(p_campaign->>'id', '')::uuid;
  if v_campaign_id is null then
    raise exception 'campaign id is required' using errcode = '22023';
  end if;
  perform 1 from public.audition_campaigns where id = v_campaign_id for update;
  if not found then
    raise exception 'campaign not found' using errcode = 'P0002';
  end if;
  if exists (
    select 1 from public.audition_form_fields
    where id = any(p_removed_ids) and campaign_id <> v_campaign_id
  ) then
    raise exception 'removed field does not belong to campaign' using errcode = '22023';
  end if;
  if (select count(*) from jsonb_array_elements(p_fields)) <>
     (select count(distinct value->>'id') from jsonb_array_elements(p_fields)) then
    raise exception 'field ids must be unique' using errcode = '22023';
  end if;
  if (select count(*) from jsonb_array_elements(p_fields) value where coalesce((value->>'is_primary_label')::boolean, false)) <> 1
    or not exists (
      select 1 from jsonb_array_elements(p_fields) value
      where value->>'field_key' in ('email', 'applicant_email') and value->>'field_type' = 'short_text'
    )
    or exists (
      select 1 from jsonb_array_elements(p_fields) value
      where value->>'field_type' in ('select', 'radio', 'checkbox')
        and jsonb_array_length(coalesce(value->'options', '[]'::jsonb)) = 0
    ) then
    raise exception 'campaign fields are invalid' using errcode = '22023';
  end if;

  for v_field in select value from jsonb_array_elements(p_fields) loop
    if jsonb_typeof(v_field) <> 'object' then
      raise exception 'field must be a JSON object' using errcode = '22023';
    end if;
    v_field_id := nullif(v_field->>'id', '')::uuid;
    if v_field_id is null then
      raise exception 'field id is required' using errcode = '22023';
    end if;
    if coalesce(v_field->>'campaign_id', v_campaign_id::text) <> v_campaign_id::text
      or v_field_id = any(p_removed_ids)
      or exists (
        select 1 from public.audition_form_fields
        where id = v_field_id and campaign_id <> v_campaign_id
      ) then
      raise exception 'field does not belong to campaign' using errcode = '22023';
    end if;
  end loop;

  update public.audition_campaigns
  set title = trim(p_campaign->>'title'),
      description = coalesce(p_campaign->>'description', ''),
      description_i18n = coalesce(p_campaign->'description_i18n', '{}'::jsonb),
      is_active = coalesce((p_campaign->>'is_active')::boolean, false),
      starts_at = nullif(p_campaign->>'starts_at', '')::timestamptz,
      ends_at = nullif(p_campaign->>'ends_at', '')::timestamptz
  where id = v_campaign_id;

  update public.audition_form_fields
  set is_primary_label = false
  where campaign_id = v_campaign_id and is_primary_label;
  update public.audition_form_fields
  set is_active = false
  where campaign_id = v_campaign_id and id = any(p_removed_ids);

  for v_field in select value from jsonb_array_elements(p_fields) loop
    insert into public.audition_form_fields (
      id, campaign_id, field_key, label_i18n, help_text, field_type, options,
      required, max_length, max_file_size_mb, accepted_file_types, sort_order,
      is_active, is_primary_label
    ) values (
      (v_field->>'id')::uuid, v_campaign_id, v_field->>'field_key',
      coalesce(v_field->'label_i18n', '{}'::jsonb), v_field->>'help_text',
      v_field->>'field_type', coalesce(v_field->'options', '[]'::jsonb),
      coalesce((v_field->>'required')::boolean, false),
      nullif(v_field->>'max_length', '')::integer,
      nullif(v_field->>'max_file_size_mb', '')::integer,
      coalesce(array(select jsonb_array_elements_text(coalesce(v_field->'accepted_file_types', '[]'::jsonb))), '{}'::text[]),
      coalesce((v_field->>'sort_order')::integer, 0),
      true, coalesce((v_field->>'is_primary_label')::boolean, false)
    ) on conflict (id) do update set
      field_key = excluded.field_key, label_i18n = excluded.label_i18n,
      help_text = excluded.help_text, field_type = excluded.field_type,
      options = excluded.options, required = excluded.required,
      max_length = excluded.max_length, max_file_size_mb = excluded.max_file_size_mb,
      accepted_file_types = excluded.accepted_file_types, sort_order = excluded.sort_order,
      is_active = true, is_primary_label = excluded.is_primary_label;
  end loop;
end;
$$;


ALTER FUNCTION "public"."save_audition_campaign"("p_campaign" "jsonb", "p_fields" "jsonb", "p_removed_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_audition_campaign_checked"("p_campaign" "jsonb", "p_fields" "jsonb", "p_removed_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) RETURNS timestamp with time zone
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare v_id uuid; v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  v_id := nullif(p_campaign->>'id', '')::uuid;
  select updated_at into v_updated_at from public.audition_campaigns where id = v_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if p_expected_updated_at is null or v_updated_at is distinct from p_expected_updated_at then
    raise exception 'STALE_WRITE' using errcode = 'P0003';
  end if;
  perform public.save_audition_campaign(p_campaign, p_fields, coalesce(p_removed_ids, '{}'::uuid[]));
  select updated_at into v_updated_at from public.audition_campaigns where id = v_id;
  return v_updated_at;
end;
$$;


ALTER FUNCTION "public"."save_audition_campaign_checked"("p_campaign" "jsonb", "p_fields" "jsonb", "p_removed_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_audition_submission"("p_submission_id" "uuid", "p_campaign_id" "uuid", "p_user_id" "uuid", "p_name" "text", "p_answers" "jsonb", "p_form_snapshot" "jsonb", "p_applicant_email_hash" "text", "p_expected_updated_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("id" "uuid", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $_$
declare
  v_campaign public.audition_campaigns%rowtype;
  v_existing public.audition_submissions%rowtype;
  v_saved public.audition_submissions%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if p_submission_id is null or p_campaign_id is null or p_user_id is null
    or p_applicant_email_hash is null
    or p_applicant_email_hash !~ '^[0-9a-f]{64}$'
    or p_answers is null or jsonb_typeof(p_answers) <> 'object'
    or p_form_snapshot is null or jsonb_typeof(p_form_snapshot) <> 'array' then
    raise exception 'INVALID_SUBMISSION' using errcode = '22023';
  end if;

  select * into v_campaign
  from public.audition_campaigns as campaign
  where campaign.id = p_campaign_id
  for update;
  if not found or not v_campaign.is_active
    or (v_campaign.starts_at is not null and v_campaign.starts_at > v_now)
    or (v_campaign.ends_at is not null and v_campaign.ends_at < v_now) then
    raise exception 'CAMPAIGN_CLOSED' using errcode = 'P0001';
  end if;

  select * into v_existing
  from public.audition_submissions as submission
  where submission.id = p_submission_id
  for update;
  if found then
    if p_expected_updated_at is null
      or v_existing.updated_at is distinct from p_expected_updated_at
      or v_existing.user_id is distinct from p_user_id
      or v_existing.campaign_id is distinct from p_campaign_id
      or v_existing.status is distinct from 'pending'
      or v_existing.reviewer_notes is not null
      or v_existing.reviewed_by is not null
      or v_existing.reviewed_at is not null then
      raise exception 'SUBMISSION_CONFLICT' using errcode = 'P0001';
    end if;

    update public.audition_submissions as submission
    set name = p_name,
        answers = p_answers,
        form_snapshot = p_form_snapshot,
        applicant_email_hash = p_applicant_email_hash,
        status = 'pending'
    where submission.id = p_submission_id
    returning submission.* into v_saved;
  else
    insert into public.audition_submissions (
      id, campaign_id, user_id, name, answers, form_snapshot,
      applicant_email_hash, status
    ) values (
      p_submission_id, p_campaign_id, p_user_id, p_name, p_answers,
      p_form_snapshot, p_applicant_email_hash, 'pending'
    )
    returning * into v_saved;
  end if;

  return query select v_saved.id, v_saved.created_at, v_saved.updated_at;
end;
$_$;


ALTER FUNCTION "public"."save_audition_submission"("p_submission_id" "uuid", "p_campaign_id" "uuid", "p_user_id" "uuid", "p_name" "text", "p_answers" "jsonb", "p_form_snapshot" "jsonb", "p_applicant_email_hash" "text", "p_expected_updated_at" timestamp with time zone) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."save_home_hero_slides"("p_slides" "jsonb", "p_removed_ids" "uuid"[] DEFAULT '{}'::"uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_slide jsonb;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;
  if p_slides is null or jsonb_typeof(p_slides) <> 'array' then
    raise exception 'slides must be a JSON array' using errcode = '22023';
  end if;
  p_removed_ids := coalesce(p_removed_ids, '{}'::uuid[]);
  if (select count(*) from jsonb_array_elements(p_slides)) <>
     (select count(distinct value->>'id') from jsonb_array_elements(p_slides)) then
    raise exception 'slide ids must be unique' using errcode = '22023';
  end if;

  perform 1 from public.home_hero_slides for update;
  for v_slide in select value from jsonb_array_elements(p_slides) loop
    if jsonb_typeof(v_slide) <> 'object' or nullif(v_slide->>'id', '') is null
      or nullif(v_slide->>'album_id', '') is null then
      raise exception 'slide id and album id are required' using errcode = '22023';
    end if;
    v_id := (v_slide->>'id')::uuid;
    if v_id = any(p_removed_ids) then
      raise exception 'slide cannot be removed and saved' using errcode = '22023';
    end if;
  end loop;

  delete from public.home_hero_slides where id = any(p_removed_ids);
  for v_slide in select value from jsonb_array_elements(p_slides) loop
    insert into public.home_hero_slides (id, album_id, sort_order, is_active, video_url)
    values (
      (v_slide->>'id')::uuid,
      (v_slide->>'album_id')::uuid,
      coalesce(nullif(v_slide->>'sort_order', '')::integer, 0),
      coalesce((v_slide->>'is_active')::boolean, true),
      nullif(v_slide->>'video_url', '')
    ) on conflict (id) do update set
      album_id = excluded.album_id,
      sort_order = excluded.sort_order,
      is_active = excluded.is_active,
      video_url = excluded.video_url;
  end loop;
end;
$$;


ALTER FUNCTION "public"."save_home_hero_slides"("p_slides" "jsonb", "p_removed_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_home_hero_slides_checked"("p_slides" "jsonb", "p_removed_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) RETURNS timestamp with time zone
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare v_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select updated_at into v_updated_at from public.home_hero_slide_revisions where id for update;
  if p_expected_updated_at is null or v_updated_at is distinct from p_expected_updated_at then
    raise exception 'STALE_WRITE' using errcode = 'P0003';
  end if;
  perform public.save_home_hero_slides(p_slides, coalesce(p_removed_ids, '{}'::uuid[]));
  update public.home_hero_slide_revisions set updated_at = clock_timestamp() where id returning updated_at into v_updated_at;
  return v_updated_at;
end;
$$;


ALTER FUNCTION "public"."save_home_hero_slides_checked"("p_slides" "jsonb", "p_removed_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_admin_role"("p_target_id" "uuid", "p_role" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_target_role text;
begin
  if p_role is not null and p_role not in ('super_admin', 'editor') then
    raise exception 'INVALID_ROLE' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('admin-role-transition'));

  select role into v_actor_role from public.profiles where id = v_actor_id;
  if v_actor_role is distinct from 'super_admin' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_actor_id = p_target_id then
    raise exception 'CANNOT_CHANGE_OWN_ROLE' using errcode = 'P0001';
  end if;

  select role into v_target_role from public.profiles where id = p_target_id;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_target_role = 'super_admin' and p_role is distinct from 'super_admin'
    and (select count(*) from public.profiles where role = 'super_admin') <= 1 then
    raise exception 'LAST_SUPER_ADMIN' using errcode = 'P0001';
  end if;

  update public.profiles
  set role = p_role, updated_at = now()
  where id = p_target_id;
end;
$$;


ALTER FUNCTION "public"."set_admin_role"("p_target_id" "uuid", "p_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_contact_attachment_size_from_storage"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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

  if new.attachment_size is null or new.attachment_size < 1 or new.attachment_size > 20971520 then
    raise exception 'contact attachment is missing or has an invalid size'
      using errcode = '23514';
  end if;

  return new;
end;
$$;


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


CREATE OR REPLACE FUNCTION "public"."sync_profile_email_on_auth_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."sync_profile_email_on_auth_update"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_contact_inquiry_workflow"("p_inquiry_id" "uuid", "p_status" "text", "p_admin_note" "text", "p_expected_updated_at" timestamp with time zone) RETURNS TABLE("id" "uuid", "status" "text", "admin_note" "text", "answered_by" "uuid", "answered_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_current public.contact_inquiries%rowtype;
  v_saved public.contact_inquiries%rowtype;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('pending', 'reviewing', 'answered', 'closed') then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;
  if p_admin_note is not null and char_length(p_admin_note) > 10000 then
    raise exception 'ADMIN_NOTE_TOO_LONG' using errcode = '22023';
  end if;
  if p_expected_updated_at is null then
    raise exception 'EXPECTED_UPDATED_AT_REQUIRED' using errcode = '22023';
  end if;

  select * into v_current
  from public.contact_inquiries as inquiry
  where inquiry.id = p_inquiry_id
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_current.updated_at is distinct from p_expected_updated_at then
    raise exception 'STALE_WRITE' using errcode = 'P0003';
  end if;

  update public.contact_inquiries as inquiry
  set status = p_status,
      admin_note = nullif(btrim(coalesce(p_admin_note, '')), ''),
      answered_by = case
        when p_status = 'answered' and (
          v_current.status <> 'answered'
          or v_current.answered_by is null
          or v_current.answered_at is null
        ) then auth.uid()
        when p_status = 'answered' then v_current.answered_by
        else null
      end,
      answered_at = case
        when p_status = 'answered' and (
          v_current.status <> 'answered'
          or v_current.answered_by is null
          or v_current.answered_at is null
        ) then clock_timestamp()
        when p_status = 'answered' then v_current.answered_at
        else null
      end
  where inquiry.id = p_inquiry_id
  returning inquiry.* into v_saved;

  return query select
    v_saved.id,
    v_saved.status,
    v_saved.admin_note,
    v_saved.answered_by,
    v_saved.answered_at,
    v_saved.updated_at;
end;
$$;


ALTER FUNCTION "public"."update_contact_inquiry_workflow"("p_inquiry_id" "uuid", "p_status" "text", "p_admin_note" "text", "p_expected_updated_at" timestamp with time zone) OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."asset_registry" (
    "bucket" "text" NOT NULL,
    "path" "text" NOT NULL,
    "status" "text" DEFAULT 'deleting'::"text" NOT NULL,
    "reserved_by" "uuid",
    "reserved_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reservation_id" "uuid",
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:30:00'::interval) NOT NULL,
    CONSTRAINT "asset_registry_path_check" CHECK (("path" ~ '^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.[a-zA-Z0-9]+$'::"text")),
    CONSTRAINT "asset_registry_status_check" CHECK (("status" = 'deleting'::"text"))
);


ALTER TABLE "public"."asset_registry" OWNER TO "postgres";


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
    CONSTRAINT "audition_form_fields_max_file_size_mb_check" CHECK ((("max_file_size_mb" >= 1) AND ("max_file_size_mb" <= 30))),
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
    CONSTRAINT "contact_inquiries_business_fields_check" CHECK ((("category" <> 'business'::"text") OR (("length"("btrim"(COALESCE("company_name", ''::"text"))) >= 1) AND ("length"("btrim"(COALESCE("company_name", ''::"text"))) <= 120) AND (("length"("btrim"(COALESCE("phone", ''::"text"))) >= 1) AND ("length"("btrim"(COALESCE("phone", ''::"text"))) <= 40))))),
    CONSTRAINT "contact_inquiries_category_check" CHECK (("category" = ANY (ARRAY['general'::"text", 'business'::"text"]))),
    CONSTRAINT "contact_inquiries_privacy_consent_check" CHECK (("privacy_consent" = true)),
    CONSTRAINT "contact_inquiries_required_text_check" CHECK ((("length"("btrim"("contact_name")) >= 1) AND ("length"("btrim"("contact_name")) <= 80) AND (("length"("btrim"("email")) >= 3) AND ("length"("btrim"("email")) <= 254)) AND (("length"("btrim"("message")) >= 1) AND ("length"("btrim"("message")) <= 5000)))),
    CONSTRAINT "contact_inquiries_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewing'::"text", 'answered'::"text", 'closed'::"text"]))),
    CONSTRAINT "contact_inquiries_type_check" CHECK (((("category" = 'general'::"text") AND ("inquiry_type" = ANY (ARRAY['account'::"text", 'notice_event'::"text", 'goods_md'::"text", 'site_error'::"text", 'other'::"text"]))) OR (("category" = 'business'::"text") AND ("inquiry_type" = ANY (ARRAY['brand_collaboration'::"text", 'advertising_sponsorship'::"text", 'md_licensing'::"text", 'performance_event'::"text", 'other_business'::"text"])))))
);


ALTER TABLE "public"."contact_inquiries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."home_hero_slide_revisions" (
    "id" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "home_hero_slide_revisions_id_check" CHECK ("id")
);


ALTER TABLE "public"."home_hero_slide_revisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."home_hero_slides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "video_url" "text",
    CONSTRAINT "home_hero_slides_video_url_http_check" CHECK ((("video_url" IS NULL) OR ("btrim"("video_url") ~* '^https?://[^[:space:]]+$'::"text")))
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



ALTER TABLE "public"."albums"
    ADD CONSTRAINT "albums_youtube_url_http_check" CHECK ((("youtube_url" IS NULL) OR ("youtube_url" ~* '^https?://[^[:space:]]+$'::"text"))) NOT VALID;



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



ALTER TABLE ONLY "public"."asset_registry"
    ADD CONSTRAINT "asset_registry_pkey" PRIMARY KEY ("bucket", "path");



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



ALTER TABLE "public"."contact_inquiries"
    ADD CONSTRAINT "contact_inquiries_attachment_name_length" CHECK ((("attachment_name" IS NULL) OR ("char_length"("attachment_name") <= 255))) NOT VALID;



ALTER TABLE ONLY "public"."contact_inquiries"
    ADD CONSTRAINT "contact_inquiries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."home_hero_slide_revisions"
    ADD CONSTRAINT "home_hero_slide_revisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."home_hero_slides"
    ADD CONSTRAINT "home_hero_slides_album_id_key" UNIQUE ("album_id");



ALTER TABLE ONLY "public"."home_hero_slides"
    ADD CONSTRAINT "home_hero_slides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notices"
    ADD CONSTRAINT "notices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."protect_report_attachments"
    ADD CONSTRAINT "protect_report_attachments_file_name_length" CHECK ((("char_length"("file_name") >= 1) AND ("char_length"("file_name") <= 255))) NOT VALID;



ALTER TABLE ONLY "public"."protect_report_attachments"
    ADD CONSTRAINT "protect_report_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protect_reports"
    ADD CONSTRAINT "protect_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."protect_reports"
    ADD CONSTRAINT "protect_reports_post_url_length" CHECK ((("char_length"("post_url") >= 1) AND ("char_length"("post_url") <= 2048))) NOT VALID;



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



CREATE INDEX "asset_registry_expires_at_idx" ON "public"."asset_registry" USING "btree" ("expires_at");



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



CREATE INDEX "notices_admin_list_idx" ON "public"."notices" USING "btree" ("artist_id", "date" DESC);



CREATE INDEX "notices_artist_index" ON "public"."notices" USING "btree" ("artist_id", "is_published", "published_at" DESC);



CREATE INDEX "notices_global_index" ON "public"."notices" USING "btree" ("is_published", "published_at" DESC) WHERE ("artist_id" IS NULL);



CREATE INDEX "profiles_avatar_asset_idx" ON "public"."profiles" USING "btree" ("avatar_asset_id") WHERE ("avatar_asset_id" IS NOT NULL);



CREATE INDEX "protect_report_attachments_report_id_idx" ON "public"."protect_report_attachments" USING "btree" ("report_id");



CREATE INDEX "protect_reports_created_at_idx" ON "public"."protect_reports" USING "btree" ("created_at" DESC);



CREATE INDEX "protect_reports_status_idx" ON "public"."protect_reports" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "tracks_album_order_idx" ON "public"."tracks" USING "btree" ("album_id", "track_number");



CREATE OR REPLACE TRIGGER "albums_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."albums" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "albums_artist_reference_integrity" BEFORE UPDATE OF "artist_id" ON "public"."albums" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_album_artist_mismatch"();



CREATE OR REPLACE TRIGGER "albums_set_updated_at" BEFORE UPDATE ON "public"."albums" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "artist_gallery_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."artist_gallery" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "artist_gallery_ownership" BEFORE INSERT OR UPDATE OF "artist_id", "album_id", "member_id" ON "public"."artist_gallery" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_artist_gallery_ownership"();



CREATE OR REPLACE TRIGGER "artist_gallery_set_updated_at" BEFORE UPDATE ON "public"."artist_gallery" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "artist_members_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."artist_members" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "artist_members_artist_reference_integrity" BEFORE UPDATE OF "artist_id" ON "public"."artist_members" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_member_artist_mismatch"();



CREATE OR REPLACE TRIGGER "artist_members_set_updated_at" BEFORE UPDATE ON "public"."artist_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "artist_scene_member_ownership" BEFORE INSERT OR UPDATE OF "scene_id", "member_id" ON "public"."artist_scene_members" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_artist_scene_member_ownership"();



CREATE OR REPLACE TRIGGER "artist_scene_members_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."artist_scene_members" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "artist_scene_members_set_updated_at" BEFORE UPDATE ON "public"."artist_scene_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "artist_scenes_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."artist_scenes" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "artist_scenes_artist_reference_integrity" BEFORE UPDATE OF "artist_id" ON "public"."artist_scenes" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_scene_artist_mismatch"();



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



CREATE OR REPLACE TRIGGER "expire_r2_asset_deletions" BEFORE INSERT OR UPDATE ON "public"."albums" FOR EACH ROW EXECUTE FUNCTION "public"."expire_r2_asset_deletions"();



CREATE OR REPLACE TRIGGER "expire_r2_asset_deletions" BEFORE INSERT OR UPDATE ON "public"."artist_gallery" FOR EACH ROW EXECUTE FUNCTION "public"."expire_r2_asset_deletions"();



CREATE OR REPLACE TRIGGER "expire_r2_asset_deletions" BEFORE INSERT OR UPDATE ON "public"."artist_members" FOR EACH ROW EXECUTE FUNCTION "public"."expire_r2_asset_deletions"();



CREATE OR REPLACE TRIGGER "expire_r2_asset_deletions" BEFORE INSERT OR UPDATE ON "public"."artist_scene_members" FOR EACH ROW EXECUTE FUNCTION "public"."expire_r2_asset_deletions"();



CREATE OR REPLACE TRIGGER "expire_r2_asset_deletions" BEFORE INSERT OR UPDATE ON "public"."artist_scenes" FOR EACH ROW EXECUTE FUNCTION "public"."expire_r2_asset_deletions"();



CREATE OR REPLACE TRIGGER "expire_r2_asset_deletions" BEFORE INSERT OR UPDATE ON "public"."artists" FOR EACH ROW EXECUTE FUNCTION "public"."expire_r2_asset_deletions"();



CREATE OR REPLACE TRIGGER "expire_r2_asset_deletions" BEFORE INSERT OR UPDATE ON "public"."audition_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."expire_r2_asset_deletions"();



CREATE OR REPLACE TRIGGER "expire_r2_asset_deletions" BEFORE INSERT OR UPDATE ON "public"."avatar_assets" FOR EACH ROW EXECUTE FUNCTION "public"."expire_r2_asset_deletions"();



CREATE OR REPLACE TRIGGER "expire_r2_asset_deletions" BEFORE INSERT OR UPDATE ON "public"."contact_inquiries" FOR EACH ROW EXECUTE FUNCTION "public"."expire_r2_asset_deletions"();



CREATE OR REPLACE TRIGGER "expire_r2_asset_deletions" BEFORE INSERT OR UPDATE ON "public"."home_hero_slides" FOR EACH ROW EXECUTE FUNCTION "public"."expire_r2_asset_deletions"();



CREATE OR REPLACE TRIGGER "expire_r2_asset_deletions" BEFORE INSERT OR UPDATE ON "public"."protect_report_attachments" FOR EACH ROW EXECUTE FUNCTION "public"."expire_r2_asset_deletions"();



CREATE OR REPLACE TRIGGER "expire_r2_asset_deletions" BEFORE INSERT OR UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."expire_r2_asset_deletions"();



CREATE OR REPLACE TRIGGER "expire_r2_asset_deletions" BEFORE INSERT OR UPDATE ON "public"."tracks" FOR EACH ROW EXECUTE FUNCTION "public"."expire_r2_asset_deletions"();



CREATE OR REPLACE TRIGGER "home_hero_slides_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."home_hero_slides" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "home_hero_slides_set_updated_at" BEFORE UPDATE ON "public"."home_hero_slides" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "notices_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."notices" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "notices_set_updated_at" BEFORE UPDATE ON "public"."notices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_admin_role_audit" AFTER UPDATE OF "role" ON "public"."profiles" FOR EACH ROW WHEN (("old"."role" IS DISTINCT FROM "new"."role")) EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "profiles_normalize_avatar" BEFORE INSERT OR UPDATE OF "avatar_asset_id" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."normalize_profile_avatar"();



CREATE OR REPLACE TRIGGER "protect_reports_admin_audit" AFTER DELETE OR UPDATE ON "public"."protect_reports" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'sensitive');



CREATE OR REPLACE TRIGGER "protect_reports_set_updated_at" BEFORE UPDATE ON "public"."protect_reports" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "reject_reserved_legacy_audition_attachment" BEFORE INSERT OR UPDATE ON "public"."audition_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."reject_reserved_legacy_audition_attachment"();



CREATE OR REPLACE TRIGGER "reject_reserved_r2_asset_reference" BEFORE INSERT OR UPDATE ON "public"."albums" FOR EACH ROW EXECUTE FUNCTION "public"."reject_reserved_r2_asset_reference"();



CREATE OR REPLACE TRIGGER "reject_reserved_r2_asset_reference" BEFORE INSERT OR UPDATE ON "public"."artist_gallery" FOR EACH ROW EXECUTE FUNCTION "public"."reject_reserved_r2_asset_reference"();



CREATE OR REPLACE TRIGGER "reject_reserved_r2_asset_reference" BEFORE INSERT OR UPDATE ON "public"."artist_members" FOR EACH ROW EXECUTE FUNCTION "public"."reject_reserved_r2_asset_reference"();



CREATE OR REPLACE TRIGGER "reject_reserved_r2_asset_reference" BEFORE INSERT OR UPDATE ON "public"."artist_scene_members" FOR EACH ROW EXECUTE FUNCTION "public"."reject_reserved_r2_asset_reference"();



CREATE OR REPLACE TRIGGER "reject_reserved_r2_asset_reference" BEFORE INSERT OR UPDATE ON "public"."artist_scenes" FOR EACH ROW EXECUTE FUNCTION "public"."reject_reserved_r2_asset_reference"();



CREATE OR REPLACE TRIGGER "reject_reserved_r2_asset_reference" BEFORE INSERT OR UPDATE ON "public"."artists" FOR EACH ROW EXECUTE FUNCTION "public"."reject_reserved_r2_asset_reference"();



CREATE OR REPLACE TRIGGER "reject_reserved_r2_asset_reference" BEFORE INSERT OR UPDATE ON "public"."audition_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."reject_reserved_r2_asset_reference"();



CREATE OR REPLACE TRIGGER "reject_reserved_r2_asset_reference" BEFORE INSERT OR UPDATE ON "public"."avatar_assets" FOR EACH ROW EXECUTE FUNCTION "public"."reject_reserved_r2_asset_reference"();



CREATE OR REPLACE TRIGGER "reject_reserved_r2_asset_reference" BEFORE INSERT OR UPDATE ON "public"."contact_inquiries" FOR EACH ROW EXECUTE FUNCTION "public"."reject_reserved_r2_asset_reference"();



CREATE OR REPLACE TRIGGER "reject_reserved_r2_asset_reference" BEFORE INSERT OR UPDATE ON "public"."home_hero_slides" FOR EACH ROW EXECUTE FUNCTION "public"."reject_reserved_r2_asset_reference"();



CREATE OR REPLACE TRIGGER "reject_reserved_r2_asset_reference" BEFORE INSERT OR UPDATE ON "public"."protect_report_attachments" FOR EACH ROW EXECUTE FUNCTION "public"."reject_reserved_r2_asset_reference"();



CREATE OR REPLACE TRIGGER "reject_reserved_r2_asset_reference" BEFORE INSERT OR UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."reject_reserved_r2_asset_reference"();



CREATE OR REPLACE TRIGGER "reject_reserved_r2_asset_reference" BEFORE INSERT OR UPDATE ON "public"."tracks" FOR EACH ROW EXECUTE FUNCTION "public"."reject_reserved_r2_asset_reference"();



CREATE OR REPLACE TRIGGER "site_settings_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('key', 'standard');



CREATE OR REPLACE TRIGGER "site_settings_set_updated_at" BEFORE UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tracks_admin_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."tracks" FOR EACH ROW EXECUTE FUNCTION "public"."capture_admin_audit"('id', 'standard');



CREATE OR REPLACE TRIGGER "tracks_set_updated_at" BEFORE UPDATE ON "public"."tracks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



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



CREATE POLICY "admins delete audition submissions" ON "public"."audition_submissions" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admins insert audition campaigns" ON "public"."audition_campaigns" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "admins insert audition fields" ON "public"."audition_form_fields" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "admins manage avatar assets" ON "public"."avatar_assets" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admins read all audition campaigns" ON "public"."audition_campaigns" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admins read all audition fields" ON "public"."audition_form_fields" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



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


ALTER TABLE "public"."asset_registry" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audition_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audition_form_fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audition_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."auditions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated read active avatar assets" ON "public"."avatar_assets" FOR SELECT TO "authenticated" USING (("is_active" OR "public"."is_admin"()));



ALTER TABLE "public"."avatar_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_inquiries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."home_hero_slide_revisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."home_hero_slides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protect_report_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protect_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public read active artist members" ON "public"."artist_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."artists"
  WHERE (("artists"."id" = "artist_members"."artist_id") AND ("artists"."is_active" = true)))));



CREATE POLICY "public read active audition campaigns" ON "public"."audition_campaigns" FOR SELECT TO "authenticated", "anon" USING (("is_active" AND (("starts_at" IS NULL) OR ("starts_at" <= "now"())) AND (("ends_at" IS NULL) OR ("ends_at" >= "now"()))));



CREATE POLICY "public read active audition fields" ON "public"."audition_form_fields" FOR SELECT TO "authenticated", "anon" USING (("is_active" AND (EXISTS ( SELECT 1
   FROM "public"."audition_campaigns" "campaign"
  WHERE (("campaign"."id" = "audition_form_fields"."campaign_id") AND "campaign"."is_active" AND (("campaign"."starts_at" IS NULL) OR ("campaign"."starts_at" <= "now"())) AND (("campaign"."ends_at" IS NULL) OR ("campaign"."ends_at" >= "now"())))))));



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



CREATE POLICY "public read published site settings" ON "public"."site_settings" FOR SELECT TO "authenticated", "anon" USING (("key" = ANY (ARRAY['company'::"text", 'history'::"text", 'footer'::"text", 'social'::"text", 'business_assets'::"text"])));



CREATE POLICY "public read tracks for published albums" ON "public"."tracks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."albums"
     JOIN "public"."artists" ON (("artists"."id" = "albums"."artist_id")))
  WHERE (("albums"."id" = "tracks"."album_id") AND ("albums"."is_published" = true) AND ("albums"."published_at" <= "now"()) AND ("artists"."is_active" = true)))));



ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "super admins manage all profiles" ON "public"."profiles" TO "authenticated" USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



ALTER TABLE "public"."tracks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((("id" = "auth"."uid"()) AND ("role" IS NULL) AND ("email" = COALESCE(("auth"."jwt"() ->> 'email'::"text"), ''::"text"))));



CREATE POLICY "users read own audition submissions" ON "public"."audition_submissions" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "users read own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "users read own protect report attachments" ON "public"."protect_report_attachments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."protect_reports" "r"
  WHERE (("r"."id" = "protect_report_attachments"."report_id") AND (("r"."user_id" = "auth"."uid"()) OR "public"."is_admin"())))));



CREATE POLICY "users read own protect reports" ON "public"."protect_reports" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR "public"."is_admin"()));



CREATE POLICY "users update own non-privileged fields" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK ((("auth"."uid"() = "id") AND ("email" = COALESCE(("auth"."jwt"() ->> 'email'::"text"), ''::"text"))));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."audition_submission_has_attachment"("p_path" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audition_submission_has_attachment"("p_path" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."capture_admin_audit"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."clear_inactive_profile_avatars"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."complete_r2_asset_deletions"("p_bucket" "text", "p_paths" "text"[], "p_actor_id" "uuid", "p_reservation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."complete_r2_asset_deletions"("p_bucket" "text", "p_paths" "text"[], "p_actor_id" "uuid", "p_reservation_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."consume_login_rate_limit"("p_identifier_hash" "text", "p_ip_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."consume_login_rate_limit"("p_identifier_hash" "text", "p_ip_hash" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."consume_submission_rate_limit"("p_scope" "text", "p_key_hash" "text", "p_limit" integer, "p_window_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."consume_submission_rate_limit"("p_scope" "text", "p_key_hash" "text", "p_limit" integer, "p_window_seconds" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_audition_campaign"("p_campaign" "jsonb", "p_fields" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_audition_campaign"("p_campaign" "jsonb", "p_fields" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_audition_campaign"("p_campaign" "jsonb", "p_fields" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_profile_for_new_user"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."delete_audition_campaign"("p_campaign_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_audition_campaign"("p_campaign_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."delete_audition_campaign"("p_campaign_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."enforce_artist_gallery_ownership"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."enforce_artist_scene_member_ownership"() FROM PUBLIC;



GRANT ALL ON FUNCTION "public"."expire_r2_asset_deletions"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_admin_audition_submissions"("p_campaign_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_audition_submissions"("p_campaign_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_admin_audition_submissions"("p_campaign_id" "uuid") TO "authenticated";



GRANT ALL ON TABLE "public"."protect_reports" TO "service_role";



GRANT SELECT("id") ON TABLE "public"."protect_reports" TO "authenticated";



GRANT SELECT("user_id") ON TABLE "public"."protect_reports" TO "authenticated";



GRANT SELECT("artist_id") ON TABLE "public"."protect_reports" TO "authenticated";



GRANT SELECT("report_type") ON TABLE "public"."protect_reports" TO "authenticated";



GRANT SELECT("title") ON TABLE "public"."protect_reports" TO "authenticated";



GRANT SELECT("platform") ON TABLE "public"."protect_reports" TO "authenticated";



GRANT SELECT("status") ON TABLE "public"."protect_reports" TO "authenticated";



GRANT SELECT("created_at") ON TABLE "public"."protect_reports" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_admin_protect_reports"("p_status" "text", "p_search" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_protect_reports"("p_status" "text", "p_search" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_admin_protect_reports"("p_status" "text", "p_search" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_home_hero_slide_revision"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_home_hero_slide_revision"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_home_hero_slide_revision"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_my_audition_submissions"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_my_audition_submissions"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_my_audition_submissions"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_referenced_account_avatars"("p_user_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_referenced_account_avatars"("p_user_ids" "uuid"[]) TO "service_role";
GRANT ALL ON FUNCTION "public"."get_referenced_account_avatars"("p_user_ids" "uuid"[]) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_submission_rate_limit_remaining"("p_scope" "text", "p_key_hash" "text", "p_limit" integer, "p_window_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_submission_rate_limit_remaining"("p_scope" "text", "p_key_hash" "text", "p_limit" integer, "p_window_seconds" integer) TO "service_role";



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



REVOKE ALL ON FUNCTION "public"."prevent_album_artist_mismatch"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."prevent_member_artist_mismatch"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."prevent_scene_artist_mismatch"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."r2_asset_is_referenced"("p_bucket" "text", "p_path" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."r2_asset_is_referenced"("p_bucket" "text", "p_path" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."r2_asset_url_matches"("p_bucket" "text", "p_path" "text", "p_url" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."r2_asset_url_matches"("p_bucket" "text", "p_path" "text", "p_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_reserved_legacy_audition_attachment"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."reject_reserved_r2_asset_reference"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."release_r2_asset_deletions"("p_bucket" "text", "p_paths" "text"[], "p_actor_id" "uuid", "p_reservation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."release_r2_asset_deletions"("p_bucket" "text", "p_paths" "text"[], "p_actor_id" "uuid", "p_reservation_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."reorder_albums"("p_artist_id" "uuid", "p_album_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reorder_albums"("p_artist_id" "uuid", "p_album_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reorder_albums"("p_artist_id" "uuid", "p_album_ids" "uuid"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."reorder_artist_members"("p_artist_id" "uuid", "p_member_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reorder_artist_members"("p_artist_id" "uuid", "p_member_ids" "uuid"[]) TO "service_role";
GRANT ALL ON FUNCTION "public"."reorder_artist_members"("p_artist_id" "uuid", "p_member_ids" "uuid"[]) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."reserve_r2_asset_deletions"("p_bucket" "text", "p_paths" "text"[], "p_actor_id" "uuid", "p_reservation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reserve_r2_asset_deletions"("p_bucket" "text", "p_paths" "text"[], "p_actor_id" "uuid", "p_reservation_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."reset_login_rate_limit"("p_identifier_hash" "text", "p_ip_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reset_login_rate_limit"("p_identifier_hash" "text", "p_ip_hash" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."review_audition_submission"("p_submission_id" "uuid", "p_status" "text", "p_reviewer_notes" "text", "p_expected_updated_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."review_audition_submission"("p_submission_id" "uuid", "p_status" "text", "p_reviewer_notes" "text", "p_expected_updated_at" timestamp with time zone) TO "service_role";
GRANT ALL ON FUNCTION "public"."review_audition_submission"("p_submission_id" "uuid", "p_status" "text", "p_reviewer_notes" "text", "p_expected_updated_at" timestamp with time zone) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."review_protect_report"("p_report_id" "uuid", "p_status" "text", "p_admin_note" "text", "p_expected_updated_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."review_protect_report"("p_report_id" "uuid", "p_status" "text", "p_admin_note" "text", "p_expected_updated_at" timestamp with time zone) TO "service_role";
GRANT ALL ON FUNCTION "public"."review_protect_report"("p_report_id" "uuid", "p_status" "text", "p_admin_note" "text", "p_expected_updated_at" timestamp with time zone) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."save_album_with_tracks"("p_album" "jsonb", "p_tracks" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_album_with_tracks"("p_album" "jsonb", "p_tracks" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_album_with_tracks"("p_album" "jsonb", "p_tracks" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_artist_gallery"("p_artist_id" "uuid", "p_items" "jsonb", "p_removed_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_artist_gallery"("p_artist_id" "uuid", "p_items" "jsonb", "p_removed_ids" "uuid"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_artist_gallery_checked"("p_artist_id" "uuid", "p_items" "jsonb", "p_removed_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_artist_gallery_checked"("p_artist_id" "uuid", "p_items" "jsonb", "p_removed_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) TO "service_role";
GRANT ALL ON FUNCTION "public"."save_artist_gallery_checked"("p_artist_id" "uuid", "p_items" "jsonb", "p_removed_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."save_artist_scenes"("p_artist_id" "uuid", "p_scenes" "jsonb", "p_removed_scene_ids" "uuid"[], "p_removed_region_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_artist_scenes"("p_artist_id" "uuid", "p_scenes" "jsonb", "p_removed_scene_ids" "uuid"[], "p_removed_region_ids" "uuid"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_artist_scenes_checked"("p_artist_id" "uuid", "p_scenes" "jsonb", "p_removed_scene_ids" "uuid"[], "p_removed_region_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_artist_scenes_checked"("p_artist_id" "uuid", "p_scenes" "jsonb", "p_removed_scene_ids" "uuid"[], "p_removed_region_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) TO "service_role";
GRANT ALL ON FUNCTION "public"."save_artist_scenes_checked"("p_artist_id" "uuid", "p_scenes" "jsonb", "p_removed_scene_ids" "uuid"[], "p_removed_region_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."save_audition_campaign"("p_campaign" "jsonb", "p_fields" "jsonb", "p_removed_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_audition_campaign"("p_campaign" "jsonb", "p_fields" "jsonb", "p_removed_ids" "uuid"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_audition_campaign_checked"("p_campaign" "jsonb", "p_fields" "jsonb", "p_removed_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_audition_campaign_checked"("p_campaign" "jsonb", "p_fields" "jsonb", "p_removed_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) TO "service_role";
GRANT ALL ON FUNCTION "public"."save_audition_campaign_checked"("p_campaign" "jsonb", "p_fields" "jsonb", "p_removed_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."save_audition_submission"("p_submission_id" "uuid", "p_campaign_id" "uuid", "p_user_id" "uuid", "p_name" "text", "p_answers" "jsonb", "p_form_snapshot" "jsonb", "p_applicant_email_hash" "text", "p_expected_updated_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_audition_submission"("p_submission_id" "uuid", "p_campaign_id" "uuid", "p_user_id" "uuid", "p_name" "text", "p_answers" "jsonb", "p_form_snapshot" "jsonb", "p_applicant_email_hash" "text", "p_expected_updated_at" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_avatar_assets"("p_artist_id" "uuid", "p_items" "jsonb", "p_delete_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_avatar_assets"("p_artist_id" "uuid", "p_items" "jsonb", "p_delete_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_avatar_assets"("p_artist_id" "uuid", "p_items" "jsonb", "p_delete_ids" "uuid"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_home_hero_slides"("p_slides" "jsonb", "p_removed_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_home_hero_slides"("p_slides" "jsonb", "p_removed_ids" "uuid"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_home_hero_slides_checked"("p_slides" "jsonb", "p_removed_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_home_hero_slides_checked"("p_slides" "jsonb", "p_removed_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) TO "service_role";
GRANT ALL ON FUNCTION "public"."save_home_hero_slides_checked"("p_slides" "jsonb", "p_removed_ids" "uuid"[], "p_expected_updated_at" timestamp with time zone) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."set_admin_role"("p_target_id" "uuid", "p_role" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_admin_role"("p_target_id" "uuid", "p_role" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."set_admin_role"("p_target_id" "uuid", "p_role" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."set_contact_attachment_size_from_storage"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_contact_attachment_size_from_storage"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."sync_profile_email_on_auth_update"() FROM PUBLIC;



GRANT ALL ON FUNCTION "public"."touch_audition_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_contact_inquiry_workflow"("p_inquiry_id" "uuid", "p_status" "text", "p_admin_note" "text", "p_expected_updated_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_contact_inquiry_workflow"("p_inquiry_id" "uuid", "p_status" "text", "p_admin_note" "text", "p_expected_updated_at" timestamp with time zone) TO "service_role";
GRANT ALL ON FUNCTION "public"."update_contact_inquiry_workflow"("p_inquiry_id" "uuid", "p_status" "text", "p_admin_note" "text", "p_expected_updated_at" timestamp with time zone) TO "authenticated";



GRANT SELECT,INSERT ON TABLE "public"."admin_audit_logs" TO "service_role";
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



GRANT ALL ON TABLE "public"."asset_registry" TO "service_role";



GRANT ALL ON TABLE "public"."audition_campaigns" TO "service_role";
GRANT SELECT ON TABLE "public"."audition_campaigns" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."audition_campaigns" TO "authenticated";



GRANT ALL ON TABLE "public"."audition_form_fields" TO "service_role";
GRANT SELECT ON TABLE "public"."audition_form_fields" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."audition_form_fields" TO "authenticated";



GRANT ALL ON TABLE "public"."audition_submissions" TO "service_role";
GRANT DELETE ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT SELECT("id") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT SELECT("status") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT SELECT("created_at") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT SELECT("updated_at") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT SELECT("user_id") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT SELECT("answers") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT SELECT("campaign_id") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT SELECT("form_snapshot") ON TABLE "public"."audition_submissions" TO "authenticated";



GRANT ALL ON TABLE "public"."auditions" TO "service_role";



GRANT ALL ON TABLE "public"."avatar_assets" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."avatar_assets" TO "authenticated";



GRANT ALL ON TABLE "public"."contact_inquiries" TO "service_role";
GRANT SELECT ON TABLE "public"."contact_inquiries" TO "authenticated";



GRANT ALL ON TABLE "public"."home_hero_slide_revisions" TO "service_role";



GRANT ALL ON TABLE "public"."home_hero_slides" TO "service_role";
GRANT SELECT ON TABLE "public"."home_hero_slides" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."home_hero_slides" TO "authenticated";



GRANT ALL ON TABLE "public"."notices" TO "service_role";
GRANT SELECT ON TABLE "public"."notices" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."notices" TO "authenticated";



GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT,INSERT ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("name") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("updated_at") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("avatar_asset_id") ON TABLE "public"."profiles" TO "authenticated";



GRANT ALL ON TABLE "public"."protect_report_attachments" TO "service_role";
GRANT SELECT ON TABLE "public"."protect_report_attachments" TO "authenticated";



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







