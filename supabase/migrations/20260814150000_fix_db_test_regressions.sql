-- PostgreSQL text values cannot contain NUL. Rebuild every reservation
-- function using the same non-NUL advisory-lock separator.
do $$
declare
  v_function record;
begin
  for v_function in
    select p.oid
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosrc like '%chr(0)%'
  loop
    execute replace(pg_get_functiondef(v_function.oid), 'chr(0)', 'chr(31)');
  end loop;
end;
$$;

-- UUIDs are table-local, but a colliding ID from another artist entity must
-- not be accepted as a gallery row by the checked save RPC.
create or replace function public.enforce_artist_gallery_id_ownership()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if exists (
    select 1
    from public.artist_members as member
    where member.id = new.id
      and member.artist_id is distinct from new.artist_id
  ) then
    raise exception 'GALLERY_ROW_DOES_NOT_BELONG_TO_ARTIST' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_artist_gallery_id_ownership on public.artist_gallery;
create trigger enforce_artist_gallery_id_ownership
before insert or update on public.artist_gallery
for each row execute function public.enforce_artist_gallery_id_ownership();

revoke all on function public.enforce_artist_gallery_id_ownership() from public, anon, authenticated;
