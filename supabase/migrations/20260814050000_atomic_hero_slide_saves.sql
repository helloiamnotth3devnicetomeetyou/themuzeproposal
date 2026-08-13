begin;

create or replace function public.save_home_hero_slides(
  p_slides jsonb,
  p_removed_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_slide jsonb;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;
  if p_slides is null or jsonb_typeof(p_slides) <> 'array' then
    raise exception 'slides must be a JSON array' using errcode = '22023';
  end if;
  p_removed_ids := coalesce(p_removed_ids, '{}'::uuid[]);
  if (select count(*) from jsonb_array_elements(p_slides)) <>
     (select count(distinct value->>'id') from jsonb_array_elements(p_slides)) then
    raise exception 'slide ids must be unique' using errcode = '22023';
  end if;

  perform 1 from public.home_hero_slides for update;
  for v_slide in select value from jsonb_array_elements(p_slides) loop
    if jsonb_typeof(v_slide) <> 'object' or nullif(v_slide->>'id', '') is null
      or nullif(v_slide->>'album_id', '') is null then
      raise exception 'slide id and album id are required' using errcode = '22023';
    end if;
    v_id := (v_slide->>'id')::uuid;
    if v_id = any(p_removed_ids) then
      raise exception 'slide cannot be removed and saved' using errcode = '22023';
    end if;
  end loop;

  delete from public.home_hero_slides where id = any(p_removed_ids);
  for v_slide in select value from jsonb_array_elements(p_slides) loop
    insert into public.home_hero_slides (id, album_id, sort_order, is_active, video_url)
    values (
      (v_slide->>'id')::uuid,
      (v_slide->>'album_id')::uuid,
      coalesce(nullif(v_slide->>'sort_order', '')::integer, 0),
      coalesce((v_slide->>'is_active')::boolean, true),
      nullif(v_slide->>'video_url', '')
    ) on conflict (id) do update set
      album_id = excluded.album_id,
      sort_order = excluded.sort_order,
      is_active = excluded.is_active,
      video_url = excluded.video_url;
  end loop;
end;
$$;

revoke all on function public.save_home_hero_slides(jsonb, uuid[]) from public, anon;
grant execute on function public.save_home_hero_slides(jsonb, uuid[]) to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
