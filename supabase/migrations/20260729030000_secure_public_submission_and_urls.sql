-- Prevent stored URLs from becoming executable browser URLs. The application
-- validates full URLs; these constraints provide a database-level backstop.
update public.artist_schedules
set link_url = null
where link_url is not null and btrim(link_url) !~* '^https?://[^[:space:]]+$';

update public.tracks
set
  spotify_url = case when spotify_url is not null and btrim(spotify_url) !~* '^https?://[^[:space:]]+$' then null else spotify_url end,
  youtube_url = case when youtube_url is not null and btrim(youtube_url) !~* '^https?://[^[:space:]]+$' then null else youtube_url end,
  audio_url = case when audio_url is not null and btrim(audio_url) !~* '^https?://[^[:space:]]+$' then null else audio_url end,
  music_video_url = case when music_video_url is not null and btrim(music_video_url) !~* '^https?://[^[:space:]]+$' then null else music_video_url end
where (spotify_url is not null and btrim(spotify_url) !~* '^https?://[^[:space:]]+$')
   or (youtube_url is not null and btrim(youtube_url) !~* '^https?://[^[:space:]]+$')
   or (audio_url is not null and btrim(audio_url) !~* '^https?://[^[:space:]]+$')
   or (music_video_url is not null and btrim(music_video_url) !~* '^https?://[^[:space:]]+$');

alter table public.artist_schedules
  drop constraint if exists artist_schedules_link_url_http_check,
  add constraint artist_schedules_link_url_http_check
    check (link_url is null or btrim(link_url) ~* '^https?://[^[:space:]]+$');

alter table public.tracks
  drop constraint if exists tracks_urls_http_check,
  add constraint tracks_urls_http_check
    check (
      (spotify_url is null or btrim(spotify_url) ~* '^https?://[^[:space:]]+$')
      and (youtube_url is null or btrim(youtube_url) ~* '^https?://[^[:space:]]+$')
      and (audio_url is null or btrim(audio_url) ~* '^https?://[^[:space:]]+$')
      and (music_video_url is null or btrim(music_video_url) ~* '^https?://[^[:space:]]+$')
    );

-- Reports now use the server route below so authenticated clients cannot
-- bypass its file validation and rate limit with direct PostgREST inserts.
drop policy if exists "users create own protect reports" on public.protect_reports;
drop policy if exists "users insert own protect report attachments" on public.protect_report_attachments;
revoke insert on public.protect_reports from anon, authenticated;
revoke insert on public.protect_report_attachments from anon, authenticated;

create table if not exists private.submission_rate_limits (
  scope text not null check (scope in ('contact_inquiry', 'protect_report')),
  key_hash text not null check (length(key_hash) = 64),
  attempt_count integer not null check (attempt_count > 0),
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash)
);

create or replace function public.consume_submission_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) returns table(is_allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  v_attempt_count integer;
  v_window_started_at timestamptz;
begin
  if p_scope not in ('contact_inquiry', 'protect_report')
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

revoke all on function public.consume_submission_rate_limit(text, text, integer, integer) from public;
revoke all on function public.consume_submission_rate_limit(text, text, integer, integer) from anon, authenticated;
grant execute on function public.consume_submission_rate_limit(text, text, integer, integer) to service_role;
