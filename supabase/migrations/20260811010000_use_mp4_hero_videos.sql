begin;

update storage.buckets
set file_size_limit = 18874368,
    allowed_mime_types = array['video/mp4']::text[]
where id = 'hero-videos';

commit;
