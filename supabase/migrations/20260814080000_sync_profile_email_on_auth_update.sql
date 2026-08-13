begin;

create or replace function public.sync_profile_email_on_auth_update()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_profile_email_on_auth_update on auth.users;
create trigger sync_profile_email_on_auth_update
after update of email on auth.users
for each row execute function public.sync_profile_email_on_auth_update();

revoke all on function public.sync_profile_email_on_auth_update() from public, anon, authenticated, service_role;

commit;
