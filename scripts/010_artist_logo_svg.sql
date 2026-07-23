-- Allow SVG originals for artist logo uploads in existing environments.
update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/svg+xml']
where id = 'artist-assets';
