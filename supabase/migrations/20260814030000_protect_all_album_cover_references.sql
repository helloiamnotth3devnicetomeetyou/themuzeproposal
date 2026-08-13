begin;

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
      or exists (select 1 from public.avatar_assets where image_path = p_path);
  elsif p_bucket = 'album-covers' then
    return exists (
      select 1 from public.albums
      where public.r2_asset_url_matches(p_bucket, p_path, cover_url)
         or public.r2_asset_url_matches(p_bucket, p_path, hero_image_url)
         or public.r2_asset_url_matches(p_bucket, p_path, typo_logo_url)
    ) or exists (
      select 1 from public.tracks
      where public.r2_asset_url_matches(p_bucket, p_path, logo_url)
    );
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

notify pgrst, 'reload schema';
commit;
