begin;

-- A page save is one transaction. Validate every caller-supplied ID before the
-- first delete so a bad row cannot leave a half-saved scene or gallery.
create or replace function public.save_artist_gallery(
  p_artist_id uuid,
  p_items jsonb,
  p_removed_ids uuid[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_item jsonb;
  v_id uuid;
  v_album_id uuid;
  v_member_id uuid;
  v_image_url text;
  v_caption text;
  v_sort_order integer;
  v_is_published boolean;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_artist_id is null or p_items is null or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'INVALID_GALLERY_PAYLOAD' using errcode = '22023';
  end if;
  p_removed_ids := coalesce(p_removed_ids, '{}'::uuid[]);

  if exists (
    select 1
    from public.artist_gallery as gallery
    where gallery.id = any (p_removed_ids)
      and gallery.artist_id is distinct from p_artist_id
  ) then
    raise exception 'GALLERY_ROW_DOES_NOT_BELONG_TO_ARTIST' using errcode = '22023';
  end if;

  -- Parse and validate the complete payload before mutating any rows.
  for v_item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_item) is distinct from 'object'
      or nullif(v_item->>'id', '') is null then
      raise exception 'INVALID_GALLERY_ITEM' using errcode = '22023';
    end if;
    v_id := (v_item->>'id')::uuid;
    if v_id = any (p_removed_ids) then
      raise exception 'GALLERY_ITEM_CANNOT_BE_REMOVED_AND_SAVED' using errcode = '22023';
    end if;
    if v_item ? 'artist_id' and (v_item->>'artist_id')::uuid is distinct from p_artist_id then
      raise exception 'GALLERY_ROW_DOES_NOT_BELONG_TO_ARTIST' using errcode = '22023';
    end if;
    if exists (
      select 1
      from public.artist_gallery as gallery
      where gallery.id = v_id
        and gallery.artist_id is distinct from p_artist_id
    ) then
      raise exception 'GALLERY_ROW_DOES_NOT_BELONG_TO_ARTIST' using errcode = '22023';
    end if;
    if exists (
      select 1
      from public.artist_members as member
      where member.id = v_id
        and member.artist_id is distinct from p_artist_id
    ) then
      raise exception 'GALLERY_ROW_DOES_NOT_BELONG_TO_ARTIST' using errcode = '22023';
    end if;
    v_album_id := nullif(v_item->>'album_id', '')::uuid;
    v_member_id := nullif(v_item->>'member_id', '')::uuid;
    v_image_url := nullif(btrim(coalesce(v_item->>'image_url', '')), '');
    if v_image_url is null then
      raise exception 'GALLERY_IMAGE_REQUIRED' using errcode = '22023';
    end if;
    v_caption := coalesce(v_item->>'caption', '');
    v_sort_order := coalesce(nullif(v_item->>'sort_order', '')::integer, 0);
    v_is_published := coalesce(nullif(v_item->>'is_published', '')::boolean, true);
  end loop;

  delete from public.artist_gallery as gallery
  where gallery.artist_id = p_artist_id
    and gallery.id = any (p_removed_ids);

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_id := (v_item->>'id')::uuid;
    v_album_id := nullif(v_item->>'album_id', '')::uuid;
    v_member_id := nullif(v_item->>'member_id', '')::uuid;
    v_image_url := btrim(v_item->>'image_url');
    v_caption := coalesce(v_item->>'caption', '');
    v_sort_order := coalesce(nullif(v_item->>'sort_order', '')::integer, 0);
    v_is_published := coalesce(nullif(v_item->>'is_published', '')::boolean, true);

    insert into public.artist_gallery (
      id, artist_id, album_id, member_id, image_url, caption, sort_order, is_published
    ) values (
      v_id, p_artist_id, v_album_id, v_member_id, v_image_url, v_caption, v_sort_order, v_is_published
    )
    on conflict (id) do update set
      artist_id = excluded.artist_id,
      album_id = excluded.album_id,
      member_id = excluded.member_id,
      image_url = excluded.image_url,
      caption = excluded.caption,
      sort_order = excluded.sort_order,
      is_published = excluded.is_published;
  end loop;
end;
$$;

create or replace function public.save_artist_scenes(
  p_artist_id uuid,
  p_scenes jsonb,
  p_removed_scene_ids uuid[] default '{}',
  p_removed_region_ids uuid[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_scene jsonb;
  v_region jsonb;
  v_scene_id uuid;
  v_region_id uuid;
  v_member_id uuid;
  v_existing_scene_id uuid;
  v_image_url text;
  v_title text;
  v_title_ko text;
  v_title_en text;
  v_title_ja text;
  v_link_url text;
  v_image_width integer;
  v_image_height integer;
  v_is_hero boolean;
  v_is_published boolean;
  v_sort_order integer;
  v_outline jsonb;
  v_mask_url text;
  v_region_sort_order integer;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_artist_id is null or p_scenes is null or jsonb_typeof(p_scenes) is distinct from 'array' then
    raise exception 'INVALID_SCENE_PAYLOAD' using errcode = '22023';
  end if;
  p_removed_scene_ids := coalesce(p_removed_scene_ids, '{}'::uuid[]);
  p_removed_region_ids := coalesce(p_removed_region_ids, '{}'::uuid[]);

  if exists (
    select 1
    from public.artist_scenes as scene
    where scene.id = any (p_removed_scene_ids)
      and scene.artist_id is distinct from p_artist_id
  ) then
    raise exception 'SCENE_DOES_NOT_BELONG_TO_ARTIST' using errcode = '22023';
  end if;
  if exists (
    select 1
    from public.artist_scene_members as region
    join public.artist_scenes as scene on scene.id = region.scene_id
    where region.id = any (p_removed_region_ids)
      and scene.artist_id is distinct from p_artist_id
  ) then
    raise exception 'SCENE_REGION_DOES_NOT_BELONG_TO_ARTIST' using errcode = '22023';
  end if;

  -- Validate scenes, member regions, and existing IDs before the first write.
  for v_scene in select value from jsonb_array_elements(p_scenes) loop
    if jsonb_typeof(v_scene) is distinct from 'object'
      or nullif(v_scene->>'id', '') is null then
      raise exception 'INVALID_SCENE_ITEM' using errcode = '22023';
    end if;
    v_scene_id := (v_scene->>'id')::uuid;
    if v_scene_id = any (p_removed_scene_ids) then
      raise exception 'SCENE_CANNOT_BE_REMOVED_AND_SAVED' using errcode = '22023';
    end if;
    if v_scene ? 'artist_id' and (v_scene->>'artist_id')::uuid is distinct from p_artist_id then
      raise exception 'SCENE_DOES_NOT_BELONG_TO_ARTIST' using errcode = '22023';
    end if;
    if exists (
      select 1
      from public.artist_scenes as scene
      where scene.id = v_scene_id
        and scene.artist_id is distinct from p_artist_id
    ) then
      raise exception 'SCENE_DOES_NOT_BELONG_TO_ARTIST' using errcode = '22023';
    end if;
    v_image_url := nullif(btrim(coalesce(v_scene->>'image_url', '')), '');
    if v_image_url is null then
      raise exception 'SCENE_IMAGE_REQUIRED' using errcode = '22023';
    end if;
    if v_scene ? 'artist_scene_members'
      and jsonb_typeof(v_scene->'artist_scene_members') is distinct from 'array' then
      raise exception 'INVALID_SCENE_REGIONS' using errcode = '22023';
    end if;

    for v_region in
      select value from jsonb_array_elements(coalesce(v_scene->'artist_scene_members', '[]'::jsonb))
    loop
      if jsonb_typeof(v_region) is distinct from 'object'
        or nullif(v_region->>'id', '') is null
        or nullif(v_region->>'member_id', '') is null then
        raise exception 'INVALID_SCENE_REGION' using errcode = '22023';
      end if;
      v_region_id := (v_region->>'id')::uuid;
      v_member_id := (v_region->>'member_id')::uuid;
      if v_region ? 'scene_id' and (v_region->>'scene_id')::uuid is distinct from v_scene_id then
        raise exception 'SCENE_REGION_DOES_NOT_BELONG_TO_SCENE' using errcode = '22023';
      end if;
      select region.scene_id
        into v_existing_scene_id
      from public.artist_scene_members as region
      where region.id = v_region_id;
      if v_existing_scene_id is not null and v_existing_scene_id is distinct from v_scene_id then
        raise exception 'SCENE_REGION_DOES_NOT_BELONG_TO_SCENE' using errcode = '22023';
      end if;
      v_outline := coalesce(v_region->'outline', '[]'::jsonb);
      if jsonb_typeof(v_outline) is distinct from 'array'
        or jsonb_array_length(v_outline) < 3 then
        raise exception 'INVALID_SCENE_OUTLINE' using errcode = '22023';
      end if;
    end loop;
  end loop;

  delete from public.artist_scenes as scene
  where scene.artist_id = p_artist_id
    and scene.id = any (p_removed_scene_ids);
  delete from public.artist_scene_members as region
  where region.id = any (p_removed_region_ids);

  for v_scene in select value from jsonb_array_elements(p_scenes) loop
    v_scene_id := (v_scene->>'id')::uuid;
    v_title := coalesce(v_scene->>'title', '');
    v_title_ko := nullif(v_scene->>'title_ko', '');
    v_title_en := nullif(v_scene->>'title_en', '');
    v_title_ja := nullif(v_scene->>'title_ja', '');
    v_link_url := nullif(v_scene->>'link_url', '');
    v_image_url := btrim(v_scene->>'image_url');
    v_image_width := nullif(v_scene->>'image_width', '')::integer;
    v_image_height := nullif(v_scene->>'image_height', '')::integer;
    v_is_hero := coalesce(nullif(v_scene->>'is_hero', '')::boolean, false);
    v_is_published := coalesce(nullif(v_scene->>'is_published', '')::boolean, true);
    v_sort_order := coalesce(nullif(v_scene->>'sort_order', '')::integer, 0);

    insert into public.artist_scenes (
      id, artist_id, title, title_ko, title_en, title_ja, link_url, image_url,
      image_width, image_height, is_hero, is_published, sort_order
    ) values (
      v_scene_id, p_artist_id, v_title, v_title_ko, v_title_en, v_title_ja, v_link_url, v_image_url,
      v_image_width, v_image_height, v_is_hero, v_is_published, v_sort_order
    )
    on conflict (id) do update set
      artist_id = excluded.artist_id,
      title = excluded.title,
      title_ko = excluded.title_ko,
      title_en = excluded.title_en,
      title_ja = excluded.title_ja,
      link_url = excluded.link_url,
      image_url = excluded.image_url,
      image_width = excluded.image_width,
      image_height = excluded.image_height,
      is_hero = excluded.is_hero,
      is_published = excluded.is_published,
      sort_order = excluded.sort_order;

    for v_region in
      select value from jsonb_array_elements(coalesce(v_scene->'artist_scene_members', '[]'::jsonb))
    loop
      v_region_id := (v_region->>'id')::uuid;
      v_member_id := (v_region->>'member_id')::uuid;
      v_outline := coalesce(v_region->'outline', '[]'::jsonb);
      v_mask_url := nullif(v_region->>'mask_url', '');
      v_region_sort_order := coalesce(nullif(v_region->>'sort_order', '')::integer, 0);

      insert into public.artist_scene_members (
        id, scene_id, member_id, outline, mask_url, sort_order
      ) values (
        v_region_id, v_scene_id, v_member_id, v_outline, v_mask_url, v_region_sort_order
      )
      on conflict (id) do update set
        scene_id = excluded.scene_id,
        member_id = excluded.member_id,
        outline = excluded.outline,
        mask_url = excluded.mask_url,
        sort_order = excluded.sort_order;
    end loop;
  end loop;
end;
$$;

revoke all on function public.save_artist_gallery(uuid, jsonb, uuid[]) from public, anon;
grant execute on function public.save_artist_gallery(uuid, jsonb, uuid[]) to authenticated, service_role;
revoke all on function public.save_artist_scenes(uuid, jsonb, uuid[], uuid[]) from public, anon;
grant execute on function public.save_artist_scenes(uuid, jsonb, uuid[], uuid[]) to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
