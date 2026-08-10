begin;

-- Keep the RPC contract aligned with all callers, including pre-parse upload limits.
alter table private.submission_rate_limits
  drop constraint if exists submission_rate_limits_scope_check;
alter table private.submission_rate_limits
  add constraint submission_rate_limits_scope_check check (scope in (
    'contact_inquiry', 'protect_report', 'audition_submission',
    'contact_inquiry_attempt', 'protect_report_attempt', 'audition_submission_attempt',
    'admin_upload_attempt'
  ));

create or replace function public.consume_submission_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) returns table(is_allowed boolean, retry_after_seconds integer, remaining integer)
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
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

alter table public.albums
  add constraint albums_youtube_url_http_check
  check (youtube_url is null or youtube_url ~* '^https?://[^[:space:]]+$') not valid;

notify pgrst, 'reload schema';
commit;
