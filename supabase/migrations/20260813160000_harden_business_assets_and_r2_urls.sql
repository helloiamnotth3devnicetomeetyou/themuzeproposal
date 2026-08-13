begin;

-- The application now serves files from R2, but this legacy bucket can still be
-- reached directly. A public bucket bypasses storage.objects RLS entirely, so
-- keep the bucket private and let the allowlist below decide what is readable.
update storage.buckets
set public = false
where id = 'business-assets';

drop policy if exists "admins manage business assets" on storage.objects;
drop policy if exists "public read business assets" on storage.objects;
create policy "public read business assets"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'business-assets'
  and (
    name in ('press-kit.zip', 'profile.pdf')
    or name ~ '^press-kit/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.zip$'
    or name ~ '^profile/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$'
  )
);

-- The R2 migrations may already have rewritten one of the two historical
-- Supabase project refs. Match the provider URL shape instead of baking either
-- project ref into this repair; already-migrated R2 URLs are left unchanged.
do $$
declare
  v_old_pattern text := '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/';
  v_new_prefix text := 'https://cdn.notth3.dev/';
begin
  update public.albums
  set cover_url = regexp_replace(cover_url, v_old_pattern, v_new_prefix),
      hero_image_url = regexp_replace(hero_image_url, v_old_pattern, v_new_prefix),
      typo_logo_url = regexp_replace(typo_logo_url, v_old_pattern, v_new_prefix)
  where cover_url ~ v_old_pattern
     or hero_image_url ~ v_old_pattern
     or typo_logo_url ~ v_old_pattern;

  update public.artists
  set logo_url = regexp_replace(logo_url, v_old_pattern, v_new_prefix),
      image_url = regexp_replace(image_url, v_old_pattern, v_new_prefix)
  where logo_url ~ v_old_pattern
     or image_url ~ v_old_pattern;

  update public.artist_gallery
  set image_url = regexp_replace(image_url, v_old_pattern, v_new_prefix)
  where image_url ~ v_old_pattern;

  update public.artist_members
  set image_url = regexp_replace(image_url, v_old_pattern, v_new_prefix)
  where image_url ~ v_old_pattern;

  update public.artist_scenes
  set image_url = regexp_replace(image_url, v_old_pattern, v_new_prefix)
  where image_url ~ v_old_pattern;

  update public.artist_scene_members
  set mask_url = regexp_replace(mask_url, v_old_pattern, v_new_prefix)
  where mask_url ~ v_old_pattern;

  update public.tracks
  set audio_url = regexp_replace(audio_url, v_old_pattern, v_new_prefix),
      music_video_url = regexp_replace(music_video_url, v_old_pattern, v_new_prefix),
      logo_url = regexp_replace(logo_url, v_old_pattern, v_new_prefix)
  where audio_url ~ v_old_pattern
     or music_video_url ~ v_old_pattern
     or logo_url ~ v_old_pattern;

  update public.home_hero_slides
  set video_url = regexp_replace(video_url, v_old_pattern, v_new_prefix)
  where video_url ~ v_old_pattern;

  update public.site_settings
  set value = jsonb_set(
    value,
    '{pressKitUrl}',
    to_jsonb(regexp_replace(value->>'pressKitUrl', v_old_pattern, v_new_prefix))
  )
  where key = 'business_assets'
    and (value->>'pressKitUrl') ~ v_old_pattern;

  update public.site_settings
  set value = jsonb_set(
    value,
    '{profilePdfUrl}',
    to_jsonb(regexp_replace(value->>'profilePdfUrl', v_old_pattern, v_new_prefix))
  )
  where key = 'business_assets'
    and (value->>'profilePdfUrl') ~ v_old_pattern;
end $$;

commit;
