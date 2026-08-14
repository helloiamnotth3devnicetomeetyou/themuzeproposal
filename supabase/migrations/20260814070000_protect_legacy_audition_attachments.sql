begin;

drop function if exists public.reserve_r2_asset_deletions(text, text[], uuid);
drop function if exists public.complete_r2_asset_deletions(text, text[], uuid);
drop function if exists public.release_r2_asset_deletions(text, text[], uuid);

create or replace function public.audition_submission_has_attachment(p_path text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.audition_submissions submission
    where submission.attachment_path = p_path
       or submission.answers @? format('$.* ? (@.path == %s)', to_json(p_path))::jsonpath
  );
$$;

create or replace function public.r2_asset_is_referenced(p_bucket text, p_path text)
returns boolean language plpgsql stable security definer set search_path = pg_catalog, public as $$
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
    return exists (select 1 from public.albums where public.r2_asset_url_matches(p_bucket, p_path, cover_url) or public.r2_asset_url_matches(p_bucket, p_path, hero_image_url) or public.r2_asset_url_matches(p_bucket, p_path, typo_logo_url))
      or exists (select 1 from public.tracks where public.r2_asset_url_matches(p_bucket, p_path, logo_url));
  elsif p_bucket = 'track-assets' then
    return exists (select 1 from public.tracks where public.r2_asset_url_matches(p_bucket, p_path, audio_url) or public.r2_asset_url_matches(p_bucket, p_path, music_video_url) or public.r2_asset_url_matches(p_bucket, p_path, logo_url));
  elsif p_bucket = 'hero-videos' then
    return exists (select 1 from public.home_hero_slides where public.r2_asset_url_matches(p_bucket, p_path, video_url));
  elsif p_bucket = 'business-assets' then
    return exists (select 1 from public.site_settings where public.r2_asset_url_matches(p_bucket, p_path, value->>'pressKitUrl') or public.r2_asset_url_matches(p_bucket, p_path, value->>'profilePdfUrl'));
  elsif p_bucket = 'audition-attachments' then
    return public.audition_submission_has_attachment(p_path);
  end if;
  return false;
end;
$$;

create or replace function public.delete_audition_campaign(p_campaign_id uuid)
returns table (attachment_paths text[])
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_paths text[];
begin
  if not public.is_admin() then raise exception 'administrator access required' using errcode = '42501'; end if;
  if p_campaign_id is null then raise exception 'campaign is required' using errcode = '22023'; end if;
  perform 1 from public.audition_campaigns where id = p_campaign_id for update;
  if not found then raise exception 'campaign not found' using errcode = 'P0002'; end if;
  select coalesce(array_agg(distinct path), array[]::text[]) into v_paths
  from (
    select submission.attachment_path as path
    from public.audition_submissions submission
    where submission.campaign_id = p_campaign_id and submission.attachment_path is not null
    union all
    select answer.value->>'path'
    from public.audition_submissions submission
    cross join lateral jsonb_each(case when jsonb_typeof(submission.answers) = 'object' then submission.answers else '{}'::jsonb end) answer(key, value)
    where submission.campaign_id = p_campaign_id and jsonb_typeof(answer.value) = 'object' and jsonb_typeof(answer.value->'path') = 'string'
  ) paths where path <> '';
  delete from public.audition_submissions where campaign_id = p_campaign_id;
  delete from public.audition_campaigns where id = p_campaign_id;
  return query select v_paths;
end;
$$;

create or replace function public.reject_reserved_legacy_audition_attachment()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_path text;
begin
  v_path := new.attachment_path;
  if v_path is not null and v_path <> '' then
    perform pg_advisory_xact_lock(hashtextextended('audition-attachments' || chr(31) || v_path, 0));
    if exists (
      select 1 from public.asset_registry
      where bucket = 'audition-attachments' and path = v_path
    ) then
      raise exception 'asset is reserved for deletion' using errcode = '55P03';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists reject_reserved_legacy_audition_attachment on public.audition_submissions;
create trigger reject_reserved_legacy_audition_attachment
before insert or update on public.audition_submissions
for each row execute function public.reject_reserved_legacy_audition_attachment();

notify pgrst, 'reload schema';
commit;
