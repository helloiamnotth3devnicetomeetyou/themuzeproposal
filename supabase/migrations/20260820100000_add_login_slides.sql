begin;

insert into public.site_settings (key, value)
values (
  'login_slides',
  '[
    {"id":"legacy-1","imageUrl":"/images/hero_1.webp","title":"PRETTY GIRL","source":"legacy"},
    {"id":"legacy-2","imageUrl":"/images/hero_2.webp","title":"RUNAWAY","source":"legacy"},
    {"id":"legacy-3","imageUrl":"/images/hero_3.webp","title":"LIP BOMB","source":"legacy"},
    {"id":"legacy-4","imageUrl":"/images/hero_4.webp","title":"GLOW UP","source":"legacy"},
    {"id":"legacy-5","imageUrl":"/images/hero_5.webp","title":"SCENEDROME","source":"legacy"}
  ]'::jsonb
)
on conflict (key) do nothing;

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
      or coalesce(item->>'source', '') not in ('legacy', 'album-cover', 'scene-hero', 'member-gallery')
  ) then
    raise exception 'invalid login slides' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_login_slides on public.site_settings;
create trigger validate_login_slides
before insert or update of key, value on public.site_settings
for each row execute function public.validate_login_slides();

create or replace function public.reject_reserved_login_slide_reference()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_url text;
  v_bucket text;
  v_path text;
  v_marker text;
  v_position integer;
begin
  if new.key <> 'login_slides' or jsonb_typeof(new.value) <> 'array' then
    return new;
  end if;
  for v_url in select item->>'imageUrl' from jsonb_array_elements(new.value) item loop
    foreach v_bucket in array array['artist-assets', 'album-covers'] loop
      v_marker := '/' || v_bucket || '/';
      v_position := strpos(v_url, v_marker);
      if v_position > 0 then
        v_path := split_part(split_part(substr(v_url, v_position + length(v_marker)), '?', 1), '#', 1);
        if v_path ~ '^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.[a-zA-Z0-9]+$' then
          perform pg_advisory_xact_lock(hashtextextended(v_bucket || chr(31) || v_path, 0));
          if exists (select 1 from public.asset_registry where bucket = v_bucket and path = v_path) then
            raise exception 'asset is reserved for deletion' using errcode = '55P03';
          end if;
        end if;
      end if;
    end loop;
  end loop;
  return new;
end;
$$;

drop trigger if exists reject_reserved_login_slide_reference on public.site_settings;
create trigger reject_reserved_login_slide_reference
before insert or update of key, value on public.site_settings
for each row execute function public.reject_reserved_login_slide_reference();

create or replace function public.r2_asset_is_referenced(p_bucket text, p_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_bucket = 'artist-assets' then
    return exists (select 1 from public.artists where public.r2_asset_url_matches(p_bucket, p_path, logo_url) or public.r2_asset_url_matches(p_bucket, p_path, image_url))
      or exists (select 1 from public.albums where public.r2_asset_url_matches(p_bucket, p_path, cover_url) or public.r2_asset_url_matches(p_bucket, p_path, hero_image_url) or public.r2_asset_url_matches(p_bucket, p_path, typo_logo_url))
      or exists (select 1 from public.artist_gallery where public.r2_asset_url_matches(p_bucket, p_path, image_url))
      or exists (select 1 from public.artist_members where public.r2_asset_url_matches(p_bucket, p_path, image_url))
      or exists (select 1 from public.artist_scenes where public.r2_asset_url_matches(p_bucket, p_path, image_url))
      or exists (select 1 from public.artist_scene_members where public.r2_asset_url_matches(p_bucket, p_path, mask_url))
      or exists (select 1 from public.tracks where public.r2_asset_url_matches(p_bucket, p_path, audio_url) or public.r2_asset_url_matches(p_bucket, p_path, music_video_url) or public.r2_asset_url_matches(p_bucket, p_path, logo_url))
      or exists (select 1 from public.home_hero_slides where public.r2_asset_url_matches(p_bucket, p_path, video_url))
      or exists (select 1 from public.avatar_assets where image_path = p_path)
      or exists (select 1 from public.site_settings settings, jsonb_array_elements(coalesce(case when settings.key = 'login_slides' and jsonb_typeof(settings.value) = 'array' then settings.value end, '[]'::jsonb)) item where public.r2_asset_url_matches(p_bucket, p_path, item->>'imageUrl'));
  elsif p_bucket = 'album-covers' then
    return exists (select 1 from public.albums where public.r2_asset_url_matches(p_bucket, p_path, cover_url) or public.r2_asset_url_matches(p_bucket, p_path, hero_image_url) or public.r2_asset_url_matches(p_bucket, p_path, typo_logo_url))
      or exists (select 1 from public.tracks where public.r2_asset_url_matches(p_bucket, p_path, logo_url))
      or exists (select 1 from public.site_settings settings, jsonb_array_elements(coalesce(case when settings.key = 'login_slides' and jsonb_typeof(settings.value) = 'array' then settings.value end, '[]'::jsonb)) item where public.r2_asset_url_matches(p_bucket, p_path, item->>'imageUrl'));
  elsif p_bucket = 'track-assets' then
    return exists (select 1 from public.tracks where public.r2_asset_url_matches(p_bucket, p_path, audio_url) or public.r2_asset_url_matches(p_bucket, p_path, music_video_url) or public.r2_asset_url_matches(p_bucket, p_path, logo_url));
  elsif p_bucket = 'hero-videos' then
    return exists (select 1 from public.home_hero_slides where public.r2_asset_url_matches(p_bucket, p_path, video_url));
  elsif p_bucket = 'business-assets' then
    return exists (select 1 from public.site_settings where public.r2_asset_url_matches(p_bucket, p_path, value->>'pressKitUrl') or public.r2_asset_url_matches(p_bucket, p_path, value->>'profilePdfUrl'));
  elsif p_bucket = 'audition-attachments' then
    return exists (select 1 from public.audition_submissions submission where submission.answers @? format('$.* ? (@.path == %s)', to_json(p_path))::jsonpath);
  end if;
  return false;
end;
$$;

drop policy if exists "public read published site settings" on public.site_settings;
create policy "public read published site settings"
  on public.site_settings for select to anon, authenticated
  using (key in ('company', 'history', 'footer', 'social', 'business_assets', 'login_slides'));

notify pgrst, 'reload schema';
commit;
