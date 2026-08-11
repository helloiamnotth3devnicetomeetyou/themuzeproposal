begin;

alter table public.home_hero_slides
  add column if not exists video_url text;

alter table public.home_hero_slides
  drop constraint if exists home_hero_slides_video_url_http_check;
alter table public.home_hero_slides
  add constraint home_hero_slides_video_url_http_check
  check (video_url is null or btrim(video_url) ~* '^https?://[^[:space:]]+$');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hero-videos', 'hero-videos', true, 31457280, array['video/webm']::text[])
on conflict (id) do update set
  public = true,
  file_size_limit = 31457280,
  allowed_mime_types = array['video/webm']::text[];

drop policy if exists "public read hero videos" on storage.objects;
create policy "public read hero videos" on storage.objects for select
using (bucket_id = 'hero-videos');

notify pgrst, 'reload schema';
commit;
