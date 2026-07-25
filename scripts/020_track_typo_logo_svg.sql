-- Allow SVG typography logos in the shared music asset bucket.
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
