-- Production security hardening:
-- 1) persistent login failure rate limits
-- 2) storage MIME/extension enforcement
-- 3) SVG logos are readable only from the server-sanitized storage path

create schema if not exists private;
revoke all on schema private from public;

create table if not exists private.login_rate_limits (
  key_hash text primary key,
  failed_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

revoke all on private.login_rate_limits from public, anon, authenticated;

create or replace function public.check_login_rate_limit(
  p_identifier_hash text,
  p_ip_hash text
)
returns table(is_allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
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

create or replace function public.record_login_attempt(
  p_identifier_hash text,
  p_ip_hash text,
  p_succeeded boolean
)
returns void
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
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

revoke all on function public.check_login_rate_limit(text, text) from public;
revoke all on function public.record_login_attempt(text, text, boolean) from public;
grant execute on function public.check_login_rate_limit(text, text) to anon, authenticated;
grant execute on function public.record_login_attempt(text, text, boolean) to anon, authenticated;

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
where id = 'artist-assets';

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'album-covers';

update storage.buckets
set allowed_mime_types = array['audio/mpeg', 'image/jpeg', 'image/png', 'image/webp']
where id = 'track-assets';

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
where id = 'protect-evidence';

drop policy if exists "public read artist assets" on storage.objects;
create policy "public read artist assets"
on storage.objects for select
using (
  bucket_id = 'artist-assets'
  and (
    lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
    or (
      lower(storage.extension(name)) = 'svg'
      and (storage.foldername(name))[2] = 'artist-logo-sanitized'
    )
  )
);

drop policy if exists "public read music assets" on storage.objects;
create policy "public read music assets"
on storage.objects for select
using (
  bucket_id in ('album-covers', 'track-assets')
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'mp3')
);

drop policy if exists "admin upload artist assets" on storage.objects;
create policy "admin upload artist assets"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'artist-assets'
  and public.is_admin()
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
  and metadata->>'mimetype' in ('image/jpeg', 'image/png', 'image/webp')
);

drop policy if exists "admin update artist assets" on storage.objects;
create policy "admin update artist assets"
on storage.objects for update to authenticated
using (bucket_id = 'artist-assets' and public.is_admin())
with check (
  bucket_id = 'artist-assets'
  and public.is_admin()
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
  and metadata->>'mimetype' in ('image/jpeg', 'image/png', 'image/webp')
);

drop policy if exists "admin upload music assets" on storage.objects;
create policy "admin upload music assets"
on storage.objects for insert to authenticated
with check (
  public.is_admin()
  and (
    (
      bucket_id = 'album-covers'
      and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
      and metadata->>'mimetype' in ('image/jpeg', 'image/png', 'image/webp')
    )
    or (
      bucket_id = 'track-assets'
      and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'mp3')
      and metadata->>'mimetype' in ('image/jpeg', 'image/png', 'image/webp', 'audio/mpeg')
    )
  )
);

drop policy if exists "admin update music assets" on storage.objects;
create policy "admin update music assets"
on storage.objects for update to authenticated
using (bucket_id in ('album-covers', 'track-assets') and public.is_admin())
with check (
  public.is_admin()
  and (
    (
      bucket_id = 'album-covers'
      and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
      and metadata->>'mimetype' in ('image/jpeg', 'image/png', 'image/webp')
    )
    or (
      bucket_id = 'track-assets'
      and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'mp3')
      and metadata->>'mimetype' in ('image/jpeg', 'image/png', 'image/webp', 'audio/mpeg')
    )
  )
);

drop policy if exists "users upload own protect evidence" on storage.objects;
create policy "users upload own protect evidence"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'protect-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf')
  and metadata->>'mimetype' in (
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'
  )
);

notify pgrst, 'reload schema';
