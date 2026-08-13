begin;

drop policy if exists "editors read referenced account avatars" on public.profiles;

create or replace function public.get_referenced_account_avatars(p_user_ids uuid[])
returns table (id uuid, avatar_asset_id uuid)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
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

revoke all on function public.get_referenced_account_avatars(uuid[]) from public, anon;
grant execute on function public.get_referenced_account_avatars(uuid[]) to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
