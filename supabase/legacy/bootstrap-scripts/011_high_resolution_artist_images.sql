-- Raise the artist-assets bucket limit to 30MB for high-resolution profile and member images.
update storage.buckets
set file_size_limit = 31457280
where id = 'artist-assets';
