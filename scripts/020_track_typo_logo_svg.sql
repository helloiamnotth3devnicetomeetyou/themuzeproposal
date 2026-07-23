-- Allow SVG typography logos for track assets in existing environments.
update storage.buckets
set allowed_mime_types = array[
  'audio/mpeg',
  'video/mp4',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml'
]
where id = 'track-assets';
