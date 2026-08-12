begin;

-- The prior migration (20260813010000) rewrote Supabase Storage URLs using a stale
-- project hostname copied from old data-import migration files. This project's actual
-- Supabase host is knbingxnnkutnukjyucw.supabase.co; finish the R2 URL rewrite here.
do $$
declare
  v_old_prefix text := 'https://knbingxnnkutnukjyucw.supabase.co/storage/v1/object/public/';
  v_new_prefix text := 'https://cdn.notth3.dev/';
begin
  update public.albums set cover_url = v_new_prefix || substr(cover_url, length(v_old_prefix) + 1)
    where cover_url like v_old_prefix || '%';
  update public.albums set hero_image_url = v_new_prefix || substr(hero_image_url, length(v_old_prefix) + 1)
    where hero_image_url like v_old_prefix || '%';
  update public.albums set typo_logo_url = v_new_prefix || substr(typo_logo_url, length(v_old_prefix) + 1)
    where typo_logo_url like v_old_prefix || '%';

  update public.artists set logo_url = v_new_prefix || substr(logo_url, length(v_old_prefix) + 1)
    where logo_url like v_old_prefix || '%';
  update public.artists set image_url = v_new_prefix || substr(image_url, length(v_old_prefix) + 1)
    where image_url like v_old_prefix || '%';

  update public.artist_gallery set image_url = v_new_prefix || substr(image_url, length(v_old_prefix) + 1)
    where image_url like v_old_prefix || '%';
  update public.artist_members set image_url = v_new_prefix || substr(image_url, length(v_old_prefix) + 1)
    where image_url like v_old_prefix || '%';
  update public.artist_scenes set image_url = v_new_prefix || substr(image_url, length(v_old_prefix) + 1)
    where image_url like v_old_prefix || '%';
  update public.artist_scene_members set mask_url = v_new_prefix || substr(mask_url, length(v_old_prefix) + 1)
    where mask_url like v_old_prefix || '%';

  update public.tracks set audio_url = v_new_prefix || substr(audio_url, length(v_old_prefix) + 1)
    where audio_url like v_old_prefix || '%';
  update public.tracks set music_video_url = v_new_prefix || substr(music_video_url, length(v_old_prefix) + 1)
    where music_video_url like v_old_prefix || '%';
  update public.tracks set logo_url = v_new_prefix || substr(logo_url, length(v_old_prefix) + 1)
    where logo_url like v_old_prefix || '%';

  update public.home_hero_slides set video_url = v_new_prefix || substr(video_url, length(v_old_prefix) + 1)
    where video_url like v_old_prefix || '%';

  update public.site_settings
    set value = jsonb_set(value, '{pressKitUrl}', to_jsonb(v_new_prefix || substr(value->>'pressKitUrl', length(v_old_prefix) + 1)))
    where key = 'business_assets' and value->>'pressKitUrl' like v_old_prefix || '%';
  update public.site_settings
    set value = jsonb_set(value, '{profilePdfUrl}', to_jsonb(v_new_prefix || substr(value->>'profilePdfUrl', length(v_old_prefix) + 1)))
    where key = 'business_assets' and value->>'profilePdfUrl' like v_old_prefix || '%';
end $$;

commit;
