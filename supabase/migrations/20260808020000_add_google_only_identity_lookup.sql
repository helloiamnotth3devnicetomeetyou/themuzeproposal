create or replace function public.is_google_only_email(p_email text)
returns boolean
language sql
stable
security definer
set search_path = auth, public, pg_temp
as $$
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

revoke all on function public.is_google_only_email(text)
  from public, anon, authenticated;
grant execute on function public.is_google_only_email(text) to service_role;
