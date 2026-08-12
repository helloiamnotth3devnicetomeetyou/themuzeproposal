begin;

-- Stop deriving contact_inquiries.attachment_size from storage.objects: R2 objects no
-- longer live in that table, so the server route now passes the validated byte size
-- directly and this trigger only re-checks the invariants the CHECK constraint already
-- enforces at insert time.
create or replace function public.set_contact_attachment_size_from_storage()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $_$
begin
  if new.attachment_path is null then
    new.attachment_name := null;
    new.attachment_size := null;
    return new;
  end if;

  if new.category <> 'business'
    or new.attachment_name is null
    or split_part(new.attachment_path, '/', 1) <> new.id::text then
    raise exception 'invalid contact attachment' using errcode = '23514';
  end if;

  if new.attachment_size is null or new.attachment_size < 1 or new.attachment_size > 20971520 then
    raise exception 'contact attachment is missing or has an invalid size'
      using errcode = '23514';
  end if;

  return new;
end;
$_$;

-- Rewrite every stored Supabase Storage URL to the new R2 CDN domain. Update the two
-- literals below to match your project before running against production.
do $$
declare
  v_old_prefix text := 'https://kjsqwfhqjvekahacvfnc.supabase.co/storage/v1/object/public/';
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
