-- Artist and member image assets.
-- Run after 001_discography.sql.

alter table public.artists
  add column if not exists logo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'artist-assets',
  'artist-assets',
  true,
  31457280,
  array['image/jpeg','image/png','image/webp','image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read artist assets" on storage.objects;
create policy "public read artist assets"
on storage.objects for select
using (bucket_id = 'artist-assets');

drop policy if exists "admin upload artist assets" on storage.objects;
create policy "admin upload artist assets"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'artist-assets'
  and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

drop policy if exists "admin update artist assets" on storage.objects;
create policy "admin update artist assets"
on storage.objects for update to authenticated
using (
  bucket_id = 'artist-assets'
  and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
)
with check (
  bucket_id = 'artist-assets'
  and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

drop policy if exists "admin delete artist assets" on storage.objects;
create policy "admin delete artist assets"
on storage.objects for delete to authenticated
using (
  bucket_id = 'artist-assets'
  and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
