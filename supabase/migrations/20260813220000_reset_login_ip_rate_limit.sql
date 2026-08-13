begin;

drop function if exists public.reset_login_rate_limit(text);

create function public.reset_login_rate_limit(
  p_identifier_hash text,
  p_ip_hash text
) returns void
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  if length(p_identifier_hash) <> 64 or length(p_ip_hash) <> 64 then
    raise exception 'invalid rate limit key' using errcode = '22023';
  end if;

  delete from private.login_rate_limits
  where key_hash in (p_identifier_hash, p_ip_hash);
end;
$$;

revoke all on function public.reset_login_rate_limit(text, text)
  from public, anon, authenticated;
grant execute on function public.reset_login_rate_limit(text, text) to service_role;

notify pgrst, 'reload schema';
commit;
