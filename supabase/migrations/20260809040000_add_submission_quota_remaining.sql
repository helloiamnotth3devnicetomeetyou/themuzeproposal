begin;

drop function if exists public.consume_submission_rate_limit(text, text, integer, integer);
create function public.consume_submission_rate_limit(
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
  if p_scope not in ('contact_inquiry', 'protect_report', 'audition_submission')
    or length(p_key_hash) <> 64
    or p_limit < 1 or p_limit > 1000
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
    end,
    greatest(0, p_limit - v_attempt_count);
end;
$$;

create function public.get_submission_rate_limit_remaining(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) returns table(remaining integer)
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
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

revoke all on function public.consume_submission_rate_limit(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.get_submission_rate_limit_remaining(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_submission_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.get_submission_rate_limit_remaining(text, text, integer, integer) to service_role;

commit;
