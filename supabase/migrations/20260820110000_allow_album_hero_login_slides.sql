begin;

create or replace function public.validate_login_slides()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_count integer;
  v_distinct_count integer;
begin
  if new.key <> 'login_slides' then return new; end if;
  if jsonb_typeof(new.value) <> 'array' then
    raise exception 'login slides must be an array' using errcode = '22023';
  end if;
  select count(*), count(distinct item->>'imageUrl')
  into v_count, v_distinct_count
  from jsonb_array_elements(new.value) item;
  if v_count > 5 or v_count <> v_distinct_count or exists (
    select 1 from jsonb_array_elements(new.value) item
    where jsonb_typeof(item) <> 'object'
      or coalesce(item->>'imageUrl', '') !~ '^(https?://|/)'
      or coalesce(item->>'title', '') = ''
      or coalesce(item->>'source', '') not in ('legacy', 'album-cover', 'album-hero', 'scene-hero', 'member-gallery')
  ) then
    raise exception 'invalid login slides' using errcode = '22023';
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
commit;
