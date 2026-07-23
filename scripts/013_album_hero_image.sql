-- Separate wide homepage artwork from the square discography cover.

alter table public.albums
  add column if not exists hero_image_url text;

update storage.buckets
set file_size_limit = 31457280
where id = 'album-covers';
