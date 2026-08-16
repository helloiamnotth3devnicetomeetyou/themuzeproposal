begin;

-- Daily submission quota is reserved before a request uploads or writes any
-- rows.  Keep attempt counters unchanged; those are still consumed by the
-- existing short-window limiter below.
alter table private.submission_rate_limits
  add column if not exists reserved_count integer not null default 0;

alter table private.submission_rate_limits
  drop constraint if exists submission_rate_limits_attempt_count_check;
alter table private.submission_rate_limits
  add constraint submission_rate_limits_attempt_count_check
  check (attempt_count >= 0);

alter table private.submission_rate_limits
  drop constraint if exists submission_rate_limits_reserved_count_check;
alter table private.submission_rate_limits
  add constraint submission_rate_limits_reserved_count_check
  check (reserved_count >= 0);

create table if not exists private.submission_rate_limit_reservations (
  reservation_id uuid primary key,
  scope text not null check (scope in (
    'contact_inquiry', 'protect_report', 'audition_submission'
  )),
  user_key_hash text not null check (length(user_key_hash) = 64),
  ip_key_hash text check (ip_key_hash is null or length(ip_key_hash) = 64),
  window_seconds integer not null check (window_seconds between 1 and 86400),
  status text not null check (status in ('reserved', 'finalized', 'released')),
  reserved_at timestamptz not null default now(),
  finalized_at timestamptz,
  released_at timestamptz
);

create index if not exists submission_rate_limit_reservations_keys_idx
  on private.submission_rate_limit_reservations (scope, user_key_hash, status);

revoke all on table private.submission_rate_limit_reservations
  from public, anon, authenticated;

create or replace function public.reserve_submission_rate_limit(
  p_scope text,
  p_user_key_hash text,
  p_ip_key_hash text,
  p_user_limit integer,
  p_ip_limit integer,
  p_window_seconds integer
) returns table(
  reservation_id uuid,
  is_allowed boolean,
  retry_after_seconds integer,
  remaining integer
)
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  v_user private.submission_rate_limits%rowtype;
  v_ip private.submission_rate_limits%rowtype;
  v_now timestamptz := now();
  v_user_remaining integer;
  v_ip_remaining integer;
  v_retry_user integer := 0;
  v_retry_ip integer := 0;
  v_reservation_id uuid := gen_random_uuid();
begin
  if p_scope not in ('contact_inquiry', 'protect_report', 'audition_submission')
    or p_user_key_hash is null
    or length(p_user_key_hash) <> 64
    or (p_ip_key_hash is not null and length(p_ip_key_hash) <> 64)
    or p_user_limit < 1 or p_user_limit > 1000
    or p_ip_limit < 1 or p_ip_limit > 1000
    or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid submission quota reservation arguments'
      using errcode = '22023';
  end if;

  -- Advisory locks give a stable lock for a key before the row is created;
  -- the row locks below then serialize with the legacy limiter RPC too.
  if p_ip_key_hash is null or p_user_key_hash <= p_ip_key_hash then
    perform pg_advisory_xact_lock(hashtextextended(p_scope || chr(31) || p_user_key_hash, 0));
    if p_ip_key_hash is not null and p_ip_key_hash <> p_user_key_hash then
      perform pg_advisory_xact_lock(hashtextextended(p_scope || chr(31) || p_ip_key_hash, 0));
    end if;
  else
    perform pg_advisory_xact_lock(hashtextextended(p_scope || chr(31) || p_ip_key_hash, 0));
    perform pg_advisory_xact_lock(hashtextextended(p_scope || chr(31) || p_user_key_hash, 0));
  end if;

  insert into private.submission_rate_limits (
    scope, key_hash, attempt_count, reserved_count, window_started_at, updated_at
  ) values (p_scope, p_user_key_hash, 0, 0, v_now, v_now)
  on conflict (scope, key_hash) do nothing;
  if p_ip_key_hash is not null and p_ip_key_hash <> p_user_key_hash then
    insert into private.submission_rate_limits (
      scope, key_hash, attempt_count, reserved_count, window_started_at, updated_at
    ) values (p_scope, p_ip_key_hash, 0, 0, v_now, v_now)
    on conflict (scope, key_hash) do nothing;
  end if;

  select * into v_user
  from private.submission_rate_limits
  where scope = p_scope and key_hash = p_user_key_hash
  for update;

  if v_user.window_started_at < v_now - make_interval(secs => p_window_seconds) then
    update private.submission_rate_limits
    set attempt_count = 0, reserved_count = 0,
        window_started_at = v_now, updated_at = v_now
    where scope = p_scope and key_hash = p_user_key_hash;
    v_user.attempt_count := 0;
    v_user.reserved_count := 0;
    v_user.window_started_at := v_now;
  end if;

  if p_ip_key_hash is null or p_ip_key_hash = p_user_key_hash then
    v_ip := v_user;
  else
    select * into v_ip
    from private.submission_rate_limits
    where scope = p_scope and key_hash = p_ip_key_hash
    for update;
    if v_ip.window_started_at < v_now - make_interval(secs => p_window_seconds) then
      update private.submission_rate_limits
      set attempt_count = 0, reserved_count = 0,
          window_started_at = v_now, updated_at = v_now
      where scope = p_scope and key_hash = p_ip_key_hash;
      v_ip.attempt_count := 0;
      v_ip.reserved_count := 0;
      v_ip.window_started_at := v_now;
    end if;
  end if;

  v_user_remaining := p_user_limit - v_user.attempt_count - v_user.reserved_count;
  if p_ip_key_hash is null then
    v_ip_remaining := p_ip_limit;
  elsif p_ip_key_hash = p_user_key_hash then
    v_ip_remaining := p_ip_limit - v_ip.attempt_count - v_ip.reserved_count;
  else
    v_ip_remaining := p_ip_limit - v_ip.attempt_count - v_ip.reserved_count;
  end if;

  if v_user_remaining <= 0 then
    v_retry_user := greatest(1, ceil(extract(epoch from (
      v_user.window_started_at + make_interval(secs => p_window_seconds) - v_now
    )))::integer);
  end if;
  if p_ip_key_hash is not null and v_ip_remaining <= 0 then
    v_retry_ip := greatest(1, ceil(extract(epoch from (
      v_ip.window_started_at + make_interval(secs => p_window_seconds) - v_now
    )))::integer);
  end if;

  if v_user_remaining <= 0 or v_ip_remaining <= 0 then
    return query select
      null::uuid,
      false,
      greatest(v_retry_user, v_retry_ip),
      case when p_ip_key_hash is null then greatest(0, v_user_remaining)
        else greatest(0, least(v_user_remaining, v_ip_remaining))
      end;
    return;
  end if;

  update private.submission_rate_limits
  set reserved_count = reserved_count + 1, updated_at = v_now
  where scope = p_scope and key_hash = p_user_key_hash;
  if p_ip_key_hash is not null and p_ip_key_hash <> p_user_key_hash then
    update private.submission_rate_limits
    set reserved_count = reserved_count + 1, updated_at = v_now
    where scope = p_scope and key_hash = p_ip_key_hash;
  end if;

  insert into private.submission_rate_limit_reservations (
    reservation_id, scope, user_key_hash, ip_key_hash, window_seconds, status
  ) values (
    v_reservation_id, p_scope, p_user_key_hash, p_ip_key_hash,
    p_window_seconds, 'reserved'
  );

  return query select
    v_reservation_id,
    true,
    0,
    case when p_ip_key_hash is null then greatest(0, v_user_remaining - 1)
      else greatest(0, least(v_user_remaining - 1, v_ip_remaining - 1))
    end;
end;
$$;

create or replace function public.finalize_submission_rate_limit(
  p_reservation_id uuid
) returns void
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  v_reservation private.submission_rate_limit_reservations%rowtype;
  v_user private.submission_rate_limits%rowtype;
  v_ip private.submission_rate_limits%rowtype;
  v_now timestamptz := now();
begin
  if p_reservation_id is null then
    raise exception 'invalid submission quota finalization arguments'
      using errcode = '22023';
  end if;

  select * into v_reservation
  from private.submission_rate_limit_reservations
  where reservation_id = p_reservation_id
  for update;
  if not found or v_reservation.status <> 'reserved' then
    return;
  end if;

  if v_reservation.ip_key_hash is null
    or v_reservation.user_key_hash <= v_reservation.ip_key_hash then
    perform pg_advisory_xact_lock(hashtextextended(
        v_reservation.scope || chr(31) || v_reservation.user_key_hash, 0
    ));
    if v_reservation.ip_key_hash is not null
      and v_reservation.ip_key_hash <> v_reservation.user_key_hash then
      perform pg_advisory_xact_lock(hashtextextended(
        v_reservation.scope || chr(31) || v_reservation.ip_key_hash, 0
      ));
    end if;
  else
    perform pg_advisory_xact_lock(hashtextextended(
      v_reservation.scope || chr(31) || v_reservation.ip_key_hash, 0
    ));
    perform pg_advisory_xact_lock(hashtextextended(
      v_reservation.scope || chr(31) || v_reservation.user_key_hash, 0
    ));
  end if;

  select * into v_user
  from private.submission_rate_limits
  where scope = v_reservation.scope and key_hash = v_reservation.user_key_hash
  for update;
  if v_user.window_started_at < v_now - make_interval(secs => v_reservation.window_seconds) then
    update private.submission_rate_limits
    set attempt_count = 1, reserved_count = 0,
        window_started_at = v_now, updated_at = v_now
    where scope = v_reservation.scope and key_hash = v_reservation.user_key_hash;
  else
    update private.submission_rate_limits
    set attempt_count = attempt_count + 1,
        reserved_count = greatest(0, reserved_count - 1),
        updated_at = v_now
    where scope = v_reservation.scope and key_hash = v_reservation.user_key_hash;
  end if;

  if v_reservation.ip_key_hash is not null
    and v_reservation.ip_key_hash <> v_reservation.user_key_hash then
    select * into v_ip
    from private.submission_rate_limits
    where scope = v_reservation.scope and key_hash = v_reservation.ip_key_hash
    for update;
    if v_ip.window_started_at < v_now - make_interval(secs => v_reservation.window_seconds) then
      update private.submission_rate_limits
      set attempt_count = 1, reserved_count = 0,
          window_started_at = v_now, updated_at = v_now
      where scope = v_reservation.scope and key_hash = v_reservation.ip_key_hash;
    else
      update private.submission_rate_limits
      set attempt_count = attempt_count + 1,
          reserved_count = greatest(0, reserved_count - 1),
          updated_at = v_now
        where scope = v_reservation.scope and key_hash = v_reservation.ip_key_hash;
    end if;
  end if;

  update private.submission_rate_limit_reservations
  set status = 'finalized', finalized_at = v_now
  where reservation_id = p_reservation_id and status = 'reserved';
end;
$$;

create or replace function public.release_submission_rate_limit(
  p_reservation_id uuid
) returns void
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  v_reservation private.submission_rate_limit_reservations%rowtype;
  v_user private.submission_rate_limits%rowtype;
  v_ip private.submission_rate_limits%rowtype;
  v_now timestamptz := now();
begin
  if p_reservation_id is null then
    raise exception 'invalid submission quota release arguments'
      using errcode = '22023';
  end if;

  select * into v_reservation
  from private.submission_rate_limit_reservations
  where reservation_id = p_reservation_id
  for update;
  if not found or v_reservation.status <> 'reserved' then
    return;
  end if;

  if v_reservation.ip_key_hash is null
    or v_reservation.user_key_hash <= v_reservation.ip_key_hash then
    perform pg_advisory_xact_lock(hashtextextended(
      v_reservation.scope || chr(31) || v_reservation.user_key_hash, 0
    ));
    if v_reservation.ip_key_hash is not null
      and v_reservation.ip_key_hash <> v_reservation.user_key_hash then
      perform pg_advisory_xact_lock(hashtextextended(
        v_reservation.scope || chr(31) || v_reservation.ip_key_hash, 0
      ));
    end if;
  else
    perform pg_advisory_xact_lock(hashtextextended(
      v_reservation.scope || chr(31) || v_reservation.ip_key_hash, 0
    ));
    perform pg_advisory_xact_lock(hashtextextended(
      v_reservation.scope || chr(31) || v_reservation.user_key_hash, 0
    ));
  end if;

  select * into v_user
  from private.submission_rate_limits
  where scope = v_reservation.scope and key_hash = v_reservation.user_key_hash
  for update;
  if v_user.window_started_at < v_now - make_interval(secs => v_reservation.window_seconds) then
    update private.submission_rate_limits
    set attempt_count = 0, reserved_count = 0,
        window_started_at = v_now, updated_at = v_now
    where scope = v_reservation.scope and key_hash = v_reservation.user_key_hash;
  else
    update private.submission_rate_limits
    set reserved_count = greatest(0, reserved_count - 1), updated_at = v_now
      where scope = v_reservation.scope and key_hash = v_reservation.user_key_hash;
  end if;

  if v_reservation.ip_key_hash is not null
    and v_reservation.ip_key_hash <> v_reservation.user_key_hash then
    select * into v_ip
    from private.submission_rate_limits
    where scope = v_reservation.scope and key_hash = v_reservation.ip_key_hash
    for update;
    if v_ip.window_started_at < v_now - make_interval(secs => v_reservation.window_seconds) then
      update private.submission_rate_limits
      set attempt_count = 0, reserved_count = 0,
          window_started_at = v_now, updated_at = v_now
      where scope = v_reservation.scope and key_hash = v_reservation.ip_key_hash;
    else
      update private.submission_rate_limits
      set reserved_count = greatest(0, reserved_count - 1), updated_at = v_now
        where scope = v_reservation.scope and key_hash = v_reservation.ip_key_hash;
    end if;
  end if;

  update private.submission_rate_limit_reservations
  set status = 'released', released_at = v_now
  where reservation_id = p_reservation_id and status = 'reserved';
end;
$$;

-- Active reservations are part of the visible remaining daily quota.
create or replace function public.get_submission_rate_limit_remaining(
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
      or limits.window_started_at < now() - make_interval(secs => p_window_seconds)
      then p_limit
    else greatest(0, p_limit - limits.attempt_count - limits.reserved_count)
  end
  from (select 1) seed
  left join private.submission_rate_limits limits
    on limits.scope = p_scope and limits.key_hash = p_key_hash
  where p_scope in ('contact_inquiry', 'protect_report', 'audition_submission')
    and length(p_key_hash) = 64
    and p_limit between 1 and 1000
    and p_window_seconds between 1 and 86400;
$$;

revoke all on function public.reserve_submission_rate_limit(
  text, text, text, integer, integer, integer
) from public, anon, authenticated;
revoke all on function public.finalize_submission_rate_limit(uuid)
  from public, anon, authenticated;
revoke all on function public.release_submission_rate_limit(uuid)
  from public, anon, authenticated;
revoke all on function public.get_submission_rate_limit_remaining(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.reserve_submission_rate_limit(
  text, text, text, integer, integer, integer
) to service_role;
grant execute on function public.finalize_submission_rate_limit(uuid)
  to service_role;
grant execute on function public.release_submission_rate_limit(uuid)
  to service_role;
grant execute on function public.get_submission_rate_limit_remaining(text, text, integer, integer)
  to service_role;

notify pgrst, 'reload schema';
commit;
